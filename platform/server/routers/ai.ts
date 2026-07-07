import { z } from "zod";
import { eq, asc, desc } from "drizzle-orm";
import { getDb } from "../db";
import { chatMessages } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const COACH_SYSTEM_PROMPT = `You are Coach Roued AI Avatar — the digital embodiment of Coach Roued El Fadhel, the founder of Prize2Pride and author of the Digital Marketing 5.0 Encyclopedia, empowered by CodinCloud.

Your personality:
- Warm, direct, and deeply knowledgeable about digital marketing, e-commerce, and AI-powered business
- You speak with the authority of a practitioner who has built real businesses and helped hundreds of entrepreneurs
- You are fluent in English, French, and Tunisian Arabic (Darja) — respond in the same language the user writes in
- You reference the Prize2Pride methodology, the 5 pillars (Foundation, Visibility, Conversion, Loyalty, Scale), and the concept of the Augmented Merchant
- You are encouraging but honest — you do not sugarcoat challenges
- You always connect your answers back to actionable steps the learner can take today

Your knowledge covers:
- Digital Marketing 5.0: Attention Engineering, Loyalty 5.0, RFM Segmentation, Agentic Marketing
- E-commerce: Vendeur.site, product research, store setup, scaling
- Social media: TikTok, Instagram, Facebook, YouTube strategies
- AI & Automation: Marketing agents, predictive analytics, autonomous systems
- Future of commerce: AGI, ASI, quantum-empowered marketing

Always end your responses with an actionable next step or a motivating insight from the Prize2Pride methodology.`;

export const aiRouter = router({
  // Get chat history
  getChatHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(chatMessages)
        .where(eq(chatMessages.userId, ctx.user.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(input.limit)
        .then(msgs => msgs.reverse());
    }),

  // Send a message to Coach Roued AI Avatar
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      language: z.enum(["en", "fr", "ar"]).default("en"),
      chapterId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Save user message
      await db.insert(chatMessages).values({
        userId: ctx.user.id,
        role: "user",
        content: input.message,
        language: input.language,
        chapterId: input.chapterId ?? null,
      });

      // Get recent history for context
      const history = await db.select().from(chatMessages)
        .where(eq(chatMessages.userId, ctx.user.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(10)
        .then(msgs => msgs.reverse());

      const messages = [
        { role: "system" as const, content: COACH_SYSTEM_PROMPT },
        ...history.slice(0, -1).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      let assistantContent = "";
      try {
        const response = await invokeLLM({ messages, model: "gpt-4o-mini" });
        const msgContent = response.choices?.[0]?.message?.content;
        assistantContent = typeof msgContent === "string" ? msgContent : "I apologize, I could not generate a response. Please try again.";
      } catch (err) {
        assistantContent = "I apologize, I am temporarily unavailable. Please try again in a moment. — Coach Roued AI";
      }

      // Save assistant response
      await db.insert(chatMessages).values({
        userId: ctx.user.id,
        role: "assistant",
        content: assistantContent,
        language: input.language,
        chapterId: input.chapterId ?? null,
      });

      return { response: assistantContent };
    }),

  // Clear chat history
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(chatMessages).where(eq(chatMessages.userId, ctx.user.id));
    return { cleared: true };
  }),
});
