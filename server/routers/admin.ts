import { z } from "zod";
import { eq, asc, desc, count, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { creatorArtifacts, educatorProfiles, levels, modules, chapters, enrollments, users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const adminRouter = router({
  // Dashboard stats
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalEnrollments] = await db.select({ count: count() }).from(enrollments);
    const [totalLevels] = await db.select({ count: count() }).from(levels);
    const [totalChapters] = await db.select({ count: count() }).from(chapters);
    return {
      totalUsers: totalUsers?.count ?? 0,
      totalEnrollments: totalEnrollments?.count ?? 0,
      totalLevels: totalLevels?.count ?? 0,
      totalChapters: totalChapters?.count ?? 0,
    };
  }),

  // Get all users
  getUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(users).orderBy(desc(users.createdAt)).limit(input.limit).offset(input.offset);
    }),

  // Get all enrollments
  getEnrollments: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
      return db.select().from(enrollments).orderBy(desc(enrollments.enrolledAt)).limit(100);
  }),

  listEducatorApplications: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(educatorProfiles).where(eq(educatorProfiles.onboardingStatus, "submitted")).orderBy(desc(educatorProfiles.updatedAt));
  }),

  reviewEducatorApplication: adminProcedure
    .input(z.object({ userId: z.number(), decision: z.enum(["approve", "reject"]), reviewNotes: z.string().trim().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [profile] = await db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, input.userId)).limit(1);
      if (!profile || profile.onboardingStatus !== "submitted") throw new TRPCError({ code: "NOT_FOUND", message: "Submitted educator application not found" });
      const approved = input.decision === "approve";
      await db.update(educatorProfiles).set({ onboardingStatus: approved ? "approved" : "rejected", reviewedBy: ctx.user.id, reviewedAt: new Date(), reviewNotes: input.reviewNotes || null }).where(eq(educatorProfiles.id, profile.id));
      if (approved) await db.update(users).set({ role: "educator" }).where(eq(users.id, input.userId));
      return { approved };
    }),

  listArtifactsForReview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(creatorArtifacts)
      .where(inArray(creatorArtifacts.status, ["ready", "approved"]))
      .orderBy(desc(creatorArtifacts.createdAt))
      .limit(50);
  }),

  getModulesForIngestion: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: modules.id,
      levelId: modules.levelId,
      order: modules.order,
      titleEn: modules.titleEn,
      titleFr: modules.titleFr,
      titleAr: modules.titleAr,
    }).from(modules).orderBy(asc(modules.levelId), asc(modules.order));
  }),

  reviewArtifact: adminProcedure
    .input(z.object({ artifactId: z.number(), decision: z.enum(["approve", "reject"]), reviewNotes: z.string().trim().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [artifact] = await db.select({ id: creatorArtifacts.id, status: creatorArtifacts.status })
        .from(creatorArtifacts).where(eq(creatorArtifacts.id, input.artifactId)).limit(1);
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND", message: "Artifact not found" });
      if (artifact.status !== "ready") throw new TRPCError({ code: "BAD_REQUEST", message: "Only ready artifacts can be reviewed" });

      const status = input.decision === "approve" ? "approved" : "failed";
      await db.update(creatorArtifacts).set({
        status,
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes || null,
      }).where(eq(creatorArtifacts.id, input.artifactId));
      return { status };
    }),

  publishArtifactAsChapter: adminProcedure
    .input(z.object({ artifactId: z.number(), moduleId: z.number(), publishImmediately: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [artifact] = await db.select().from(creatorArtifacts)
        .where(eq(creatorArtifacts.id, input.artifactId)).limit(1);
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND", message: "Artifact not found" });
      if (artifact.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "An artifact must be approved before it can become a course chapter" });
      }
      if (!artifact.content) throw new TRPCError({ code: "BAD_REQUEST", message: "This approved artifact has no lesson content" });
      const [module] = await db.select({ id: modules.id }).from(modules).where(eq(modules.id, input.moduleId)).limit(1);
      if (!module) throw new TRPCError({ code: "NOT_FOUND", message: "Target module not found" });
      const [lastChapter] = await db.select({ order: chapters.order }).from(chapters)
        .where(eq(chapters.moduleId, input.moduleId)).orderBy(desc(chapters.order)).limit(1);
      const typeByArtifactKind = {
        code: "code",
        spreadsheet: "excel",
        infographic: "infographic",
        poster: "infographic",
        video_brief: "video_script",
        quiz: "quiz",
      } as const;
      const contentByLanguage = artifact.language === "fr"
        ? { contentEn: null, contentFr: artifact.content, contentAr: null }
        : artifact.language === "ar"
          ? { contentEn: null, contentFr: null, contentAr: artifact.content }
          : { contentEn: artifact.content, contentFr: null, contentAr: null };
      const slug = `creator-artifact-${artifact.id}-${Date.now().toString(36)}`;
      const result = await db.insert(chapters).values({
        moduleId: input.moduleId,
        slug,
        order: (lastChapter?.order ?? 0) + 1,
        titleEn: artifact.title,
        titleFr: artifact.title,
        titleAr: artifact.title,
        ...contentByLanguage,
        type: typeByArtifactKind[artifact.kind as keyof typeof typeByArtifactKind] ?? "text",
        estimatedMinutes: 15,
        isPublished: input.publishImmediately,
      });
      const chapterId = Number((result as any)[0]?.insertId ?? (result as any).insertId);
      await db.update(creatorArtifacts).set({ status: input.publishImmediately ? "published" : "ingested" })
        .where(eq(creatorArtifacts.id, artifact.id));
      return { chapterId, slug, isPublished: input.publishImmediately };
    }),

  // Update level published status
  toggleLevelPublished: adminProcedure
    .input(z.object({ levelId: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(levels).set({ isPublished: input.isPublished }).where(eq(levels.id, input.levelId));
      return { updated: true };
    }),

  // Update chapter content
  updateChapter: adminProcedure
    .input(z.object({
      chapterId: z.number(),
      titleEn: z.string().optional(),
      titleFr: z.string().optional(),
      titleAr: z.string().optional(),
      contentEn: z.string().optional(),
      contentFr: z.string().optional(),
      contentAr: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { chapterId, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length > 0) {
        await db.update(chapters).set(filtered).where(eq(chapters.id, chapterId));
      }
      return { updated: true };
    }),

  // Promote user to admin
  promoteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(users).set({ role: "admin" }).where(eq(users.id, input.userId));
      return { promoted: true };
    }),
});
