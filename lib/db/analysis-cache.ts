import "server-only";
import { db } from "./client";
import type { AnalysisResult } from "@/lib/ai/analysis";

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface AnalysisCacheEntry {
  date: string;
  count: number;
  data: AnalysisResult;
}

export async function readAnalysisForToday(
  userId: string,
): Promise<AnalysisCacheEntry | null> {
  if (!userId) return null;
  const c = await db();
  const res = await c.execute({
    sql: `SELECT date, count, data_json FROM analysis_cache WHERE user_id = ? AND date = ?`,
    args: [userId, todayISO()],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  try {
    return {
      date: row.date as string,
      count: row.count as number,
      data: JSON.parse(row.data_json as string) as AnalysisResult,
    };
  } catch {
    return null;
  }
}

export async function writeAnalysisForToday(
  userId: string,
  count: number,
  data: AnalysisResult,
  date?: string,
): Promise<void> {
  if (!userId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT INTO analysis_cache (user_id, date, count, data_json, saved_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET
            count = excluded.count,
            data_json = excluded.data_json,
            saved_at = excluded.saved_at`,
    args: [userId, date ?? todayISO(), count, JSON.stringify(data), Date.now()],
  });
}

export async function insertAnalysisIfAbsent(
  userId: string,
  date: string,
  count: number,
  data: AnalysisResult,
): Promise<void> {
  if (!userId) return;
  const c = await db();
  await c.execute({
    sql: `INSERT OR IGNORE INTO analysis_cache (user_id, date, count, data_json, saved_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [userId, date, count, JSON.stringify(data), Date.now()],
  });
}
