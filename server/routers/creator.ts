import { TRPCError } from "@trpc/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  artifactSections,
  chapterProgress,
  creatorArtifacts,
  learnerProfiles,
  learningProjects,
  teachingResources,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { generateImage } from "../_core/imageGeneration";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const artifactKinds = [
  "lesson",
  "book",
  "document",
  "code",
  "spreadsheet",
  "chart_spec",
  "infographic",
  "poster",
  "audio_brief",
  "video_brief",
  "quiz",
] as const;

const artifactInput = z.object({
  kind: z.enum(artifactKinds),
  title: z.string().trim().min(3).max(160),
  prompt: z.string().trim().min(12).max(4000),
  language: z.enum(["en", "fr", "ar"]).default("en"),
  sourceArtifactId: z.number().int().positive().optional(),
  sourceResourceId: z.number().int().positive().optional(),
});

const generatedArtifactSchema = {
  name: "prize2pride_creator_artifact",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      content: { type: "string" },
      imagePrompt: { type: "string" },
      nextStep: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
          },
          required: ["title", "summary"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "content", "imagePrompt", "nextStep", "sections"],
    additionalProperties: false,
  },
} as const;

function artifactInstructions(kind: (typeof artifactKinds)[number]) {
  const shared = "Use original work only. Do not reproduce proprietary course material, trademarks, or copyrighted text. Keep the result practical, precise, and usable by a digital marketing learner.";
  const byKind: Record<(typeof artifactKinds)[number], string> = {
    lesson: "Create a concise learning lesson with objective, explanation, practical exercise, and knowledge check.",
    book: "Create a durable long-form book blueprint, including positioning, reader promise, detailed table of contents, and up to 16 section plans. Do not pretend to write hundreds of pages in one response; produce a reviewable blueprint that can be expanded section by section.",
    document: "Create a polished document-ready draft with a title, executive summary, structured sections, and a practical conclusion.",
    code: "Produce clearly labelled, secure example code with setup instructions, comments, and test considerations. Never include secrets.",
    spreadsheet: "Produce a spreadsheet-ready specification: tab names, column headers, formulas, example rows marked as examples, and instructions for validation.",
    chart_spec: "Create a data-chart specification with audience, question the chart answers, suitable chart type, explicit dimensions and measures, data-source assumptions, required fields, calculation rules, accessible title and alt text, visual hierarchy, and interpretation guidance. Do not invent quantitative evidence.",
    infographic: "Create a clear infographic content brief with hierarchy, short labels, layout guidance, and accessible alt text.",
    poster: "Create a marketing poster creative brief with a strong headline, supporting message, CTA, visual hierarchy, and accessible alt text.",
    audio_brief: "Create an educational audio or music-production brief with learning objective, listener profile, recommended duration, spoken or lyric-safe concept, rhythm and sound-direction guidance, voiceover or recording plan, caption/transcript plan, and rights-safe sourcing notes. Do not output copyrighted lyrics or claim to have generated an audio file.",
    video_brief: "Create a video production brief with audience, hook, scene-by-scene storyboard, voiceover, shot list, CTA, and accessibility notes.",
    quiz: "Create a formative quiz with answers and brief explanations. Focus on understanding rather than trick questions.",
  };
  return `${byKind[kind]} ${shared}`;
}

function contentToDocxParagraphs(content: string) {
  return content.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") return [new Paragraph({ spacing: { after: 120 } })];
    if (trimmed.startsWith("### ")) return [new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 })];
    if (trimmed.startsWith("## ")) return [new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 })];
    if (trimmed.startsWith("# ")) return [new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1 })];
    if (trimmed.startsWith("- ")) return [new Paragraph({ text: trimmed.slice(2), bullet: { level: 0 } })];
    return [new Paragraph({ children: [new TextRun(trimmed.replace(/\*\*(.*?)\*\*/g, "$1"))], spacing: { after: 120 } })];
  });
}

export const creatorRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(creatorArtifacts)
      .where(eq(creatorArtifacts.userId, ctx.user.id))
      .orderBy(desc(creatorArtifacts.createdAt))
      .limit(60);
  }),

  listTeachingResources: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(teachingResources)
      .where(and(eq(teachingResources.ownerId, ctx.user.id), eq(teachingResources.status, "published")))
      .orderBy(desc(teachingResources.createdAt))
      .limit(60);
  }),

  getArtifact: protectedProcedure
    .input(z.object({ artifactId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [artifact] = await db.select().from(creatorArtifacts)
        .where(and(eq(creatorArtifacts.id, input.artifactId), eq(creatorArtifacts.userId, ctx.user.id)))
        .limit(1);
      if (!artifact) return null;
      const sections = await db.select().from(artifactSections)
        .where(eq(artifactSections.artifactId, artifact.id))
        .orderBy(artifactSections.sectionOrder);
      return { ...artifact, sections };
    }),

  createArtifact: protectedProcedure
    .input(artifactInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Creator Hub is temporarily unavailable." });
      const [[profile], progress] = await Promise.all([
        db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, ctx.user.id)).limit(1),
        db.select().from(chapterProgress).where(eq(chapterProgress.userId, ctx.user.id)),
      ]);
      const learnerContext = profile
        ? `Personalize structure for a ${profile.experienceLevel} learner who prefers ${profile.learningStyle} learning, is focused on ${profile.primaryGoal}, has about ${profile.weeklyHours} hours weekly, selected ${profile.adaptiveDifficulty} difficulty, and has completed ${progress.length} course chapters. Use this progress signal only to tune scaffolding and practice depth; do not infer sensitive traits.`
        : "Use a balanced beginner-accessible structure and invite the learner to set a profile for future personalization.";
      let sourceContext = "";
      if (input.sourceArtifactId) {
        const [sourceArtifact] = await db.select().from(creatorArtifacts)
          .where(and(eq(creatorArtifacts.id, input.sourceArtifactId), eq(creatorArtifacts.userId, ctx.user.id))).limit(1);
        if (!sourceArtifact) throw new TRPCError({ code: "NOT_FOUND", message: "The selected source artifact was not found." });
        sourceContext = `\n\nTransform this existing source artifact into the requested output while preserving its learning objective and improving clarity:\nTitle: ${sourceArtifact.title}\nContent: ${(sourceArtifact.content ?? sourceArtifact.prompt).slice(0, 6000)}`;
      }
      if (input.sourceResourceId) {
        const [sourceResource] = await db.select().from(teachingResources)
          .where(and(eq(teachingResources.id, input.sourceResourceId), eq(teachingResources.ownerId, ctx.user.id), eq(teachingResources.status, "published"))).limit(1);
        if (!sourceResource) throw new TRPCError({ code: "NOT_FOUND", message: "The selected published teaching resource was not found." });
        const linkedArtifact = sourceResource.creatorArtifactId
          ? (await db.select().from(creatorArtifacts).where(and(eq(creatorArtifacts.id, sourceResource.creatorArtifactId), eq(creatorArtifacts.userId, ctx.user.id))).limit(1))[0]
          : null;
        const sourceBody = linkedArtifact?.content ?? sourceResource.description ?? sourceResource.sourceUrl ?? "No source text was stored for this resource.";
        sourceContext += `\n\nTransform this educator-owned teaching resource into the requested output while preserving its learning objective and improving clarity:\nTitle: ${sourceResource.title}\nResource type: ${sourceResource.kind}\nContent or resource context: ${sourceBody.slice(0, 6000)}`;
      }

      const started = await db.insert(creatorArtifacts).values({
        userId: ctx.user.id,
        kind: input.kind,
        title: input.title,
        prompt: `${input.prompt}${sourceContext}`,
        language: input.language,
        status: "generating",
      });
      const artifactId = Number((started as any)[0]?.insertId ?? (started as any).insertId);
      if (!artifactId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the artifact record." });

      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          maxTokens: input.kind === "book" ? 6000 : 3500,
          outputSchema: generatedArtifactSchema,
          messages: [
            {
              role: "system",
              content: `You are Coach Roued AI Avatar for Prize2Pride, an ethical multilingual Digital Marketing 5.0 learning platform. Respond in ${input.language === "ar" ? "Tunisian Arabic (Darja) or clear Arabic" : input.language === "fr" ? "French" : "English"}. ${artifactInstructions(input.kind)} ${learnerContext}`,
            },
            { role: "user", content: `Artifact title: ${input.title}\n\nLearner brief: ${input.prompt}${sourceContext}` },
          ],
        });
        const raw = response.choices?.[0]?.message?.content;
        const generated = JSON.parse(typeof raw === "string" ? raw : "{}") as {
          title: string; content: string; imagePrompt: string; nextStep: string; sections: Array<{ title: string; summary: string }>;
        };
        const title = generated.title?.trim() || input.title;
        const content = `${generated.content?.trim() || ""}\n\n---\n\n**Next step:** ${generated.nextStep?.trim() || "Review this draft and adapt it to your business context."}`;
        let imageUrl: string | undefined;
        let imageError: string | undefined;

        if ((input.kind === "infographic" || input.kind === "poster") && generated.imagePrompt.trim()) {
          try {
            imageUrl = (await generateImage({
              prompt: `${generated.imagePrompt}. Brand: Prize2Pride, premium digital-marketing education, charcoal background with restrained gold and royal-purple accents, no logos, clear hierarchy, accessible composition.`,
              quality: "medium",
            })).url;
          } catch (error) {
            imageError = error instanceof Error ? error.message : "Image generation was unavailable.";
          }
        }

        await db.update(creatorArtifacts).set({
          title,
          content,
          status: "ready",
          metadata: { imageUrl, imagePrompt: generated.imagePrompt, imageError, outputKind: input.kind },
        }).where(eq(creatorArtifacts.id, artifactId));

        const sections = (generated.sections ?? []).slice(0, 16);
        if (sections.length) {
          await db.insert(artifactSections).values(sections.map((section, index) => ({
            artifactId,
            sectionOrder: index + 1,
            title: section.title.slice(0, 255),
            content: section.summary,
            status: "planned" as const,
          })));
        }

        const [artifact] = await db.select().from(creatorArtifacts).where(eq(creatorArtifacts.id, artifactId)).limit(1);
        return artifact;
      } catch (error) {
        await db.update(creatorArtifacts).set({ status: "failed" }).where(eq(creatorArtifacts.id, artifactId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Coach Roued could not create this artifact. Please refine the brief and try again." });
      }
    }),

  exportDocx: protectedProcedure
    .input(z.object({ artifactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Creator Hub is temporarily unavailable." });

      const [artifact] = await db.select().from(creatorArtifacts)
        .where(and(eq(creatorArtifacts.id, input.artifactId), eq(creatorArtifacts.userId, ctx.user.id)))
        .limit(1);
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND", message: "Artifact not found." });
      if (artifact.kind !== "book" && artifact.kind !== "document") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "DOCX export is currently available for books and documents." });
      }
      if (!artifact.content) throw new TRPCError({ code: "BAD_REQUEST", message: "This artifact has no exportable content yet." });

      const sections = await db.select().from(artifactSections)
        .where(eq(artifactSections.artifactId, artifact.id))
        .orderBy(artifactSections.sectionOrder);
      const document = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: artifact.title, heading: HeadingLevel.TITLE }),
            new Paragraph({ text: "Prize2Pride • Coach Roued AI Avatar", spacing: { after: 360 } }),
            ...contentToDocxParagraphs(artifact.content),
            ...(sections.length ? [
              new Paragraph({ text: "Section Plan", heading: HeadingLevel.HEADING_1 }),
              ...sections.flatMap((section) => [
                new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }),
                ...contentToDocxParagraphs(section.content ?? ""),
              ]),
            ] : []),
          ],
        }],
      });
      const buffer = await Packer.toBuffer(document);
      const safeTitle = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `artifact-${artifact.id}`;
      const { url } = await storagePut(
        `creator-artifacts/${ctx.user.id}/${safeTitle}.docx`,
        buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      await db.update(creatorArtifacts).set({ exportUrl: url, exportedAt: new Date() })
        .where(eq(creatorArtifacts.id, artifact.id));
      return { url };
    }),

  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(learningProjects)
      .where(eq(learningProjects.userId, ctx.user.id))
      .orderBy(desc(learningProjects.createdAt))
      .limit(30);
  }),

  createProject: protectedProcedure
    .input(z.object({ title: z.string().trim().min(3).max(160), brief: z.string().trim().min(12).max(3000), language: z.enum(["en", "fr", "ar"]).default("en") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Creator Hub is temporarily unavailable." });
      await db.insert(learningProjects).values({ userId: ctx.user.id, ...input });
      return { created: true };
    }),
});
