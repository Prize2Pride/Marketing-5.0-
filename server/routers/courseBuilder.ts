import { TRPCError } from "@trpc/server";
import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";
import { courseBlueprints, creatorArtifacts } from "../../drizzle/schema";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";

const blueprintSchema = {
  name: "prize2pride_course_blueprint",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      outcomes: { type: "array", items: { type: "string" } },
      modules: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            purpose: { type: "string" },
            lessons: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  objective: { type: "string" },
                  explanation: { type: "string" },
                  example: { type: "string" },
                  practice: { type: "string" },
                  assessment: { type: "string" },
                },
                required: ["title", "objective", "explanation", "example", "practice", "assessment"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "purpose", "lessons"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "summary", "outcomes", "modules"],
    additionalProperties: false,
  },
} as const;

export const courseBuilderRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(courseBlueprints).where(eq(courseBlueprints.userId, ctx.user.id)).orderBy(desc(courseBlueprints.createdAt)).limit(30);
  }),

  getBlueprint: protectedProcedure
    .input(z.object({ blueprintId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [blueprint] = await db.select().from(courseBlueprints).where(and(eq(courseBlueprints.id, input.blueprintId), eq(courseBlueprints.userId, ctx.user.id))).limit(1);
      return blueprint ?? null;
    }),

  createBlueprint: protectedProcedure
    .input(z.object({ title: z.string().trim().min(3).max(255), brief: z.string().trim().min(20).max(5000), audience: z.string().trim().min(3).max(255), language: z.enum(["en", "fr", "ar"]).default("en"), moduleCount: z.number().int().min(2).max(12).default(6) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Course Builder is temporarily unavailable." });
      const started = await db.insert(courseBlueprints).values({ userId: ctx.user.id, title: input.title, brief: input.brief, audience: input.audience, language: input.language, status: "generating" });
      const blueprintId = Number((started as any)[0]?.insertId ?? (started as any).insertId);
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          maxTokens: 6000,
          outputSchema: blueprintSchema,
          messages: [
            { role: "system", content: `You are Coach Roued AI Avatar, designing a rigorous, original, multilingual course blueprint for Prize2Pride. Respond in ${input.language === "ar" ? "clear Arabic or Tunisian Darja" : input.language === "fr" ? "French" : "English"}. Create exactly ${input.moduleCount} progressive modules. Every lesson needs an objective, concise explanation, a small realistic original example, applied practice, and formative assessment. Clearly separate established facts from emerging research when relevant. Do not copy proprietary curricula or make unsupported claims.` },
            { role: "user", content: `Course title: ${input.title}\nAudience: ${input.audience}\nCourse brief: ${input.brief}` },
          ],
        });
        const raw = response.choices?.[0]?.message?.content;
        const outline = JSON.parse(typeof raw === "string" ? raw : "{}") as Record<string, unknown>;
        await db.update(courseBlueprints).set({ title: typeof outline.title === "string" && outline.title.trim() ? outline.title.slice(0, 255) : input.title, outline, status: "ready" }).where(eq(courseBlueprints.id, blueprintId));
        const [blueprint] = await db.select().from(courseBlueprints).where(eq(courseBlueprints.id, blueprintId)).limit(1);
        return blueprint;
      } catch (error) {
        await db.update(courseBlueprints).set({ status: "failed" }).where(eq(courseBlueprints.id, blueprintId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Coach Roued could not generate this course blueprint. Please refine the brief and try again." });
      }
    }),

  createLessonDraft: protectedProcedure
    .input(z.object({ blueprintId: z.number(), moduleIndex: z.number().int().min(0), lessonIndex: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Course Builder is temporarily unavailable." });
      const [blueprint] = await db.select().from(courseBlueprints).where(and(eq(courseBlueprints.id, input.blueprintId), eq(courseBlueprints.userId, ctx.user.id), eq(courseBlueprints.status, "ready"))).limit(1);
      if (!blueprint || !blueprint.outline) throw new TRPCError({ code: "NOT_FOUND", message: "Ready course blueprint not found." });
      const outline = blueprint.outline as any;
      const module = Array.isArray(outline.modules) ? outline.modules[input.moduleIndex] : null;
      const lesson = module && Array.isArray(module.lessons) ? module.lessons[input.lessonIndex] : null;
      if (!module || !lesson) throw new TRPCError({ code: "BAD_REQUEST", message: "Course lesson selection is invalid." });
      const content = `# ${lesson.title}\n\n## Objective\n${lesson.objective}\n\n## Explanation\n${lesson.explanation}\n\n## Worked Example\n${lesson.example ?? "Add a contextual example during review before publication."}\n\n## Applied Practice\n${lesson.practice}\n\n## Knowledge Check\n${lesson.assessment}\n\n---\n\n*Draft generated from the reviewed course blueprint “${blueprint.title}”. Review before learner publication.*`;
      const result = await db.insert(creatorArtifacts).values({ userId: ctx.user.id, kind: "lesson", title: lesson.title.slice(0, 255), prompt: `Course blueprint lesson: ${blueprint.title} / ${module.title}`, language: blueprint.language, status: "ready", content, metadata: { courseBlueprintId: blueprint.id, moduleIndex: input.moduleIndex, lessonIndex: input.lessonIndex } });
      return { artifactId: Number((result as any)[0]?.insertId ?? (result as any).insertId) };
    }),
});
