import "server-only";
import { db } from "./client";
import type { DebriefNarration, DeepNarration } from "@/lib/metrics/types";

const MAX_PER_USER = 5;

export interface DebriefCacheEntry {
  activityId: string;
  debrief?: DebriefNarration;
  plan?: DeepNarration;
}

async function evictBeyondLimit(userId: string): Promise<void> {
  const c = await db();
  await c.execute({
    sql: `DELETE FROM debrief_cache
          WHERE user_id = ? AND activity_id NOT IN (
            SELECT activity_id FROM debrief_cache
            WHERE user_id = ? ORDER BY saved_at DESC LIMIT ?
          )`,
    args: [userId, userId, MAX_PER_USER],
  });
}

export async function readDebriefEntry(
  userId: string,
  activityId: string,
): Promise<DebriefCacheEntry | null> {
  if (!userId || !activityId) return null;
  const c = await db();
  const res = await c.execute({
    sql: `SELECT activity_id, debrief_json, plan_json FROM debrief_cache
          WHERE user_id = ? AND activity_id = ?`,
    args: [userId, activityId],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    activityId: row.activity_id as string,
    debrief: row.debrief_json
      ? (JSON.parse(row.debrief_json as string) as DebriefNarration)
      : undefined,
    plan: row.plan_json
      ? (JSON.parse(row.plan_json as string) as DeepNarration)
      : undefined,
  };
}

export async function writeDebriefNarration(
  userId: string,
  activityId: string,
  debrief: DebriefNarration,
): Promise<void> {
  if (!userId || !activityId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT INTO debrief_cache (user_id, activity_id, debrief_json, plan_json, saved_at)
          VALUES (?, ?, ?, NULL, ?)
          ON CONFLICT(user_id, activity_id) DO UPDATE SET
            debrief_json = excluded.debrief_json,
            saved_at = excluded.saved_at`,
    args: [userId, activityId, JSON.stringify(debrief), Date.now()],
  });
  await evictBeyondLimit(userId);
}

export async function writeDebriefPlan(
  userId: string,
  activityId: string,
  plan: DeepNarration,
): Promise<void> {
  if (!userId || !activityId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT INTO debrief_cache (user_id, activity_id, debrief_json, plan_json, saved_at)
          VALUES (?, ?, NULL, ?, ?)
          ON CONFLICT(user_id, activity_id) DO UPDATE SET
            plan_json = excluded.plan_json,
            saved_at = excluded.saved_at`,
    args: [userId, activityId, JSON.stringify(plan), Date.now()],
  });
  await evictBeyondLimit(userId);
}

export async function insertDebriefIfAbsent(
  userId: string,
  activityId: string,
  payload: { debrief?: DebriefNarration; plan?: DeepNarration; savedAt?: number },
): Promise<void> {
  if (!userId || !activityId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT OR IGNORE INTO debrief_cache (user_id, activity_id, debrief_json, plan_json, saved_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      userId,
      activityId,
      payload.debrief ? JSON.stringify(payload.debrief) : null,
      payload.plan ? JSON.stringify(payload.plan) : null,
      payload.savedAt ?? Date.now(),
    ],
  });
  // Eviction not run here on purpose — migration may insert >5 entries, then
  // a future write will trim to 5.
}
