import type { ComputedMetrics, DebriefNarration, DeepNarration } from "@/lib/metrics/types";

/* ───────────────────── DEBRIEF (verdict-first) ─────────────────────────── */

export const DEBRIEF_SYSTEM = `You are AIthlete Coach. You phrase numbers — you do not invent or recompute them.
You will receive COMPUTED metrics for one workout as strict JSON.

Rules:
- Use ONLY numbers present in the JSON. Never invent or recompute a value.
- wentWell and toWatch must each reference a specific number from the JSON.
- Be specific, encouraging, concise. One clear nextAction.
- You are not a doctor; for pain/injury recommend a professional.

Respond with ONLY this JSON, no markdown, no code fences:
{
  "verdict": string,
  "sentiment": "nailed_it" | "solid" | "off_target" | "red_flag",
  "wentWell": string[],
  "toWatch": string[],
  "loadImpact": string,
  "nextAction": string
}`;

export function debriefUserMessage(metrics: ComputedMetrics): string {
  return `COMPUTED METRICS:\n${JSON.stringify(metrics, null, 2)}\n\nWrite the debrief now.`;
}

/* ───────────────────── DEEP DIVE — rest + next ride ────────────────────── */

export const PLAN_SYSTEM = `You are AIthlete Coach. You phrase numbers — you do not invent or recompute them.
You will receive COMPUTED metrics + an optional athlete goal as strict JSON.

Rules:
- Use ONLY numbers present in the input. Never invent or recompute a value.
- recoveryHours, freshByISO, readiness are already computed — phrase them, do not change them.
- The next ride must respect current fatigue: if tsb is very negative or band is "overload",
  do NOT prescribe a hard session. Prefer Z1-Z2 or rest.
- If a race date / limiter is provided, bias the next ride toward addressing the limiter.
- You are not a doctor; for pain/injury recommend a professional.

Respond with ONLY this JSON, no markdown, no code fences:
{
  "restActions": string[],
  "nextRide": {
    "title": string,
    "when": string,
    "durationMin": number,
    "intensity": string,
    "targetHr": string,
    "why": string
  }
}`;

export interface AthleteGoal {
  race?: string;
  raceDate?: string; // YYYY-MM-DD
  limiter?: string;
}

export function planUserMessage(
  metrics: ComputedMetrics,
  goal?: AthleteGoal | null,
): string {
  return `COMPUTED METRICS:\n${JSON.stringify(metrics, null, 2)}\n\nATHLETE GOAL:\n${JSON.stringify(goal ?? {}, null, 2)}\n\nWrite the plan now.`;
}

/* ───────────────────────── defensive parsing ──────────────────────────── */

function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

export function parseDebrief(text: string): DebriefNarration | null {
  try {
    const parsed = JSON.parse(stripFences(text));
    if (
      typeof parsed.verdict === "string" &&
      ["nailed_it", "solid", "off_target", "red_flag"].includes(parsed.sentiment) &&
      Array.isArray(parsed.wentWell) &&
      Array.isArray(parsed.toWatch) &&
      typeof parsed.loadImpact === "string" &&
      typeof parsed.nextAction === "string"
    ) {
      return {
        verdict: parsed.verdict.trim(),
        sentiment: parsed.sentiment,
        wentWell: parsed.wentWell.map(String).slice(0, 4),
        toWatch: parsed.toWatch.map(String).slice(0, 3),
        loadImpact: parsed.loadImpact.trim(),
        nextAction: parsed.nextAction.trim(),
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

export function parsePlan(text: string): DeepNarration | null {
  try {
    const parsed = JSON.parse(stripFences(text));
    if (
      Array.isArray(parsed.restActions) &&
      parsed.nextRide &&
      typeof parsed.nextRide.title === "string" &&
      typeof parsed.nextRide.when === "string" &&
      Number.isFinite(parsed.nextRide.durationMin) &&
      typeof parsed.nextRide.intensity === "string" &&
      typeof parsed.nextRide.targetHr === "string" &&
      typeof parsed.nextRide.why === "string"
    ) {
      return {
        restActions: parsed.restActions.map(String).slice(0, 5),
        nextRide: {
          title: parsed.nextRide.title.trim(),
          when: parsed.nextRide.when.trim(),
          durationMin: Math.round(parsed.nextRide.durationMin),
          intensity: parsed.nextRide.intensity.trim(),
          targetHr: parsed.nextRide.targetHr.trim(),
          why: parsed.nextRide.why.trim(),
        },
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/* ───────────────────────── deterministic fallbacks ─────────────────────── */

const SESSION_VERDICT: Record<ComputedMetrics["sessionType"], string> = {
  recovery: "Recovery session · easy day done right",
  endurance: "Endurance ride · steady aerobic work",
  tempo: "Tempo session · executed well",
  threshold: "Threshold work · sharp effort",
  intervals: "Intervals · quality day",
  long: "Long ride · time in the saddle",
  race: "Race effort · big day",
};

export function fallbackDebrief(m: ComputedMetrics): DebriefNarration {
  const ride = (m.normalizedPower ?? 0) > 0;
  const wentWell: string[] = [];
  const toWatch: string[] = [];

  if (m.negativeSplit && m.splits.length >= 2) {
    const first = m.splits[0].speedKmh;
    const last = m.splits[m.splits.length - 1].speedKmh;
    wentWell.push(
      `Negative split — final segment was ${(last - first).toFixed(1)} km/h faster than the first.`,
    );
  }
  if (m.cardiacDriftPct != null && Math.abs(m.cardiacDriftPct) < 5) {
    wentWell.push(`Cardiac drift only ${m.cardiacDriftPct.toFixed(1)}% — aerobic control held.`);
  }
  if (m.variabilityIndex != null && m.variabilityIndex < 1.06 && ride) {
    wentWell.push(`Variability ${m.variabilityIndex.toFixed(2)} — steady power, no surges.`);
  }
  if (m.intensityFactor != null && m.intensityFactor >= 0.75 && m.intensityFactor <= 0.95) {
    wentWell.push(`IF ${m.intensityFactor.toFixed(2)} — held the target zone cleanly.`);
  }
  if (m.recoveryHr1min != null && m.recoveryHr1min >= 25) {
    wentWell.push(`Heart-rate dropped ${m.recoveryHr1min} bpm in the first minute — sharp recovery.`);
  }
  while (wentWell.length < 2) {
    wentWell.push(`Logged ${m.distanceKm.toFixed(1)} km / ${Math.round(m.movingSec / 60)} min — consistency wins.`);
  }

  if (m.cardiacDriftPct != null && m.cardiacDriftPct > 7) {
    toWatch.push(
      `Cardiac drift hit ${m.cardiacDriftPct.toFixed(1)}% — fuelling or pacing slipped late.`,
    );
  }
  if (m.intensityFactor != null && m.intensityFactor > 1.0) {
    toWatch.push(`IF ${m.intensityFactor.toFixed(2)} — above threshold, pushed into red.`);
  }
  if (m.tss > 110) {
    toWatch.push(`TSS ${m.tss} — this is a high-impact day. Earn the recovery.`);
  }
  if (toWatch.length === 0) {
    toWatch.push("Watch the cumulative load — a flat week now beats a fragile next week.");
  }

  const sentiment: DebriefNarration["sentiment"] =
    m.tss > 130 ? "red_flag" : wentWell.length >= 3 ? "nailed_it" : toWatch.length > 1 ? "off_target" : "solid";

  return {
    verdict: SESSION_VERDICT[m.sessionType],
    sentiment,
    wentWell: wentWell.slice(0, 3),
    toWatch: toWatch.slice(0, 2),
    loadImpact: `Added ${m.tss} TSS · readiness now ${m.readiness}.`,
    nextAction:
      m.readiness === "low"
        ? "Recovery day tomorrow — Z1 spin or full rest."
        : m.readiness === "high"
          ? "You can absorb another quality session within 48 hours."
          : "One easy day, then build back to your next quality session.",
  };
}

export function fallbackPlan(m: ComputedMetrics, _goal?: AthleteGoal | null): DeepNarration {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const tomorrowName = tomorrow.toLocaleDateString("en-US", { weekday: "long" });
  const easy = m.readiness === "low" || (m.tsb != null && m.tsb < -10);

  return {
    restActions: [
      `Sleep 8h+ tonight — the body rebuilds on the night after the work.`,
      easy
        ? `Keep tomorrow off or Zone 1 only. No structure.`
        : `Keep tomorrow easy — Zone 1–2 aerobic only.`,
      `Protein ~1.6 g/kg across the day; stay on top of fluids.`,
    ],
    nextRide: easy
      ? {
          title: "Active recovery",
          when: `${tomorrowName} · once you're feeling clear`,
          durationMin: 40,
          intensity: "Zone 1",
          targetHr: "< 130",
          why: `TSB is in deficit — flush the legs, do not add load. Quality returns in 48–72h.`,
        }
      : {
          title: "Long endurance ride",
          when: "Monday · once you're recovered",
          durationMin: 90,
          intensity: "Zone 2",
          targetHr: "130–145",
          why: `Cleanest move while ${m.readiness} readiness — build aerobic capacity without pulling from your remaining glycogen.`,
        },
  };
}
