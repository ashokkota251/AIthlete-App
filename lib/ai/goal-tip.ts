import { chat, hasAI } from "./client";
import {
  GOAL_TIP_SYSTEM,
  fallbackTip,
  goalTipUserMessage,
  parseGoalTip,
} from "./goal-prompts";
import {
  computeTrainingStats,
  fallbackReadinessPercent,
  fallbackSentiment,
  summariseForAI,
} from "@/lib/goals/progress";
import type { Goal, GoalTip, GoalTrainingStats } from "@/lib/goals/types";
import type { Activity } from "@/lib/strava/types";

export interface GoalTipResult {
  tip: GoalTip;
  stats: GoalTrainingStats;
  fallback?: boolean;
}

export async function generateGoalTip(
  goal: Goal,
  activities: Activity[],
): Promise<GoalTipResult> {
  const stats = computeTrainingStats(goal, activities);
  const recent = summariseForAI(activities, 10);
  const fbSentiment = fallbackSentiment(stats);
  const fbPercent = fallbackReadinessPercent(stats);

  if (!hasAI()) {
    return {
      tip: fallbackTip(goal, stats, fbSentiment, fbPercent),
      stats,
      fallback: true,
    };
  }

  const text = await chat({
    system: GOAL_TIP_SYSTEM,
    messages: [{ role: "user", content: goalTipUserMessage(goal, stats, recent) }],
    maxTokens: 600,
    format: "json",
  });

  if (text) {
    const parsed = parseGoalTip(text);
    if (parsed) {
      // Clamp readinessPercent to its sentiment band — guards against an AI
      // that produces a wildly inconsistent number (e.g. sentiment "at_risk"
      // with readinessPercent 90).
      const clamped = clampToSentimentBand(parsed.readinessPercent, parsed.sentiment);
      return { tip: { ...parsed, readinessPercent: clamped }, stats };
    }
  }
  return {
    tip: fallbackTip(goal, stats, fbSentiment, fbPercent),
    stats,
    fallback: true,
  };
}

function clampToSentimentBand(
  percent: number,
  sentiment: GoalTip["sentiment"],
): number {
  const bands: Record<GoalTip["sentiment"], [number, number]> = {
    ready: [80, 100],
    building: [40, 80],
    behind: [15, 50],
    at_risk: [0, 25],
  };
  const [lo, hi] = bands[sentiment];
  return Math.max(lo, Math.min(hi, percent));
}
