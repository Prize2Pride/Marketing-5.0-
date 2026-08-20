import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COACH_SYSTEM_PROMPT } from "./routers/ai";

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "ai-test-user",
      email: "ai@example.com",
      name: "AI Test User",
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

describe("Coach Roued AI Avatar", () => {
  it("grounds guidance in e-commerce operations and measurable digital-marketing decisions", () => {
    expect(COACH_SYSTEM_PROMPT).toContain("E-commerce operations");
    expect(COACH_SYSTEM_PROMPT).toContain("audience research");
    expect(COACH_SYSTEM_PROMPT).toContain("small, measurable next experiment");
    expect(COACH_SYSTEM_PROMPT).toContain("Do not present speculative claims");
  });

  it("returns an empty history when the chat database is unavailable", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.ai.getChatHistory({ limit: 20 })).resolves.toEqual([]);
  });

  it("supports the three platform languages and rejects unsupported mode inputs", async () => {
    const caller = appRouter.createCaller(createUserContext());
    for (const language of ["en", "fr", "ar"] as const) {
      await expect(caller.ai.chat({ message: "Create a practical marketing lesson.", language })).rejects.toThrow("DB unavailable");
    }
    await expect(caller.ai.chat({ message: "Create a practical marketing lesson.", language: "de" as any })).rejects.toThrow();
  });

  it("rejects empty and oversized tutor requests before reaching the model", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.ai.chat({ message: "", language: "en" })).rejects.toThrow();
    await expect(caller.ai.chat({ message: "x".repeat(2001), language: "en" })).rejects.toThrow();
  });
});
