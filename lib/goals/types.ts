import type { ActivityType } from "@/lib/strava/types";

export type GoalMetric = "distance" | "time";

/** Sport-family the event belongs to. */
export type GoalSport =
  | "Ride"
  | "Run"
  | "Swim"
  | "Workout"
  | "WeightTraining"
  | "Hike"
  | "Walk";

/**
 * Event-prep goal: "I want to be able to do {eventTarget} on {eventDate}."
 * The target is the capability needed on event day — not a cumulative volume.
 */
export interface Goal {
  id: string;
  sport: GoalSport;
  metric: GoalMetric;
  /** Capability needed on event day — km (distance) or hours (time). */
  eventTarget: number;
  /** Event date — YYYY-MM-DD. */
  eventDate: string;
  title: string;
  createdAt: number;
  /** Set when the user archives the goal manually, or the event date has passed. */
  archivedAt?: number;
}

/**
 * Deterministic snapshot of training capability — computed before the AI sees it.
 * Lookback window = last 60 days of activity, filtered to the goal's sport.
 */
export interface GoalReadiness {
  goalId: string;
  metric: GoalMetric;
  eventTarget: number;
  /** Single longest session in the lookback — km or hours. */
  longestRecent: number;
  /** Average per-week volume — km or hours. */
  weeklyAvg: number;
  /** Sessions per week in this sport over the lookback. */
  sessionsPerWeek: number;
  /** longestRecent / eventTarget, capped at 1 for display. */
  readinessRatio: number;
  daysUntilEvent: number;
  weeksUntilEvent: number;
  /** True when the last 14 days' volume exceeds the prior 14. */
  trendUp: boolean;
  /** True when eventDate <= today. */
  eventPast: boolean;
}

export type TipSentiment = "ready" | "building" | "behind" | "at_risk";

export interface GoalTip {
  headline: string;
  sentiment: TipSentiment;
  status: string;
  actions: string[];
  improve: string;
}

/** Minimal activity shape passed to the AI for context. */
export interface GoalActivitySummary {
  type: ActivityType;
  date: string;
  /** km */
  distanceKm: number;
  /** minutes */
  movingMin: number;
  avgHr?: number;
}
