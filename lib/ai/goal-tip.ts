import { chat, hasAI } from "./client";
import {
  GOAL_TIP_SYSTEM,
  fallbackTip,
  goalTipUserMessage,
  parseGoalTip,
} from "./goal-prompts";
import {
  computeGoalReadiness,
  computeSentiment,
  summariseForAI,
} from "@/lib/goals/progress";
import type { Goal, GoalReadiness, GoalTip } from "@/lib/goals/types";
import type { Activity } from "@/lib/strava/types";

export interface GoalTipResult {
  tip: GoalTip;
  readiness: GoalReadiness;
  fallback?: boolean;
}

export async function generateGoalTip(
  goal: Goal,
  activities: Activity[],
): Promise<GoalTipResult> {
  const readiness = computeGoalReadiness(goal, activities);
  const sentiment = computeSentiment(readiness);
  const recent = summariseForAI(activities, 10);

  if (!hasAI()) {
    return { tip: fallbackTip(goal, readiness, sentiment), readiness, fallback: true };
  }

  const text = await chat({
    system: GOAL_TIP_SYSTEM,
    messages: [{ role: "user", content: goalTipUserMessage(goal, readiness, recent, sentiment) }],
    maxTokens: 600,
    format: "json",
  });

  if (text) {
    const parsed = parseGoalTip(text);
    if (parsed) {
      // Force deterministic sentiment so the AI can't contradict the math.
      return { tip: { ...parsed, sentiment }, readiness };
    }
  }
  return { tip: fallbackTip(goal, readiness, sentiment), readiness, fallback: true };
}
