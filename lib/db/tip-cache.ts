import "server-only";
import { db } from "./client";
import type { GoalTip } from "@/lib/goals/types";

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface TipCacheEntry {
  tip: GoalTip;
  lastActivityId: string | null;
}

export async function readTipForToday(
  userId: string,
  goalId: string,
): Promise<TipCacheEntry | null> {
  if (!userId || !goalId) return null;
  const c = await db();
  const res = await c.execute({
    sql: `SELECT tip_json, last_activity_id FROM goal_tips
          WHERE goal_id = ? AND user_id = ? AND tip_date = ?`,
    args: [goalId, userId, todayISO()],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  try {
    return {
      tip: JSON.parse(row.tip_json as string) as GoalTip,
      lastActivityId: (row.last_activity_id as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function writeTipForToday(
  userId: string,
  goalId: string,
  tip: GoalTip,
  lastActivityId: string | null,
  tipDate?: string,
): Promise<void> {
  if (!userId || !goalId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT INTO goal_tips (goal_id, tip_date, user_id, tip_json, saved_at, last_activity_id)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(goal_id, tip_date) DO UPDATE SET
            tip_json = excluded.tip_json,
            saved_at = excluded.saved_at,
            last_activity_id = excluded.last_activity_id`,
    args: [
      goalId,
      tipDate ?? todayISO(),
      userId,
      JSON.stringify(tip),
      Date.now(),
      lastActivityId,
    ],
  });
}

export async function insertTipIfAbsent(
  userId: string,
  goalId: string,
  tipDate: string,
  tip: GoalTip,
): Promise<void> {
  if (!userId || !goalId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT OR IGNORE INTO goal_tips (goal_id, tip_date, user_id, tip_json, saved_at, last_activity_id)
          VALUES (?, ?, ?, ?, ?, NULL)`,
    args: [goalId, tipDate, userId, JSON.stringify(tip), Date.now()],
  });
}
