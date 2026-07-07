import { z } from "zod";
import { eq, asc, desc, count } from "drizzle-orm";
import { getDb } from "../db";
import { levels, modules, chapters, enrollments, users } from "../../drizzle/schema";
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

