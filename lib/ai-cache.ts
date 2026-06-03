"use client";

import type { AnalysisResult } from "./ai/analysis";
import type { DebriefNarration, DeepNarration } from "./metrics/types";

const ANALYSIS_KEY_PREFIX = "aithlete:analysis:v1:";
const DEBRIEF_KEY_PREFIX = "aithlete:debrief:v1:";
const DEBRIEF_MAX_ENTRIES = 5;

/**
 * Treat empty / "undefined" / "null" / "NaN" as "no athlete" — guards against
 * upstream auth quirks where `session.stravaAthleteId` arrives as a stringified
 * nullish value rather than a real id.
 */
function isValidAthleteId(athleteId: string): boolean {
  if (!athleteId) return false;
  const trimmed = athleteId.trim();
  if (!trimmed) return false;
  if (trimmed === "undefined" || trimmed === "null" || trimmed === "NaN")
    return false;
  return true;
}

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
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
    // quota / private-mode — ignore
  }
}

/* ── Analysis ─────────────────────────────────────────────────────────── */

interface AnalysisCacheEntry {
  date: string;
  count: number;
  data: AnalysisResult;
  savedAt: number;
}

export function readAnalysisCache(athleteId: string): AnalysisCacheEntry | null {
  if (!isValidAthleteId(athleteId)) return null;
  const entry = safeRead<AnalysisCacheEntry>(ANALYSIS_KEY_PREFIX + athleteId);
  if (!entry) return null;
  if (entry.date !== todayISO()) return null;
  return entry;
}

export function writeAnalysisCache(
  athleteId: string,
  data: AnalysisResult,
  count: number,
): void {
  if (!isValidAthleteId(athleteId)) return;
  const entry: AnalysisCacheEntry = {
    date: todayISO(),
    count,
    data,
    savedAt: Date.now(),
  };
  safeWrite(ANALYSIS_KEY_PREFIX + athleteId, entry);
}

/* ── Debrief (per-activity, LRU capped at 5) ──────────────────────────── */

interface DebriefEntry {
  debrief?: DebriefNarration;
  plan?: DeepNarration;
  savedAt: number;
}

interface DebriefCache {
  entries: Record<string, DebriefEntry>;
  /** activityIds, newest first */
  order: string[];
}

function readDebriefCache(athleteId: string): DebriefCache {
  return (
    safeRead<DebriefCache>(DEBRIEF_KEY_PREFIX + athleteId) ?? {
      entries: {},
      order: [],
    }
  );
}

function writeDebriefCache(athleteId: string, cache: DebriefCache): void {
  safeWrite(DEBRIEF_KEY_PREFIX + athleteId, cache);
}

function bumpAndEvict(cache: DebriefCache, activityId: string): void {
  cache.order = [activityId, ...cache.order.filter((id) => id !== activityId)];
  while (cache.order.length > DEBRIEF_MAX_ENTRIES) {
    const evictId = cache.order.pop();
    if (evictId) delete cache.entries[evictId];
  }
}

export function readDebriefEntry(
  athleteId: string,
  activityId: string,
): DebriefEntry | null {
  if (!isValidAthleteId(athleteId) || !activityId) return null;
  const cache = readDebriefCache(athleteId);
  return cache.entries[activityId] ?? null;
}

export function writeDebriefNarration(
  athleteId: string,
  activityId: string,
  debrief: DebriefNarration,
): void {
  if (!isValidAthleteId(athleteId) || !activityId) return;
  const cache = readDebriefCache(athleteId);
  const existing = cache.entries[activityId];
  cache.entries[activityId] = {
    debrief,
    plan: existing?.plan,
    savedAt: Date.now(),
  };
  bumpAndEvict(cache, activityId);
  writeDebriefCache(athleteId, cache);
}

export function writeDebriefPlan(
  athleteId: string,
  activityId: string,
  plan: DeepNarration,
): void {
  if (!isValidAthleteId(athleteId) || !activityId) return;
  const cache = readDebriefCache(athleteId);
  const existing = cache.entries[activityId];
  cache.entries[activityId] = {
    debrief: existing?.debrief,
    plan,
    savedAt: Date.now(),
  };
  bumpAndEvict(cache, activityId);
  writeDebriefCache(athleteId, cache);
}
