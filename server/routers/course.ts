import { z } from "zod";
import { eq, asc, and, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { levels, modules, chapters, enrollments, chapterProgress, learnerProfiles, courseCertificates } from "../../drizzle/schema";
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

  getLearningProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, ctx.user.id)).limit(1);
    return profile ?? null;
  }),

  saveLearningProfile: protectedProcedure
    .input(z.object({
      experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
      learningStyle: z.enum(["visual", "practical", "reading", "mixed"]),
      primaryGoal: z.enum(["marketing", "ecommerce", "automation", "career", "business"]),
      weeklyHours: z.number().int().min(1).max(30),
      adaptiveDifficulty: z.enum(["guided", "standard", "challenge"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(learnerProfiles).values({ userId: ctx.user.id, ...input })
        .onDuplicateKeyUpdate({ set: input });
      const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, ctx.user.id)).limit(1);
      return profile;
    }),

  getAdaptivePlan: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { profile: null, completedCount: 0, difficulty: "guided" as const, nextChapters: [] };
    const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, ctx.user.id)).limit(1);
    const [allLevels, allModules, allChapters, progress] = await Promise.all([
      db.select().from(levels).where(eq(levels.isPublished, true)).orderBy(asc(levels.order)),
      db.select().from(modules).where(eq(modules.isPublished, true)).orderBy(asc(modules.order)),
      db.select().from(chapters).where(eq(chapters.isPublished, true)).orderBy(asc(chapters.order)),
      db.select().from(chapterProgress).where(eq(chapterProgress.userId, ctx.user.id)),
    ]);
    const completedIds = new Set(progress.map((entry) => entry.chapterId));
    const goalOrders = profile?.primaryGoal === "ecommerce" ? [11, 12, 13, 14, 15]
      : profile?.primaryGoal === "automation" ? [6, 7, 8, 9, 10]
        : profile?.primaryGoal === "business" ? [4, 5, 10, 14, 15]
          : profile?.primaryGoal === "career" ? [1, 2, 6, 9, 16, 19]
            : [1, 2, 3, 4, 5];
    const preferredLevelIds = new Set(allLevels.filter((level) => goalOrders.includes(level.order)).map((level) => level.id));
    const orderedModules = [...allModules.filter((module) => preferredLevelIds.has(module.levelId)), ...allModules.filter((module) => !preferredLevelIds.has(module.levelId))];
    const targetCount = profile?.weeklyHours && profile.weeklyHours >= 6 ? 4 : 3;
    const nextChapters = orderedModules.flatMap((module) => allChapters.filter((chapter) => chapter.moduleId === module.id))
      .filter((chapter) => !completedIds.has(chapter.id))
      .slice(0, targetCount)
      .map((chapter) => ({ ...chapter, module: orderedModules.find((module) => module.id === chapter.moduleId) }));
    const difficulty = profile?.adaptiveDifficulty ?? (progress.length >= 12 ? "challenge" : progress.length >= 4 ? "standard" : "guided");
    return { profile: profile ?? null, completedCount: progress.length, difficulty, nextChapters };
  }),

  getCertificateEligibility: protectedProcedure
    .input(z.object({ levelId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { eligible: false, requiredChapters: 0, completedChapters: 0, certificate: null };
      const [level] = await db.select().from(levels).where(and(eq(levels.id, input.levelId), eq(levels.isPublished, true))).limit(1);
      if (!level) return { eligible: false, requiredChapters: 0, completedChapters: 0, certificate: null };
      const [enrollment] = await db.select().from(enrollments).where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.levelId, input.levelId), eq(enrollments.isActive, true))).limit(1);
      if (!enrollment) return { eligible: false, requiredChapters: 0, completedChapters: 0, certificate: null };
      const levelModules = await db.select().from(modules).where(and(eq(modules.levelId, input.levelId), eq(modules.isPublished, true)));
      const levelChapters = levelModules.length ? await db.select().from(chapters).where(and(inArray(chapters.moduleId, levelModules.map((module) => module.id)), eq(chapters.isPublished, true))) : [];
      const progress = levelChapters.length ? await db.select().from(chapterProgress).where(and(eq(chapterProgress.userId, ctx.user.id), inArray(chapterProgress.chapterId, levelChapters.map((chapter) => chapter.id)))) : [];
      const [certificate] = await db.select().from(courseCertificates).where(and(eq(courseCertificates.userId, ctx.user.id), eq(courseCertificates.levelId, input.levelId), eq(courseCertificates.status, "issued"))).limit(1);
      return { eligible: levelChapters.length > 0 && progress.length === levelChapters.length, requiredChapters: levelChapters.length, completedChapters: progress.length, certificate: certificate ?? null };
    }),

  issueMyCertificate: protectedProcedure
    .input(z.object({ levelId: z.number().int().positive(), language: z.enum(["en", "fr", "ar"]).default("en") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Certificates are temporarily unavailable");
      const [existing] = await db.select().from(courseCertificates).where(and(eq(courseCertificates.userId, ctx.user.id), eq(courseCertificates.levelId, input.levelId), eq(courseCertificates.status, "issued"))).limit(1);
      if (existing) return existing;
      const [level] = await db.select().from(levels).where(and(eq(levels.id, input.levelId), eq(levels.isPublished, true))).limit(1);
      if (!level) throw new Error("This learning path is unavailable");
      const [enrollment] = await db.select().from(enrollments).where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.levelId, input.levelId), eq(enrollments.isActive, true))).limit(1);
      if (!enrollment) throw new Error("Enroll in this learning path before requesting a certificate");
      const levelModules = await db.select().from(modules).where(and(eq(modules.levelId, input.levelId), eq(modules.isPublished, true)));
      const levelChapters = levelModules.length ? await db.select().from(chapters).where(and(inArray(chapters.moduleId, levelModules.map((module) => module.id)), eq(chapters.isPublished, true))) : [];
      const progress = levelChapters.length ? await db.select().from(chapterProgress).where(and(eq(chapterProgress.userId, ctx.user.id), inArray(chapterProgress.chapterId, levelChapters.map((chapter) => chapter.id)))) : [];
      if (!levelChapters.length || progress.length !== levelChapters.length) throw new Error("Complete every published lesson in this learning path before requesting a certificate");
      const verificationCode = `P2P-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
      await db.insert(courseCertificates).values({ userId: ctx.user.id, levelId: input.levelId, verificationCode, language: input.language, criteria: { requiredChapters: levelChapters.length, completedChapters: progress.length, levelSlug: level.slug } });
      const [certificate] = await db.select().from(courseCertificates).where(eq(courseCertificates.verificationCode, verificationCode)).limit(1);
      return certificate!;
    }),

  listMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(courseCertificates).where(and(eq(courseCertificates.userId, ctx.user.id), eq(courseCertificates.status, "issued"))).orderBy(asc(courseCertificates.issuedAt));
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
