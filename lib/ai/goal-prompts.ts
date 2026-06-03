import type {
  Goal,
  GoalActivitySummary,
  GoalReadiness,
  GoalTip,
  TipSentiment,
} from "@/lib/goals/types";

export const GOAL_TIP_SYSTEM = `You are AIthlete Coach. The athlete is training for a specific EVENT — a single session they want to be able to complete on a fixed date.

Your job: help them BUILD the capability for that event. The goal is NOT to accumulate volume; it is to be ready on event day.

Rules:
- Use ONLY numbers present in the input. Never invent a value.
- Distance events: long sessions should build toward 75–90% of the event distance before tapering 1–3 weeks out.
- Time events: longest session should approach 75% of the event duration before tapering.
- Respect the SENTIMENT label:
  - "ready": athlete is close to event-ready. Reinforce, talk taper, sharpen.
  - "building": training is progressing. Concrete next step in long-session length, frequency, or intensity.
  - "behind": signals are flat or below the curve. Specific, achievable progression. No fluff.
  - "at_risk": close to event with insufficient capability. Be direct — what must change THIS WEEK, or whether to consider downscaling the event target.
- The headline must cite a real number (longestRecent, weeksUntilEvent, readinessRatio, or a gap).
- actions are 1–3 concrete sessions to do in the next 7 days. Each one sentence. Reference real distances/times the athlete can hit.
- improve names ONE behavior to refine — long-session progression, mid-week frequency, intensity mix, recovery, fueling. One sentence.
- You are not a doctor; for pain/injury recommend a professional.

Respond with ONLY this JSON, no markdown, no code fences:
{
  "headline": string,
  "sentiment": "ready" | "building" | "behind" | "at_risk",
  "status": string,
  "actions": string[],
  "improve": string
}`;

export function goalTipUserMessage(
  goal: Goal,
  readiness: GoalReadiness,
  recent: GoalActivitySummary[],
  sentiment: TipSentiment,
): string {
  const payload = {
    event: {
      sport: goal.sport,
      metric: goal.metric,
      eventTarget: goal.eventTarget,
      eventDate: goal.eventDate,
      title: goal.title,
    },
    readiness: {
      longestRecent: readiness.longestRecent,
      eventTarget: readiness.eventTarget,
      readinessRatio: round2(readiness.readinessRatio),
      weeklyAvg: readiness.weeklyAvg,
      sessionsPerWeek: readiness.sessionsPerWeek,
      daysUntilEvent: readiness.daysUntilEvent,
      weeksUntilEvent: readiness.weeksUntilEvent,
      trendUp: readiness.trendUp,
    },
    sentiment,
    recentActivities: recent,
  };
  return `INPUT:\n${JSON.stringify(payload, null, 2)}\n\nWrite the training tip now.`;
}

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

export function parseGoalTip(text: string): GoalTip | null {
  try {
    const parsed = JSON.parse(stripFences(text));
    if (
      typeof parsed.headline === "string" &&
      ["ready", "building", "behind", "at_risk"].includes(parsed.sentiment) &&
      typeof parsed.status === "string" &&
      Array.isArray(parsed.actions) &&
      typeof parsed.improve === "string"
    ) {
      return {
        headline: parsed.headline.trim(),
        sentiment: parsed.sentiment,
        status: parsed.status.trim(),
        actions: parsed.actions.map(String).slice(0, 3),
        improve: parsed.improve.trim(),
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

export function fallbackTip(
  goal: Goal,
  readiness: GoalReadiness,
  sentiment: TipSentiment,
): GoalTip {
  const unit = goal.metric === "distance" ? "km" : "h";
  const gap = Math.max(0, goal.eventTarget - readiness.longestRecent);
  const longSessionTarget = round1(
    Math.min(goal.eventTarget * 0.9, readiness.longestRecent + Math.max(2, gap * 0.2)),
  );

  const headlineBySent: Record<TipSentiment, string> = {
    ready: `Event-ready · longest ${readiness.longestRecent} ${unit} of ${goal.eventTarget}, ${readiness.weeksUntilEvent}w out.`,
    building: `Building · longest ${readiness.longestRecent} ${unit} of ${goal.eventTarget}, ${readiness.weeksUntilEvent}w to go.`,
    behind: `Behind · longest ${readiness.longestRecent} ${unit} of ${goal.eventTarget}, ${readiness.weeksUntilEvent}w left.`,
    at_risk: `At risk · longest ${readiness.longestRecent} ${unit} of ${goal.eventTarget}, only ${readiness.weeksUntilEvent}w left.`,
  };

  const statusBySent: Record<TipSentiment, string> = {
    ready: `You're capable — longest session is ${Math.round(readiness.readinessRatio * 100)}% of the event. Time to taper, not stack more long days.`,
    building: `Training is ${readiness.trendUp ? "trending up" : "steady"} at ${readiness.weeklyAvg} ${unit}/wk across ${readiness.sessionsPerWeek} sessions. ${gap > 0 ? `Need to extend the long session by ~${round1(gap)} ${unit} before taper.` : ""}`,
    behind: `Longest session is only ${Math.round(readiness.readinessRatio * 100)}% of the event and volume isn't climbing. Time to commit to a clear progression.`,
    at_risk: `Less than a month out and capability is well below event distance. Either drop in two structured long sessions a week or consider a shorter event target.`,
  };

  const actionsBySent: Record<TipSentiment, string[]> = {
    ready: [
      `This week: one final long session at ~${round1(goal.eventTarget * 0.7)} ${unit}, easy effort.`,
      `Cut weekly volume by 25% next week — keep frequency, drop duration.`,
      `Race-week: short, sharp 20-min openers two days before. Sleep wins everything else.`,
    ],
    building: [
      `Long session this weekend: target ${longSessionTarget} ${unit} at conversational pace.`,
      `Add one mid-week session of ${round1(longSessionTarget * 0.5)} ${unit} to lock in the volume.`,
      `Hold weekly total to ${round1(readiness.weeklyAvg * 1.1)} ${unit} — small +10% steps, no surges.`,
    ],
    behind: [
      `This weekend: extend the long session to ${longSessionTarget} ${unit} — even at very easy pace.`,
      `Add one back-to-back day next week (long + short the next day) to simulate event fatigue.`,
      `Lock 3 sessions in your calendar before the week starts — frequency drives the curve.`,
    ],
    at_risk: [
      `Long session this weekend: stretch to ${round1(Math.min(goal.eventTarget * 0.6, readiness.longestRecent * 1.5))} ${unit}. No race-pace heroics.`,
      `Add one extra ride/run day next week even if short.`,
      `Talk yourself into a realistic event target if the gap doesn't close in 14 days.`,
    ],
  };

  const improveBySent: Record<TipSentiment, string> = {
    ready: `Discipline the taper — most blown events come from "one more big day" the week before.`,
    building: `Grow the long session before the weekly total — duration on one day teaches event-day fatigue better than spreading the same hours across more days.`,
    behind: `Frequency beats intensity right now — even three short sessions a week unlocks the body's tolerance for a longer Saturday.`,
    at_risk: `Pick TWO non-negotiable training days per week and defend them — the rest of your calendar bends around those.`,
  };

  return {
    headline: headlineBySent[sentiment],
    sentiment,
    status: statusBySent[sentiment].trim(),
    actions: actionsBySent[sentiment].slice(0, 3),
    improve: improveBySent[sentiment],
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
