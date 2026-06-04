import type {
  Goal,
  GoalActivitySummary,
  GoalTip,
  GoalTrainingStats,
  TipSentiment,
} from "@/lib/goals/types";

export const GOAL_TIP_SYSTEM = `You are AIthlete Coach. The athlete is training for a specific EVENT — a single session they want to be able to complete on a fixed date.

Your job: judge how their TRAINING — across every activity type they do — is moving them toward the event, then tell them what to do next.

Critical framing:
- Training transfer is real. Walking, running, cycling, strength, swimming, workouts — all of it can move the athlete toward the event. Do not treat off-sport activity as irrelevant.
- Do NOT filter activities by goal sport in your reasoning. Look at the whole training pattern: volume, frequency, recency, trend, diversity.
- You decide how to weight things. A goal-specific session counts more for specificity. Cross-training counts for base, recovery, and aerobic capacity.

Rules:
- Use ONLY numbers in the INPUT. Never invent a value.
- Return a "readinessPercent" (0–100) — YOUR holistic judgment of how event-ready the athlete is right now, given everything they've been doing and how much time remains.
- Anchor "readinessPercent" to "sentiment":
  - "ready" → 80–100 (close to event-ready, taper territory)
  - "building" → 40–80 (progressing in the right direction)
  - "behind" → 15–50 (training is too thin for the timeline)
  - "at_risk" → 0–25 (gap is large, event is close, must change now or downscale)
- Headline: ONE line that cites a real number from the INPUT (sessions per week, total hours, days remaining, or a specific recent activity).
- Status: 2 sentences naming what the athlete is actually doing (specifics like "you've logged 18 sessions across rides and runs in the last 60 days") and how that lines up with the event.
- Actions: 1–3 concrete sessions or behaviors to do THIS WEEK. Each one sentence, doable. They may mix sports — say so explicitly when cross-training matters.
- Improve: ONE behavior to refine — long-session progression, frequency, intensity, recovery, fueling, cross-training balance. One sentence.
- You are not a doctor; for pain/injury recommend a professional.

Respond with ONLY this JSON, no markdown, no code fences:
{
  "headline": string,
  "sentiment": "ready" | "building" | "behind" | "at_risk",
  "readinessPercent": number,
  "status": string,
  "actions": string[],
  "improve": string
}`;

export function goalTipUserMessage(
  goal: Goal,
  stats: GoalTrainingStats,
  recent: GoalActivitySummary[],
): string {
  const payload = {
    event: {
      sport: goal.sport,
      metric: goal.metric,
      eventTarget: goal.eventTarget,
      eventDate: goal.eventDate,
      title: goal.title,
    },
    training: {
      totalSessions: stats.totalSessions,
      sessionsPerWeek: stats.sessionsPerWeek,
      totalHours: stats.totalHours,
      weeklyHours: stats.weeklyHours,
      sportBreakdown: stats.sportBreakdown,
      daysUntilEvent: stats.daysUntilEvent,
      weeksUntilEvent: stats.weeksUntilEvent,
      trendUp: stats.trendUp,
    },
    recentActivities: recent,
  };
  return `INPUT:\n${JSON.stringify(payload, null, 2)}\n\nWrite the training tip now.`;
}

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

function clampPercent(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
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
        readinessPercent: clampPercent(parsed.readinessPercent),
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
  stats: GoalTrainingStats,
  sentiment: TipSentiment,
  readinessPercent: number,
): GoalTip {
  const unit = goal.metric === "distance" ? "km" : "h";
  const sportEntries = Object.entries(stats.sportBreakdown);
  const sportSummary = sportEntries
    .map(([t, n]) => `${n} ${t.toLowerCase()}`)
    .join(", ");

  const headlineBySent: Record<TipSentiment, string> = {
    ready: `${stats.totalSessions} sessions logged · ${stats.weeksUntilEvent}w to event.`,
    building: `${stats.sessionsPerWeek}/wk training · ${stats.weeksUntilEvent}w to ${goal.eventTarget}${unit}.`,
    behind: `Only ${stats.totalSessions} sessions in 60d · ${stats.weeksUntilEvent}w left.`,
    at_risk: `${stats.totalSessions} sessions in 60d · ${stats.weeksUntilEvent}w left — gap is real.`,
  };

  const statusBySent: Record<TipSentiment, string> = {
    ready: `Your training pattern (${sportSummary}) is event-ready. ${stats.weeklyHours} h/wk across ${stats.sessionsPerWeek} sessions/wk is enough — protect taper.`,
    building: `You've logged ${stats.totalSessions} sessions in 60 days (${sportSummary}) at ${stats.weeklyHours} h/wk. ${stats.trendUp ? "Trend is up — keep extending the long efforts." : "Plateaued — time to step volume up."}`,
    behind: `${stats.totalSessions} sessions in 60 days is thin for a ${goal.eventTarget}${unit} ${goal.sport} target. Need 3+ training days/wk in the build.`,
    at_risk: `${stats.weeksUntilEvent}w to go and only ${stats.weeklyHours} h/wk on average. Either commit to two extra sessions weekly or consider a softer event target.`,
  };

  const actionsBySent: Record<TipSentiment, string[]> = {
    ready: [
      "Lock one final long effort this week — race-pace is OK if you feel fresh.",
      "Cut total weekly hours by ~25% the week before the event. Keep frequency.",
      "Sleep, hydration, simple fueling. Boring wins the day.",
    ],
    building: [
      "This week: one long session at or above your current best for the goal sport.",
      "Add one cross-training day (walk, easy run, or strength) to bank aerobic time without raising injury risk.",
      "Hold weekly hours within 10% of last week — small, steady steps.",
    ],
    behind: [
      "Add one extra training day this week — anything aerobic counts.",
      "Schedule your long session on the calendar before the week starts. Defend it.",
      "Reduce intensity on at least one day if you've been over-pushing — frequency beats intensity now.",
    ],
    at_risk: [
      "Commit to TWO non-negotiable training days this week. Any sport, any duration above 30 min.",
      "Re-look at the event date or distance honestly — a softer target you'll actually nail beats a hard one you'll skip.",
      "Cross-training counts — a 60-min brisk walk is base. Get one in.",
    ],
  };

  const improveBySent: Record<TipSentiment, string> = {
    ready: "Discipline the taper — don't add a hero session because you feel good.",
    building: "Make the long session longer before adding more days. Duration teaches event-day fatigue.",
    behind: "Frequency first. Three short days beat one perfect long day.",
    at_risk: "Pick two days this week and protect them like meetings. Everything else bends around them.",
  };

  return {
    headline: headlineBySent[sentiment],
    sentiment,
    readinessPercent,
    status: statusBySent[sentiment].trim(),
    actions: actionsBySent[sentiment].slice(0, 3),
    improve: improveBySent[sentiment],
  };
}
