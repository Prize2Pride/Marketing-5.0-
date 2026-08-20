import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));

import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { expireLessonRecordings } from "./scheduled/recordingRetention";

const mockedGetDb = vi.mocked(getDb);
const mockedAuthenticate = vi.mocked(sdk.authenticateRequest);

function response() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe("recording retention heartbeat", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects non-cron callers without touching the database", async () => {
    mockedAuthenticate.mockResolvedValue({ isCron: false } as any);
    const res = response();
    await expireLessonRecordings({} as any, res as any);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "cron-only" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("expires eligible recordings and clears application storage references", async () => {
    mockedAuthenticate.mockResolvedValue({ isCron: true, taskUid: "retention-task" } as any);
    const updateValues: Array<Record<string, unknown>> = [];
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 5 }, { id: 6 }]) })) })),
      update: vi.fn(() => ({ set: vi.fn((values: Record<string, unknown>) => { updateValues.push(values); return { where: vi.fn().mockResolvedValue(undefined) }; }) })),
    };
    mockedGetDb.mockResolvedValue(db as any);
    const res = response();
    await expireLessonRecordings({} as any, res as any);
    expect(updateValues[0]).toEqual({ retentionStatus: "expired", storageKey: null, sourceUrl: null });
    expect(res.json).toHaveBeenCalledWith({ ok: true, expired: 2 });
  });

  it("is orphan-safe and idempotent when a valid scheduled run has no active expired recordings", async () => {
    mockedAuthenticate.mockResolvedValue({ isCron: true, taskUid: "retention-task" } as any);
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })), update: vi.fn() };
    mockedGetDb.mockResolvedValue(db as any);
    const res = response();
    await expireLessonRecordings({} as any, res as any);
    expect(db.update).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true, expired: 0 });
  });
});
