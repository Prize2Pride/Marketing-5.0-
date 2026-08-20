import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function context(role: "user" | "educator" | "admin"): TrpcContext {
  return {
    user: { id: 11, openId: `school-${role}`, email: `${role}@example.com`, name: role, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("teacher school router", () => {
  it("returns no public schools when the database is unavailable", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.schools.listPublic()).resolves.toEqual([]);
  });

  it("does not allow learners to create or inspect teacher subplatforms", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.schools.listMine()).rejects.toThrow();
    await expect(caller.schools.createSchool({ subjectKey: "physics", nameEn: "Physics Lab", nameFr: "Laboratoire de physique", nameAr: "مختبر الفيزياء" })).rejects.toThrow();
  });

  it("allows educator queries to fail safely when the database is unavailable", async () => {
    const caller = appRouter.createCaller(context("educator"));
    await expect(caller.schools.listMine()).resolves.toEqual([]);
    await expect(caller.schools.createSchool({ subjectKey: "quantum_computing", nameEn: "Quantum Lab", nameFr: "Laboratoire quantique", nameAr: "مختبر كمي" })).rejects.toThrow("Database unavailable");
  });

  it("validates educator applications and direct resource inputs before making database changes", async () => {
    const learner = appRouter.createCaller(context("user"));
    const educator = appRouter.createCaller(context("educator"));
    await expect(learner.schools.submitEducatorApplication({ bio: "too short", expertise: "AI" })).rejects.toThrow();
    await expect(educator.schools.createResource({ schoolId: 1, classId: 2, kind: "pdf", title: "Handout", sourceUrl: "not-a-url", publish: true })).rejects.toThrow();
  });

  it("keeps class learner progress and educator-only operations protected", async () => {
    const learner = appRouter.createCaller(context("user"));
    const educator = appRouter.createCaller(context("educator"));
    await expect(learner.schools.listClassLearners({ classId: 1 })).rejects.toThrow();
    await expect(educator.schools.listClassLearners({ classId: 1 })).resolves.toEqual([]);
    await expect(learner.schools.sendClassMessage({ classId: 1, recipientId: 2, body: "" })).rejects.toThrow();
  });
});
