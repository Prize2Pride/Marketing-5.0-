import type { Request, Response } from "express";
import { and, eq, lt } from "drizzle-orm";
import { lessonRecordings } from "../../drizzle/schema";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";

/**
 * Marks expired recordings unavailable and removes their application storage
 * references. The built-in storage layer does not expose object deletion; once
 * a key is dropped from the database, it is no longer reachable through this
 * platform and the expired row remains auditable.
 */
export async function expireLessonRecordings(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database-unavailable" });
    const now = new Date();
    const expired = await db.select({ id: lessonRecordings.id }).from(lessonRecordings)
      .where(and(eq(lessonRecordings.retentionStatus, "active"), lt(lessonRecordings.expiresAt, now)));
    if (!expired.length) return res.json({ ok: true, expired: 0 });
    await db.update(lessonRecordings).set({ retentionStatus: "expired", storageKey: null, sourceUrl: null })
      .where(and(eq(lessonRecordings.retentionStatus, "active"), lt(lessonRecordings.expiresAt, now)));
    return res.json({ ok: true, expired: expired.length });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[RecordingRetention] Failed", error);
    return res.status(500).json({ error: detail, context: { path: "/api/scheduled/recording-retention" }, timestamp: new Date().toISOString() });
  }
}
