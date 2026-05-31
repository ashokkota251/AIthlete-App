import { chat, hasAI } from "./client";
import {
  DEBRIEF_SYSTEM,
  PLAN_SYSTEM,
  type AthleteGoal,
  debriefUserMessage,
  fallbackDebrief,
  fallbackPlan,
  parseDebrief,
  parsePlan,
  planUserMessage,
} from "./debrief-prompts";
import type {
  ComputedMetrics,
  DebriefNarration,
  DeepNarration,
} from "@/lib/metrics/types";

export async function narrateDebrief(
  metrics: ComputedMetrics,
): Promise<DebriefNarration> {
  if (!hasAI()) return fallbackDebrief(metrics);
  const text = await chat({
    system: DEBRIEF_SYSTEM,
    messages: [{ role: "user", content: debriefUserMessage(metrics) }],
    maxTokens: 700,
  });
  if (text) {
    const parsed = parseDebrief(text);
    if (parsed) return parsed;
  }
  return fallbackDebrief(metrics);
}

export async function narratePlan(
  metrics: ComputedMetrics,
  goal?: AthleteGoal | null,
): Promise<DeepNarration> {
  if (!hasAI()) return fallbackPlan(metrics, goal);
  const text = await chat({
    system: PLAN_SYSTEM,
    messages: [{ role: "user", content: planUserMessage(metrics, goal) }],
    maxTokens: 700,
  });
  if (text) {
    const parsed = parsePlan(text);
    if (parsed) return parsed;
  }
  return fallbackPlan(metrics, goal);
}
