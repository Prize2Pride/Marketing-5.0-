import {
  AnyMySqlColumn,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  float,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "educator", "admin"]).default("user").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Course Levels ────────────────────────────────────────────────────────────
export const levels = mysqlTable("levels", { // Expanded to support 20 levels
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  order: int("order").notNull(),
  titleEn: varchar("titleEn", { length: 255 }).notNull(),
  titleFr: varchar("titleFr", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionFr: text("descriptionFr"),
  descriptionAr: text("descriptionAr"),
  tier: mysqlEnum("tier", ["beginner", "intermediate", "advanced", "expert", "master", "autonomous"]).notNull(),
  icon: varchar("icon", { length: 64 }).default("BookOpen"),
  color: varchar("color", { length: 32 }).default("gold"),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Level = typeof levels.$inferSelect;

// ─── Modules ──────────────────────────────────────────────────────────────────
export const modules = mysqlTable("modules", { // Added parentModuleId for nesting
  id: int("id").autoincrement().primaryKey(),
  levelId: int("levelId").notNull().references(() => levels.id),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  order: int("order").notNull(),
  titleEn: varchar("titleEn", { length: 255 }).notNull(),
  titleFr: varchar("titleFr", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionFr: text("descriptionFr"),
  descriptionAr: text("descriptionAr"),
  parentModuleId: int("parentModuleId").references((): AnyMySqlColumn => modules.id), // For nested modules
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Module = typeof modules.$inferSelect;

// ─── Chapters ─────────────────────────────────────────────────────────────────
export const chapters = mysqlTable("chapters", { // Added type for AI content generation
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull().references(() => modules.id),
  slug: varchar("slug", { length: 192 }).notNull().unique(),
  order: int("order").notNull(),
  titleEn: varchar("titleEn", { length: 255 }).notNull(),
  titleFr: varchar("titleFr", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  contentEn: text("contentEn"),
  contentFr: text("contentFr"),
  contentAr: text("contentAr"),
  type: mysqlEnum("type", ["text", "code", "excel", "infographic", "video_script", "quiz"]).default("text").notNull(), // Content type for AI generation
  estimatedMinutes: int("estimatedMinutes").default(15),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;

// ─── Enrollments ──────────────────────────────────────────────────────────────
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  levelId: int("levelId").notNull().references(() => levels.id),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  isActive: boolean("isActive").default(true).notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;

// ─── Chapter Progress ─────────────────────────────────────────────────────────
export const chapterProgress = mysqlTable("chapter_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  chapterId: int("chapterId").notNull().references(() => chapters.id),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type ChapterProgress = typeof chapterProgress.$inferSelect;

// ─── Course Certificates ──────────────────────────────────────────────────────
export const courseCertificates = mysqlTable("course_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  levelId: int("levelId").notNull().references(() => levels.id),
  verificationCode: varchar("verificationCode", { length: 40 }).notNull().unique(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  criteria: json("criteria").notNull(),
  status: mysqlEnum("status", ["issued", "revoked"]).default("issued").notNull(),
  issuedBy: int("issuedBy").references(() => users.id),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  revokeReason: text("revokeReason"),
}, (table) => [index("course_certificates_user_level_idx").on(table.userId, table.levelId)]);

export type CourseCertificate = typeof courseCertificates.$inferSelect;

// ─── Adaptive Learning Profiles ──────────────────────────────────────────────
export const learnerProfiles = mysqlTable("learner_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  experienceLevel: mysqlEnum("experienceLevel", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  learningStyle: mysqlEnum("learningStyle", ["visual", "practical", "reading", "mixed"]).default("mixed").notNull(),
  primaryGoal: mysqlEnum("primaryGoal", ["marketing", "ecommerce", "automation", "career", "business"]).default("marketing").notNull(),
  weeklyHours: int("weeklyHours").default(3).notNull(),
  adaptiveDifficulty: mysqlEnum("adaptiveDifficulty", ["guided", "standard", "challenge"]).default("guided").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProfile = typeof learnerProfiles.$inferSelect;

export const educatorProfiles = mysqlTable("educator_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  bio: text("bio"),
  expertise: text("expertise"),
  onboardingStatus: mysqlEnum("onboardingStatus", ["draft", "submitted", "approved", "rejected"]).default("draft").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EducatorProfile = typeof educatorProfiles.$inferSelect;

// ─── AI Course Builder ────────────────────────────────────────────────────────
export const courseBlueprints = mysqlTable("course_blueprints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  brief: text("brief").notNull(),
  audience: varchar("audience", { length: 255 }).notNull(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  status: mysqlEnum("status", ["generating", "ready", "failed", "approved"]).default("generating").notNull(),
  outline: json("outline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseBlueprint = typeof courseBlueprints.$inferSelect;

// ─── Academy Schools & Teaching Operations ────────────────────────────────────
export const subjectSchools = mysqlTable("subject_schools", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  subjectKey: mysqlEnum("subjectKey", ["digital_marketing", "artificial_intelligence", "data_science", "robotics", "three_d_printing", "mathematics", "physics", "quantum_computing", "quantum_physics", "research"]).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  nameFr: varchar("nameFr", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  descriptionEn: text("descriptionEn"),
  descriptionFr: text("descriptionFr"),
  descriptionAr: text("descriptionAr"),
  brandColor: varchar("brandColor", { length: 32 }).default("gold").notNull(),
  visibility: mysqlEnum("visibility", ["private", "unlisted", "public"]).default("private").notNull(),
  status: mysqlEnum("status", ["draft", "active", "suspended"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubjectSchool = typeof subjectSchools.$inferSelect;

export const schoolClasses = mysqlTable("school_classes", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId").notNull().references(() => subjectSchools.id),
  teacherId: int("teacherId").notNull().references(() => users.id),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  meetingUrl: text("meetingUrl"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SchoolClass = typeof schoolClasses.$inferSelect;

export const classEnrollments = mysqlTable("class_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => schoolClasses.id),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["invited", "active", "removed"]).default("invited").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
});

export type ClassEnrollment = typeof classEnrollments.$inferSelect;

export const teachingResources = mysqlTable("teaching_resources", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId").notNull().references(() => subjectSchools.id),
  classId: int("classId").references(() => schoolClasses.id),
  ownerId: int("ownerId").notNull().references(() => users.id),
  creatorArtifactId: int("creatorArtifactId").references(() => creatorArtifacts.id),
  kind: mysqlEnum("kind", ["lesson", "document", "pdf", "video_link", "image", "infographic", "poster", "chart", "audio_brief", "video_brief", "quiz", "code", "spreadsheet", "link"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sourceUrl: text("sourceUrl"),
  storageKey: varchar("storageKey", { length: 512 }),
  visibility: mysqlEnum("visibility", ["private", "class", "school"]).default("private").notNull(),
  status: mysqlEnum("status", ["draft", "ready", "published", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeachingResource = typeof teachingResources.$inferSelect;

export const classAnnouncements = mysqlTable("class_announcements", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => schoolClasses.id),
  authorId: int("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassAnnouncement = typeof classAnnouncements.$inferSelect;

export const classMessages = mysqlTable("class_messages", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => schoolClasses.id),
  senderId: int("senderId").notNull().references(() => users.id),
  recipientId: int("recipientId").notNull().references(() => users.id),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassMessage = typeof classMessages.$inferSelect;

export const lessonRecordings = mysqlTable("lesson_recordings", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => schoolClasses.id),
  ownerId: int("ownerId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  sourceUrl: text("sourceUrl"),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  retentionStatus: mysqlEnum("retentionStatus", ["active", "expired", "cleanup_pending", "deleted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("lesson_recordings_schedule_cron_task_uid_idx").on(table.scheduleCronTaskUid)]);

export type LessonRecording = typeof lessonRecordings.$inferSelect;

// ─── AI Chat Messages ─────────────────────────────────────────────────────────
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 8 }).default("en"),
  chapterId: int("chapterId").references(() => chapters.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── Creator & Practice Hub ───────────────────────────────────────────────────
export const creatorArtifacts = mysqlTable("creator_artifacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  kind: mysqlEnum("kind", ["lesson", "book", "document", "code", "spreadsheet", "chart_spec", "infographic", "poster", "audio_brief", "video_brief", "quiz"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  status: mysqlEnum("status", ["draft", "generating", "ready", "failed", "approved", "ingested", "published"]).default("draft").notNull(),
  content: text("content"),
  metadata: json("metadata"),
  exportUrl: text("exportUrl"),
  exportedAt: timestamp("exportedAt"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreatorArtifact = typeof creatorArtifacts.$inferSelect;

export const artifactSections = mysqlTable("artifact_sections", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull().references(() => creatorArtifacts.id),
  sectionOrder: int("sectionOrder").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  status: mysqlEnum("status", ["planned", "draft", "ready"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArtifactSection = typeof artifactSections.$inferSelect;

export const learningProjects = mysqlTable("learning_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  brief: text("brief").notNull(),
  language: varchar("language", { length: 8 }).default("en").notNull(),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningProject = typeof learningProjects.$inferSelect;
