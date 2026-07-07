import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

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
