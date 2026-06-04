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
 * Deterministic snapshot of recent training — computed before the AI sees it.
 * Lookback window = last 60 days. Does NOT filter by goal sport: the user's
 * full training picture (cycling + running + walking + workouts + everything)
 * is what informs readiness. The AI judges how it adds up.
 */
export interface GoalTrainingStats {
  goalId: string;
  metric: GoalMetric;
  eventTarget: number;
  /** Total sessions across all sports in the window. */
  totalSessions: number;
  /** Sessions per week across all sports. */
  sessionsPerWeek: number;
  /** Total active hours across all sports in the window. */
  totalHours: number;
  /** Average hours per week across all sports. */
  weeklyHours: number;
  /** Map of sport family → session count in the window. */
  sportBreakdown: Partial<Record<ActivityType, number>>;
  daysUntilEvent: number;
  weeksUntilEvent: number;
  /** True when the last 14 days' total hours exceed the prior 14. */
  trendUp: boolean;
  /** True when eventDate <= today. */
  eventPast: boolean;
}

export type TipSentiment = "ready" | "building" | "behind" | "at_risk";

export interface GoalTip {
  headline: string;
  sentiment: TipSentiment;
  /** AI's holistic judgment of readiness, 0–100. */
  readinessPercent: number;
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
