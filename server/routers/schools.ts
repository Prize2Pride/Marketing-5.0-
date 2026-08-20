import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  classAnnouncements,
  classEnrollments,
  classMessages,
  chapterProgress,
  creatorArtifacts,
  educatorProfiles,
  lessonRecordings,
  schoolClasses,
  subjectSchools,
  teachingResources,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const subjectKeys = ["digital_marketing", "artificial_intelligence", "data_science", "robotics", "three_d_printing", "mathematics", "physics", "quantum_computing", "quantum_physics", "research"] as const;
const resourceKinds = ["lesson", "document", "pdf", "video_link", "image", "infographic", "poster", "chart", "audio_brief", "video_brief", "quiz", "code", "spreadsheet", "link"] as const;

const educatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "educator" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Educator access is required to manage a school." });
  }
  return next({ ctx });
});

function slugify(value: string) {
  const root = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${root || "school"}-${Date.now().toString(36)}`.slice(0, 120);
}

async function requireOwnedSchool(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, schoolId: number, userId: number, role: "user" | "educator" | "admin") {
  const [school] = await db.select().from(subjectSchools).where(eq(subjectSchools.id, schoolId)).limit(1);
  if (!school) throw new TRPCError({ code: "NOT_FOUND", message: "School not found." });
  if (school.ownerId !== userId && role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this school." });
  return school;
}

async function requireOwnedClass(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, classId: number, userId: number, role: "user" | "educator" | "admin") {
  const [classroom] = await db.select().from(schoolClasses).where(eq(schoolClasses.id, classId)).limit(1);
  if (!classroom) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
  await requireOwnedSchool(db, classroom.schoolId, userId, role);
  return classroom;
}

export const schoolRouter = router({
  listPublic: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(subjectSchools)
      .where(and(eq(subjectSchools.visibility, "public"), eq(subjectSchools.status, "active")))
      .orderBy(asc(subjectSchools.nameEn));
  }),

  listMine: educatorProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    if (ctx.user.role === "admin") return db.select().from(subjectSchools).orderBy(desc(subjectSchools.createdAt));
    return db.select().from(subjectSchools).where(eq(subjectSchools.ownerId, ctx.user.id)).orderBy(desc(subjectSchools.createdAt));
  }),

  getMyEducatorProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [profile] = await db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, ctx.user.id)).limit(1);
    return profile ?? null;
  }),

  submitEducatorApplication: protectedProcedure
    .input(z.object({ bio: z.string().trim().min(40).max(3000), expertise: z.string().trim().min(3).max(1500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      if (ctx.user.role === "educator" || ctx.user.role === "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "Your educator access is already active." });
      await db.insert(educatorProfiles).values({ userId: ctx.user.id, ...input, onboardingStatus: "submitted", reviewedBy: null, reviewedAt: null, reviewNotes: null })
        .onDuplicateKeyUpdate({ set: { ...input, onboardingStatus: "submitted", reviewedBy: null, reviewedAt: null, reviewNotes: null } });
      return { submitted: true };
    }),

  createSchool: educatorProcedure
    .input(z.object({
      subjectKey: z.enum(subjectKeys), nameEn: z.string().trim().min(3).max(255), nameFr: z.string().trim().min(3).max(255), nameAr: z.string().trim().min(3).max(255),
      descriptionEn: z.string().trim().max(4000).optional(), descriptionFr: z.string().trim().max(4000).optional(), descriptionAr: z.string().trim().max(4000).optional(),
      brandColor: z.string().trim().min(3).max(32).default("gold"), visibility: z.enum(["private", "unlisted", "public"]).default("private"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const slug = slugify(input.nameEn);
      const result = await db.insert(subjectSchools).values({ ownerId: ctx.user.id, slug, status: "active", ...input });
      return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId), slug };
    }),

  createClass: educatorProcedure
    .input(z.object({ schoolId: z.number(), title: z.string().trim().min(3).max(255), description: z.string().trim().max(4000).optional(), language: z.enum(["en", "fr", "ar"]).default("en"), meetingUrl: z.string().url().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await requireOwnedSchool(db, input.schoolId, ctx.user.id, ctx.user.role);
      const slug = slugify(input.title);
      const result = await db.insert(schoolClasses).values({ ...input, teacherId: ctx.user.id, slug, status: "active" });
      return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId), slug };
    }),

  listSchoolClasses: educatorProcedure
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await requireOwnedSchool(db, input.schoolId, ctx.user.id, ctx.user.role);
      return db.select().from(schoolClasses).where(eq(schoolClasses.schoolId, input.schoolId)).orderBy(desc(schoolClasses.createdAt));
    }),

  getClassroom: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [classroom] = await db.select().from(schoolClasses).where(eq(schoolClasses.id, input.classId)).limit(1);
      if (!classroom) return null;
      const [school] = await db.select().from(subjectSchools).where(eq(subjectSchools.id, classroom.schoolId)).limit(1);
      const isOwner = school?.ownerId === ctx.user.id || ctx.user.role === "admin";
      const [enrollment] = await db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, classroom.id), eq(classEnrollments.userId, ctx.user.id), eq(classEnrollments.status, "active"))).limit(1);
      if (!isOwner && !enrollment) throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this class." });
      const [resources, announcements] = await Promise.all([
        db.select().from(teachingResources).where(and(eq(teachingResources.classId, classroom.id), eq(teachingResources.status, "published"))).orderBy(desc(teachingResources.createdAt)),
        db.select().from(classAnnouncements).where(eq(classAnnouncements.classId, classroom.id)).orderBy(desc(classAnnouncements.createdAt)),
      ]);
      return { classroom, school, resources, announcements, isOwner };
    }),

  listMyClasses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const myEnrollments = await db.select().from(classEnrollments).where(and(eq(classEnrollments.userId, ctx.user.id), eq(classEnrollments.status, "active")));
    if (!myEnrollments.length) return [];
    const allClasses = await db.select().from(schoolClasses).orderBy(desc(schoolClasses.createdAt));
    return allClasses.filter((classroom) => myEnrollments.some((entry) => entry.classId === classroom.id));
  }),

  addLearner: educatorProcedure
    .input(z.object({ classId: z.number(), learnerEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await requireOwnedClass(db, input.classId, ctx.user.id, ctx.user.role);
      const [learner] = await db.select().from(users).where(eq(users.email, input.learnerEmail)).limit(1);
      if (!learner) throw new TRPCError({ code: "NOT_FOUND", message: "No Prize2Pride learner uses that email address." });
      const [existing] = await db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, input.classId), eq(classEnrollments.userId, learner.id))).limit(1);
      if (existing) {
        await db.update(classEnrollments).set({ status: "active" }).where(eq(classEnrollments.id, existing.id));
      } else {
        await db.insert(classEnrollments).values({ classId: input.classId, userId: learner.id, status: "active" });
      }
      return { added: true, learner: { id: learner.id, name: learner.name, email: learner.email } };
    }),

  listClassLearners: educatorProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await requireOwnedClass(db, input.classId, ctx.user.id, ctx.user.role);
      const enrollments = await db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, input.classId), eq(classEnrollments.status, "active")));
      if (!enrollments.length) return [];
      const learnerIds = enrollments.map((entry) => entry.userId);
      const [classUsers, progress] = await Promise.all([
        db.select().from(users).where(inArray(users.id, learnerIds)),
        db.select().from(chapterProgress).where(inArray(chapterProgress.userId, learnerIds)),
      ]);
      return classUsers.map((learner) => ({ id: learner.id, name: learner.name, email: learner.email, completedChapters: progress.filter((entry) => entry.userId === learner.id).length }));
    }),

  createResource: educatorProcedure
    .input(z.object({ schoolId: z.number(), classId: z.number().optional(), creatorArtifactId: z.number().optional(), kind: z.enum(resourceKinds), title: z.string().trim().min(3).max(255), description: z.string().trim().max(4000).optional(), sourceUrl: z.string().url().max(4000).optional(), storageKey: z.string().trim().max(512).optional(), visibility: z.enum(["private", "class", "school"]).default("private"), publish: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await requireOwnedSchool(db, input.schoolId, ctx.user.id, ctx.user.role);
      if (input.classId) {
        const classroom = await requireOwnedClass(db, input.classId, ctx.user.id, ctx.user.role);
        if (classroom.schoolId !== input.schoolId) throw new TRPCError({ code: "BAD_REQUEST", message: "Class does not belong to this school." });
      }
      if (input.creatorArtifactId) {
        const [artifact] = await db.select().from(creatorArtifacts).where(and(eq(creatorArtifacts.id, input.creatorArtifactId), eq(creatorArtifacts.userId, ctx.user.id))).limit(1);
        if (!artifact) throw new TRPCError({ code: "FORBIDDEN", message: "You can only attach your own Creator Studio artifacts." });
      }
      const { publish, ...resource } = input;
      const result = await db.insert(teachingResources).values({ ...resource, ownerId: ctx.user.id, status: publish ? "published" : "ready" });
      return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId) };
    }),

  announce: educatorProcedure
    .input(z.object({ classId: z.number(), title: z.string().trim().min(3).max(255), body: z.string().trim().min(3).max(8000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await requireOwnedClass(db, input.classId, ctx.user.id, ctx.user.role);
      await db.insert(classAnnouncements).values({ ...input, authorId: ctx.user.id });
      return { created: true };
    }),

  sendClassMessage: protectedProcedure
    .input(z.object({ classId: z.number(), recipientId: z.number(), body: z.string().trim().min(1).max(6000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const [classroom] = await db.select().from(schoolClasses).where(eq(schoolClasses.id, input.classId)).limit(1);
      if (!classroom) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
      const [school] = await db.select().from(subjectSchools).where(eq(subjectSchools.id, classroom.schoolId)).limit(1);
      const isTeacher = school?.ownerId === ctx.user.id || classroom.teacherId === ctx.user.id || ctx.user.role === "admin";
      const [senderEnrollment, recipientEnrollment] = await Promise.all([
        db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, input.classId), eq(classEnrollments.userId, ctx.user.id), eq(classEnrollments.status, "active"))).limit(1),
        db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, input.classId), eq(classEnrollments.userId, input.recipientId), eq(classEnrollments.status, "active"))).limit(1),
      ]);
      if ((!isTeacher && !senderEnrollment) || (!recipientEnrollment && input.recipientId !== classroom.teacherId && !isTeacher)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Messages are limited to active participants in this class." });
      }
      if (!isTeacher && input.recipientId !== classroom.teacherId) throw new TRPCError({ code: "FORBIDDEN", message: "Learners can message the class teacher only." });
      await db.insert(classMessages).values({ classId: input.classId, senderId: ctx.user.id, recipientId: input.recipientId, body: input.body });
      return { sent: true };
    }),

  listClassMessages: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [classroom] = await db.select().from(schoolClasses).where(eq(schoolClasses.id, input.classId)).limit(1);
      if (!classroom) return [];
      const [school] = await db.select().from(subjectSchools).where(eq(subjectSchools.id, classroom.schoolId)).limit(1);
      const isTeacher = school?.ownerId === ctx.user.id || classroom.teacherId === ctx.user.id || ctx.user.role === "admin";
      const [enrollment] = await db.select().from(classEnrollments).where(and(eq(classEnrollments.classId, input.classId), eq(classEnrollments.userId, ctx.user.id), eq(classEnrollments.status, "active"))).limit(1);
      if (!isTeacher && !enrollment) throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this class." });
      const messages = await db.select().from(classMessages).where(or(eq(classMessages.senderId, ctx.user.id), eq(classMessages.recipientId, ctx.user.id))).orderBy(desc(classMessages.createdAt)).limit(100);
      const participantIds = Array.from(new Set(messages.flatMap((message) => [message.senderId, message.recipientId])));
      if (!participantIds.length) return [];
      const participants = await db.select().from(users).where(inArray(users.id, participantIds));
      const names = new Map(participants.map((participant) => [participant.id, participant.name || participant.email || `User #${participant.id}`]));
      return messages.map((message) => ({ ...message, senderName: names.get(message.senderId) ?? `User #${message.senderId}`, recipientName: names.get(message.recipientId) ?? `User #${message.recipientId}` }));
    }),

  registerRecording: educatorProcedure
    .input(z.object({ classId: z.number(), title: z.string().trim().min(3).max(255), storageKey: z.string().trim().min(3).max(512), sourceUrl: z.string().url().max(4000), availableAt: z.coerce.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await requireOwnedClass(db, input.classId, ctx.user.id, ctx.user.role);
      const availableAt = input.availableAt ?? new Date();
      const expiresAt = new Date(availableAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const result = await db.insert(lessonRecordings).values({ classId: input.classId, ownerId: ctx.user.id, title: input.title, storageKey: input.storageKey, sourceUrl: input.sourceUrl, availableAt, expiresAt, retentionStatus: "active" });
      return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId), expiresAt };
    }),

  listActiveRecordings: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const classroom = await requireOwnedClass(db, input.classId, ctx.user.id, ctx.user.role);
      if (!classroom) return [];
      return db.select().from(lessonRecordings).where(and(eq(lessonRecordings.classId, input.classId), eq(lessonRecordings.retentionStatus, "active"), gt(lessonRecordings.expiresAt, new Date()))).orderBy(desc(lessonRecordings.availableAt));
    }),
});
