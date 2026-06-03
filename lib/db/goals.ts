import "server-only";
import { db } from "./client";
import type { Goal, GoalMetric, GoalSport } from "@/lib/goals/types";

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    sport: row.sport as GoalSport,
    metric: row.metric as GoalMetric,
    eventTarget: row.event_target as number,
    eventDate: row.event_date as string,
    title: row.title as string,
    createdAt: row.created_at as number,
    archivedAt: (row.archived_at as number | null) ?? undefined,
  };
}

export async function listGoals(userId: string): Promise<Goal[]> {
  if (!userId) return [];
  const c = await db();
  const res = await c.execute({
    sql: `SELECT id, sport, metric, event_target, event_date, title, created_at, archived_at
          FROM goals WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });
  return res.rows.map((r) => rowToGoal(r as Record<string, unknown>));
}

export async function getGoal(userId: string, goalId: string): Promise<Goal | null> {
  if (!userId || !goalId) return null;
  const c = await db();
  const res = await c.execute({
    sql: `SELECT id, sport, metric, event_target, event_date, title, created_at, archived_at
          FROM goals WHERE user_id = ? AND id = ?`,
    args: [userId, goalId],
  });
  if (res.rows.length === 0) return null;
  return rowToGoal(res.rows[0] as Record<string, unknown>);
}

export async function upsertGoal(userId: string, goal: Goal): Promise<void> {
  if (!userId) throw new Error("upsertGoal: userId required");
  const c = await db();
  await c.execute({
    sql: `INSERT INTO goals (id, user_id, sport, metric, event_target, event_date, title, created_at, archived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            sport = excluded.sport,
            metric = excluded.metric,
            event_target = excluded.event_target,
            event_date = excluded.event_date,
            title = excluded.title,
            archived_at = excluded.archived_at`,
    args: [
      goal.id,
      userId,
      goal.sport,
      goal.metric,
      goal.eventTarget,
      goal.eventDate,
      goal.title,
      goal.createdAt,
      goal.archivedAt ?? null,
    ],
  });
}

/** Insert only if not already there — used by /api/migrate for idempotency. */
export async function insertGoalIfAbsent(userId: string, goal: Goal): Promise<void> {
  if (!userId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT OR IGNORE INTO goals (id, user_id, sport, metric, event_target, event_date, title, created_at, archived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      goal.id,
      userId,
      goal.sport,
      goal.metric,
      goal.eventTarget,
      goal.eventDate,
      goal.title,
      goal.createdAt,
      goal.archivedAt ?? null,
    ],
  });
}

export async function deleteGoalRow(userId: string, goalId: string): Promise<void> {
  if (!userId || !goalId) return;
  const c = await db();
  await c.batch(
    [
      { sql: `DELETE FROM goal_tips WHERE goal_id = ? AND user_id = ?`, args: [goalId, userId] },
      { sql: `DELETE FROM goals WHERE id = ? AND user_id = ?`, args: [goalId, userId] },
    ],
    "write",
  );
}
