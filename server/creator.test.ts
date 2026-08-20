import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "creator-test-user",
      email: "creator@example.com",
      name: "Creator Test",
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

describe("creator router", () => {
  it("returns empty personal libraries when the database is unavailable", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.creator.listMine()).resolves.toEqual([]);
    await expect(caller.creator.listProjects()).resolves.toEqual([]);
    await expect(caller.creator.listTeachingResources()).resolves.toEqual([]);
  });

  it.each(["lesson", "book", "document", "code", "spreadsheet", "chart_spec", "infographic", "poster", "audio_brief", "video_brief", "quiz"] as const)("accepts the supported %s creator mode before generation", async (kind) => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.creator.createArtifact({
      kind,
      title: "Autonomous commerce operating handbook",
      prompt: "Create a practical book blueprint for an ethical autonomous commerce team.",
      language: "en",
    })).rejects.toThrow("Creator Hub is temporarily unavailable");
  });

  it("rejects an unsupported artifact kind", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.creator.createArtifact({
      kind: "unsupported" as any,
      title: "Invalid kind",
      prompt: "This validates that unsupported creator modes are not accepted.",
      language: "en",
    })).rejects.toThrow();
  });

  it("accepts a valid owned-artifact transformation request shape before generation", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.creator.createArtifact({
      kind: "chart_spec",
      title: "Engagement trend chart",
      prompt: "Turn the selected lesson into an accessible learner-progress chart specification.",
      language: "en",
      sourceArtifactId: 12,
    })).rejects.toThrow("Creator Hub is temporarily unavailable");
  });

  it("accepts an owned teaching-resource transformation request shape before generation", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.creator.createArtifact({
      kind: "audio_brief",
      title: "Physics revision audio brief",
      prompt: "Transform the selected class resource into an accessible physics revision audio brief.",
      language: "en",
      sourceResourceId: 9,
    })).rejects.toThrow("Creator Hub is temporarily unavailable");
  });

  it("keeps DOCX export scoped to an available Creator Hub database", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.creator.exportDocx({ artifactId: 42 })).rejects.toThrow("Creator Hub is temporarily unavailable");
  });
});
