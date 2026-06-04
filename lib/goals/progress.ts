import type { Activity, ActivityType } from "@/lib/strava/types";
import type {
  Goal,
  GoalActivitySummary,
  GoalTrainingStats,
  TipSentiment,
} from "./types";

const DAY_MS = 86_400_000;
const LOOKBACK_DAYS = 60;

function midnightISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Deterministic training snapshot — all activities, no sport filter.
 * The AI consumes this plus the raw last-10 activities to judge readiness.
 */
export function computeTrainingStats(
  goal: Goal,
  activities: Activity[],
  now: Date = new Date(),
): GoalTrainingStats {
  const lookbackStart = new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS);
  const eventDate = parseISO(goal.eventDate);

  let totalSessions = 0;
  let totalHours = 0;
  let last14Hours = 0;
  let prev14Hours = 0;
  const sportBreakdown: Partial<Record<ActivityType, number>> = {};
  const fourteenAgo = new Date(now.getTime() - 14 * DAY_MS);
  const twentyEightAgo = new Date(now.getTime() - 28 * DAY_MS);

  for (const a of activities) {
    const date = new Date(a.startDate);
    if (date < lookbackStart || date > now) continue;
    totalSessions += 1;
    const hours = a.movingTime / 3600;
    totalHours += hours;
    sportBreakdown[a.type] = (sportBreakdown[a.type] ?? 0) + 1;
    if (date >= fourteenAgo) last14Hours += hours;
    else if (date >= twentyEightAgo) prev14Hours += hours;
  }

  const weeksInWindow = LOOKBACK_DAYS / 7;
  const sessionsPerWeek = round1(totalSessions / weeksInWindow);
  const weeklyHours = round1(totalHours / weeksInWindow);

  const daysUntilEvent = Math.round((eventDate.getTime() - now.getTime()) / DAY_MS);
  const weeksUntilEvent = Math.max(0, Math.ceil(daysUntilEvent / 7));

  return {
    goalId: goal.id,
    metric: goal.metric,
    eventTarget: goal.eventTarget,
    totalSessions,
    sessionsPerWeek,
    totalHours: round1(totalHours),
    weeklyHours,
    sportBreakdown,
    daysUntilEvent,
    weeksUntilEvent,
    trendUp: last14Hours > prev14Hours,
    eventPast: daysUntilEvent < 0,
  };
}

/** Fallback sentiment when the AI is unavailable. AI normally picks its own. */
export function fallbackSentiment(s: GoalTrainingStats): TipSentiment {
  if (s.totalSessions === 0) return s.weeksUntilEvent <= 4 ? "at_risk" : "behind";
  if (s.weeksUntilEvent <= 3 && s.sessionsPerWeek >= 3 && s.trendUp) return "ready";
  if (s.weeksUntilEvent <= 4 && s.sessionsPerWeek < 1.5) return "at_risk";
  if (s.sessionsPerWeek < 1 && !s.trendUp) return "behind";
  return "building";
}

/** Fallback readiness percent — a rough proxy for when the AI is unavailable. */
export function fallbackReadinessPercent(s: GoalTrainingStats): number {
  // Combines volume (weekly hours capped at 8) and consistency (sessions/wk capped at 5).
  const volumeScore = Math.min(1, s.weeklyHours / 8);
  const consistencyScore = Math.min(1, s.sessionsPerWeek / 5);
  const trendBonus = s.trendUp ? 0.1 : 0;
  return Math.round(Math.min(1, volumeScore * 0.55 + consistencyScore * 0.35 + trendBonus) * 100);
}

export function summariseForAI(activities: Activity[], limit = 10): GoalActivitySummary[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  return sorted.slice(0, limit).map((a) => ({
    type: a.type,
    date: midnightISO(new Date(a.startDate)),
    distanceKm: round1(a.distance / 1000),
    movingMin: Math.round(a.movingTime / 60),
    avgHr: a.averageHeartrate,
  }));
}

export function defaultGoalTitle(
  goal: Pick<Goal, "sport" | "metric" | "eventTarget" | "eventDate">,
): string {
  const sport = goal.sport === "WeightTraining" ? "Strength" : goal.sport;
  const targetLabel =
    goal.metric === "distance" ? `${goal.eventTarget} km` : `${goal.eventTarget} h`;
  const when = parseISO(goal.eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${targetLabel} ${sport} on ${when}`;
}

/** Quick deadline check used for active/archived partitioning. */
export function isGoalEventPast(goal: Goal, now: Date = new Date()): boolean {
  return parseISO(goal.eventDate).getTime() < now.getTime() - DAY_MS;
}

/** Latest activity (by start_date) — used to invalidate the per-day tip cache. */
export function latestActivityId(activities: Activity[]): string | null {
  let best: Activity | null = null;
  for (const a of activities) {
    if (!best || new Date(a.startDate) > new Date(best.startDate)) best = a;
  }
  return best?.id ?? null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
