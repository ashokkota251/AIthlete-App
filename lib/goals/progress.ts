import type { Activity } from "@/lib/strava/types";
import type {
  Goal,
  GoalActivitySummary,
  GoalReadiness,
  TipSentiment,
} from "./types";
import { activityMatchesGoalSport } from "./sport-map";

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

function valueFor(a: Activity, metric: Goal["metric"]): number {
  return metric === "distance" ? a.distance / 1000 : a.movingTime / 3600;
}

/** Compute readiness from last 60 days of activities matching the goal's sport. */
export function computeGoalReadiness(
  goal: Goal,
  activities: Activity[],
  now: Date = new Date(),
): GoalReadiness {
  const lookbackStart = new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS);
  const eventDate = parseISO(goal.eventDate);

  let longestRecent = 0;
  let totalInWindow = 0;
  let sessionsInWindow = 0;
  let totalLast14 = 0;
  let totalPrev14 = 0;
  const fourteenAgo = new Date(now.getTime() - 14 * DAY_MS);
  const twentyEightAgo = new Date(now.getTime() - 28 * DAY_MS);

  for (const a of activities) {
    if (!activityMatchesGoalSport(a.type, goal.sport)) continue;
    const date = new Date(a.startDate);
    if (date < lookbackStart || date > now) continue;
    const v = valueFor(a, goal.metric);
    totalInWindow += v;
    sessionsInWindow += 1;
    if (v > longestRecent) longestRecent = v;
    if (date >= fourteenAgo) totalLast14 += v;
    else if (date >= twentyEightAgo) totalPrev14 += v;
  }

  const weeksInWindow = LOOKBACK_DAYS / 7;
  const weeklyAvg = totalInWindow / weeksInWindow;
  const sessionsPerWeek = sessionsInWindow / weeksInWindow;
  const readinessRatio = goal.eventTarget > 0
    ? Math.min(1, longestRecent / goal.eventTarget)
    : 0;

  const daysUntilEvent = Math.round((eventDate.getTime() - now.getTime()) / DAY_MS);
  const weeksUntilEvent = Math.max(0, Math.ceil(daysUntilEvent / 7));

  return {
    goalId: goal.id,
    metric: goal.metric,
    eventTarget: goal.eventTarget,
    longestRecent: round1(longestRecent),
    weeklyAvg: round1(weeklyAvg),
    sessionsPerWeek: round1(sessionsPerWeek),
    readinessRatio,
    daysUntilEvent,
    weeksUntilEvent,
    trendUp: totalLast14 > totalPrev14,
    eventPast: daysUntilEvent < 0,
  };
}

/**
 * Sentiment is locked to deterministic readiness rules — the AI gets it as
 * input and phrases around it. Order matters: most-urgent first.
 */
export function computeSentiment(r: GoalReadiness): TipSentiment {
  if (r.readinessRatio >= 0.8 && r.weeksUntilEvent <= 3) return "ready";
  if (r.weeksUntilEvent <= 4 && r.readinessRatio < 0.4) return "at_risk";
  if (r.readinessRatio < 0.3 && !r.trendUp) return "behind";
  return "building";
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

export function defaultGoalTitle(goal: Pick<Goal, "sport" | "metric" | "eventTarget" | "eventDate">): string {
  const sport = goal.sport === "WeightTraining" ? "Strength" : goal.sport;
  const targetLabel =
    goal.metric === "distance" ? `${goal.eventTarget} km` : `${goal.eventTarget} h`;
  const when = parseISO(goal.eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${targetLabel} ${sport} on ${when}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
