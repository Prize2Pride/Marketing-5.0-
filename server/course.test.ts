import { afterEach, describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

const mockedGetDb = vi.mocked(getDb);

afterEach(() => {
  mockedGetDb.mockReset();
  mockedGetDb.mockResolvedValue(null);
});

function selectQuery(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ limit, orderBy }));
  return { from: vi.fn(() => ({ where, orderBy })) };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@prize2pride.com",
      name: "Coach Roued",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("course router", () => {
  it("getLevels returns empty array when db is unavailable", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.getLevels();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getLevel returns null when db is unavailable", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.getLevel({ slug: "test-slug" });
    expect(result).toBeNull();
  });

  it("getCourseTree returns empty array when db is unavailable", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.course.getCourseTree();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("getMyEnrollments returns empty array when db is unavailable", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.course.getMyEnrollments();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMyProgress returns empty array when db is unavailable", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.course.getMyProgress();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin router", () => {
  it("getStats throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.getStats()).rejects.toThrow();
  });

  it("getStats returns null when db unavailable for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.getStats();
    expect(result).toBeNull();
  });

  it("getUsers throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.getUsers({ limit: 10, offset: 0 })).rejects.toThrow();
  });

  it("does not expose the artifact review queue to non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.listArtifactsForReview()).rejects.toThrow();
  });

  it("returns an empty review queue for an admin when the database is unavailable", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.listArtifactsForReview()).resolves.toEqual([]);
  });

  it("aggregates governed content-feed states, including legacy drafts", async () => {
    const db = { select: vi.fn(() => ({ from: vi.fn().mockResolvedValue([{ status: "draft" }, { status: "ready" }, { status: "approved" }, { status: "ingested" }, { status: "published" }, { status: "failed" }]) })) };
    mockedGetDb.mockResolvedValue(db as any);
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.getContentFeedMetrics()).resolves.toEqual({ generating: 1, ready: 1, approved: 1, ingested: 1, published: 1, failed: 1, total: 6 });
  });

  it("requires database access to review or ingest an artifact", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.reviewArtifact({ artifactId: 42, decision: "approve" })).rejects.toThrow("Database unavailable");
    await expect(caller.admin.publishArtifactAsChapter({ artifactId: 42, moduleId: 7, publishImmediately: false })).rejects.toThrow("Database unavailable");
  });

  it("records explicit approval metadata for a ready artifact", async () => {
    const updated: Array<Record<string, unknown>> = [];
    const db = {
      select: vi.fn(() => selectQuery([{ id: 44, status: "ready" }])),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          updated.push(values);
          return { where: vi.fn().mockResolvedValue(undefined) };
        }),
      })),
    };
    mockedGetDb.mockResolvedValue(db as any);
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.admin.reviewArtifact({ artifactId: 44, decision: "approve", reviewNotes: "Ready for a controlled course draft." }))
      .resolves.toEqual({ status: "approved" });
    expect(updated[0]).toMatchObject({ status: "approved", reviewedBy: 1, reviewNotes: "Ready for a controlled course draft." });
    expect(updated[0].reviewedAt).toBeInstanceOf(Date);
  });

  it.each([
    [false, "ingested"],
    [true, "published"],
  ] as const)("records %s chapter ingestion as %s without conflating its status", async (publishImmediately, expectedStatus) => {
    const updated: Array<Record<string, unknown>> = [];
    const insertedValues = vi.fn().mockResolvedValue([{ insertId: 71 }]);
    const artifact = { id: 45, status: "approved", content: "# A practical paid-media lesson", language: "en", kind: "lesson", title: "Paid Media Foundations" };
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(selectQuery([artifact]))
        .mockReturnValueOnce(selectQuery([{ id: 7 }]))
        .mockReturnValueOnce(selectQuery([])),
      insert: vi.fn(() => ({ values: insertedValues })),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          updated.push(values);
          return { where: vi.fn().mockResolvedValue(undefined) };
        }),
      })),
    };
    mockedGetDb.mockResolvedValue(db as any);
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.admin.publishArtifactAsChapter({ artifactId: 45, moduleId: 7, publishImmediately }))
      .resolves.toMatchObject({ chapterId: 71, isPublished: publishImmediately });
    expect(insertedValues).toHaveBeenCalledWith(expect.objectContaining({ moduleId: 7, isPublished: publishImmediately, contentEn: artifact.content }));
    expect(updated[0]).toEqual({ status: expectedStatus });
  });

  it("lists submitted educator applications for an administrator", async () => {
    const application = { id: 12, userId: 8, onboardingStatus: "submitted", expertise: "Physics", bio: "Experienced physics educator", createdAt: new Date(), updatedAt: new Date() };
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([application]) })) })) })) };
    mockedGetDb.mockResolvedValue(db as any);
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.listEducatorApplications()).resolves.toEqual([application]);
  });

  it.each([
    ["approve", "approved", true],
    ["reject", "rejected", false],
  ] as const)("records educator application %s decisions safely", async (decision, expectedStatus, promotesRole) => {
    const updates: Array<Record<string, unknown>> = [];
    const db = {
      select: vi.fn(() => selectQuery([{ id: 12, userId: 8, onboardingStatus: "submitted" }])),
      update: vi.fn(() => ({ set: vi.fn((values: Record<string, unknown>) => { updates.push(values); return { where: vi.fn().mockResolvedValue(undefined) }; }) })),
    };
    mockedGetDb.mockResolvedValue(db as any);
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.reviewEducatorApplication({ userId: 8, decision, reviewNotes: "Reviewed" })).resolves.toEqual({ approved: promotesRole });
    expect(updates[0]).toMatchObject({ onboardingStatus: expectedStatus, reviewedBy: 1, reviewNotes: "Reviewed" });
    expect(updates[0].reviewedAt).toBeInstanceOf(Date);
    expect(updates.length).toBe(promotesRole ? 2 : 1);
    if (promotesRole) expect(updates[1]).toEqual({ role: "educator" });
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
  });
});

describe("course builder router", () => {
  it("returns no saved blueprints when the database is unavailable", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.courseBuilder.listMine()).resolves.toEqual([]);
  });

  it("validates blueprint scope and fails safely when generation storage is unavailable", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.courseBuilder.createBlueprint({ title: "AI", audience: "teachers", brief: "short", language: "en", moduleCount: 1 })).rejects.toThrow();
    await expect(caller.courseBuilder.createBlueprint({ title: "Practical AI for Teachers", audience: "secondary school teachers", brief: "Create a hands-on course with ethical classroom examples, practical projects, and formative assessment.", language: "en", moduleCount: 6 })).rejects.toThrow("Course Builder is temporarily unavailable");
  });

  it("validates Course Builder lesson-draft selection before saving a generated example-rich lesson", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.courseBuilder.createLessonDraft({ blueprintId: 1, moduleIndex: -1, lessonIndex: 0 })).rejects.toThrow();
    await expect(caller.courseBuilder.createLessonDraft({ blueprintId: 1, moduleIndex: 0, lessonIndex: 0 })).rejects.toThrow("Course Builder is temporarily unavailable");
  });
});
