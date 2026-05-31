import { ANTHROPIC_MODEL, getAnthropic } from "./client";
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
  const ai = getAnthropic();
  if (!ai) return fallbackDebrief(metrics);
  try {
    const res = await ai.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      system: DEBRIEF_SYSTEM,
      messages: [{ role: "user", content: debriefUserMessage(metrics) }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    const parsed = parseDebrief(text);
    if (parsed) return parsed;
  } catch (err) {
    console.error("narrateDebrief failed", err);
  }
  return fallbackDebrief(metrics);
}

export async function narratePlan(
  metrics: ComputedMetrics,
  goal?: AthleteGoal | null,
): Promise<DeepNarration> {
  const ai = getAnthropic();
  if (!ai) return fallbackPlan(metrics, goal);
  try {
    const res = await ai.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: planUserMessage(metrics, goal) }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    const parsed = parsePlan(text);
    if (parsed) return parsed;
  } catch (err) {
    console.error("narratePlan failed", err);
  }
  return fallbackPlan(metrics, goal);
}
