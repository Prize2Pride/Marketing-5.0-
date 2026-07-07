import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Course Levels ────────────────────────────────────────────────────────────
export const levels = mysqlTable("levels", {
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
});

export type Level = typeof levels.$inferSelect;

// ─── Modules ──────────────────────────────────────────────────────────────────
export const modules = mysqlTable("modules", {
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
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Module = typeof modules.$inferSelect;

// ─── Chapters ─────────────────────────────────────────────────────────────────
export const chapters = mysqlTable("chapters", {
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
