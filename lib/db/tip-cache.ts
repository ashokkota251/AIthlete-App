import "server-only";
import { db } from "./client";
import type { GoalTip } from "@/lib/goals/types";

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function readTipForToday(
  userId: string,
  goalId: string,
): Promise<GoalTip | null> {
  if (!userId || !goalId) return null;
  const c = await db();
  const res = await c.execute({
    sql: `SELECT tip_json FROM goal_tips WHERE goal_id = ? AND user_id = ? AND tip_date = ?`,
    args: [goalId, userId, todayISO()],
  });
  if (res.rows.length === 0) return null;
  try {
    return JSON.parse(res.rows[0].tip_json as string) as GoalTip;
  } catch {
    return null;
  }
}

export async function writeTipForToday(
  userId: string,
  goalId: string,
  tip: GoalTip,
  tipDate?: string,
): Promise<void> {
  if (!userId || !goalId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT INTO goal_tips (goal_id, tip_date, user_id, tip_json, saved_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(goal_id, tip_date) DO UPDATE SET
            tip_json = excluded.tip_json,
            saved_at = excluded.saved_at`,
    args: [goalId, tipDate ?? todayISO(), userId, JSON.stringify(tip), Date.now()],
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
    sql: `INSERT OR IGNORE INTO goal_tips (goal_id, tip_date, user_id, tip_json, saved_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [goalId, tipDate, userId, JSON.stringify(tip), Date.now()],
  });
}
