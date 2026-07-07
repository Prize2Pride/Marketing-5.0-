import { z } from "zod";
import { eq, asc, and, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { levels, modules, chapters, enrollments, chapterProgress } from "../../drizzle/schema";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

export const courseRouter = router({
  // Get all published levels
  getLevels: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(levels).where(eq(levels.isPublished, true)).orderBy(asc(levels.order));
  }),

  // Get a single level with its modules
  getLevel: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [level] = await db.select().from(levels).where(eq(levels.slug, input.slug)).limit(1);
      if (!level) return null;
      const mods = await db.select().from(modules)
        .where(and(eq(modules.levelId, level.id), eq(modules.isPublished, true)))
        .orderBy(asc(modules.order));
      // Attach chapters to each module
      const allChapters = await db.select().from(chapters)
        .where(and(
          inArray(chapters.moduleId, mods.map(m => m.id)),
          eq(chapters.isPublished, true)
        ))
        .orderBy(asc(chapters.order));
      const modsWithChapters = mods.map(mod => ({
        ...mod,
        chapters: allChapters.filter(c => c.moduleId === mod.id),
      }));
      return { ...level, modules: modsWithChapters };
    }),

  // Get a module with its chapters
  getModule: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [mod] = await db.select().from(modules).where(eq(modules.slug, input.slug)).limit(1);
      if (!mod) return null;
      const chaps = await db.select().from(chapters)
        .where(and(eq(chapters.moduleId, mod.id), eq(chapters.isPublished, true)))
        .orderBy(asc(chapters.order));
      return { ...mod, chapters: chaps };
    }),

  // Get a single chapter
  getChapter: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [chapter] = await db.select().from(chapters).where(eq(chapters.slug, input.slug)).limit(1);
      return chapter ?? null;
    }),

  // Get full course tree (levels + modules + chapters)
  getCourseTree: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const allLevels = await db.select().from(levels).where(eq(levels.isPublished, true)).orderBy(asc(levels.order));
    const allModules = await db.select().from(modules).where(eq(modules.isPublished, true)).orderBy(asc(modules.order));
    const allChapters = await db.select().from(chapters).where(eq(chapters.isPublished, true)).orderBy(asc(chapters.order));
    return allLevels.map(level => ({
      ...level,
      modules: allModules
        .filter(m => m.levelId === level.id)
        .map(mod => ({
          ...mod,
          chapters: allChapters.filter(c => c.moduleId === mod.id),
        })),
    }));
  }),

  // Enroll in a level
  enroll: protectedProcedure
    .input(z.object({ levelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.levelId, input.levelId)))
        .limit(1);
      if (existing.length > 0) return { enrolled: true, existing: true };
      await db.insert(enrollments).values({ userId: ctx.user.id, levelId: input.levelId });
      return { enrolled: true, existing: false };
    }),

  // Get user enrollments
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(enrollments)
      .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.isActive, true)));
  }),

  // Mark chapter as complete
  completeChapter: protectedProcedure
    .input(z.object({ chapterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(chapterProgress)
        .where(and(eq(chapterProgress.userId, ctx.user.id), eq(chapterProgress.chapterId, input.chapterId)))
        .limit(1);
      if (existing.length > 0) return { completed: true };
      await db.insert(chapterProgress).values({ userId: ctx.user.id, chapterId: input.chapterId });
      return { completed: true };
    }),

  // Get user's chapter progress
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(chapterProgress).where(eq(chapterProgress.userId, ctx.user.id));
  }),

  // Get stats for admin
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return null;
    const [levelCount] = await db.select({ count: levels.id }).from(levels);
    const [moduleCount] = await db.select({ count: modules.id }).from(modules);
    const [chapterCount] = await db.select({ count: chapters.id }).from(chapters);
    const [enrollmentCount] = await db.select({ count: enrollments.id }).from(enrollments);
    return { levelCount, moduleCount, chapterCount, enrollmentCount };
  }),
});
