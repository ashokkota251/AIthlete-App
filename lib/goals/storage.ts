"use client";

import type { Goal, GoalTip } from "./types";

const GOALS_KEY_PREFIX = "aithlete:goals:v2:";
const TIPS_KEY_PREFIX = "aithlete:tips:v2:";
const TIP_MAX_ENTRIES = 30;

function isValidAthleteId(athleteId: string): boolean {
  if (!athleteId) return false;
  const trimmed = athleteId.trim();
  if (!trimmed) return false;
  if (trimmed === "undefined" || trimmed === "null" || trimmed === "NaN")
    return false;
  return true;
}

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private-mode — ignore */
  }
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ── Goals ────────────────────────────────────────────────────────────── */

export function readGoals(athleteId: string): Goal[] {
  if (!isValidAthleteId(athleteId)) return [];
  return safeRead<Goal[]>(GOALS_KEY_PREFIX + athleteId) ?? [];
}

export function writeGoals(athleteId: string, goals: Goal[]): void {
  if (!isValidAthleteId(athleteId)) return;
  safeWrite(GOALS_KEY_PREFIX + athleteId, goals);
}

export function upsertGoal(athleteId: string, goal: Goal): Goal[] {
  const goals = readGoals(athleteId);
  const idx = goals.findIndex((g) => g.id === goal.id);
  const next = idx === -1 ? [goal, ...goals] : goals.map((g) => (g.id === goal.id ? goal : g));
  writeGoals(athleteId, next);
  return next;
}

export function deleteGoal(athleteId: string, goalId: string): Goal[] {
  const next = readGoals(athleteId).filter((g) => g.id !== goalId);
  writeGoals(athleteId, next);
  // Also drop any cached tips for that goal so they don't leak.
  dropTipsForGoal(athleteId, goalId);
  return next;
}

export function archiveGoal(athleteId: string, goalId: string): Goal[] {
  const next = readGoals(athleteId).map((g) =>
    g.id === goalId ? { ...g, archivedAt: Date.now() } : g,
  );
  writeGoals(athleteId, next);
  return next;
}

/* ── Tip cache (per goal per date, LRU) ───────────────────────────────── */

interface TipEntry {
  goalId: string;
  date: string;
  tip: GoalTip;
  savedAt: number;
}

interface TipCache {
  entries: Record<string, TipEntry>;
  /** keys, newest first */
  order: string[];
}

function tipKey(goalId: string, date: string): string {
  return `${goalId}:${date}`;
}

function readTipCache(athleteId: string): TipCache {
  return (
    safeRead<TipCache>(TIPS_KEY_PREFIX + athleteId) ?? {
      entries: {},
      order: [],
    }
  );
}

function writeTipCache(athleteId: string, cache: TipCache): void {
  safeWrite(TIPS_KEY_PREFIX + athleteId, cache);
}

export function readTodayTip(athleteId: string, goalId: string): GoalTip | null {
  if (!isValidAthleteId(athleteId) || !goalId) return null;
  const cache = readTipCache(athleteId);
  return cache.entries[tipKey(goalId, todayISO())]?.tip ?? null;
}

export function writeTodayTip(
  athleteId: string,
  goalId: string,
  tip: GoalTip,
): void {
  if (!isValidAthleteId(athleteId) || !goalId) return;
  const cache = readTipCache(athleteId);
  const key = tipKey(goalId, todayISO());
  cache.entries[key] = {
    goalId,
    date: todayISO(),
    tip,
    savedAt: Date.now(),
  };
  cache.order = [key, ...cache.order.filter((k) => k !== key)];
  while (cache.order.length > TIP_MAX_ENTRIES) {
    const evict = cache.order.pop();
    if (evict) delete cache.entries[evict];
  }
  writeTipCache(athleteId, cache);
}

function dropTipsForGoal(athleteId: string, goalId: string): void {
  if (!isValidAthleteId(athleteId) || !goalId) return;
  const cache = readTipCache(athleteId);
  let changed = false;
  for (const key of Object.keys(cache.entries)) {
    if (cache.entries[key].goalId === goalId) {
      delete cache.entries[key];
      changed = true;
    }
  }
  if (changed) {
    cache.order = cache.order.filter((k) => k in cache.entries);
    writeTipCache(athleteId, cache);
  }
}
