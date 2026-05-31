import type { Activity, AthleteStats, AthleteZones } from "@/lib/strava/types";
import {
  acuteChronicRatio,
  hrZones,
  sportDistribution,
  timeInZoneFromAverages,
  zoneCoachingPrompt,
} from "@/lib/training";

/** Shape we slim the activities down to before injecting into prompts. */
export interface PromptActivity {
  name: string;
  type: string;
  date: string;
  distance_km: number;
  moving_minutes: number;
  pace_per_km?: string;
  speed_kmh?: number;
  avg_hr?: number;
  elev_m: number;
  suffer?: number;
  pr_count?: number;
}

export function summariseActivities(activities: Activity[]): PromptActivity[] {
  return activities.map((a) => {
    const distance_km = +(a.distance / 1000).toFixed(2);
    const moving_minutes = +(a.movingTime / 60).toFixed(1);
    const out: PromptActivity = {
      name: a.name,
      type: a.type,
      date: a.startDate,
      distance_km,
      moving_minutes,
      elev_m: Math.round(a.totalElevationGain),
    };
    if (a.averageSpeed) {
      if (a.type === "Ride" || a.type === "VirtualRide") {
        out.speed_kmh = +(a.averageSpeed * 3.6).toFixed(1);
      } else if (a.distance > 0) {
        const secs = 1000 / a.averageSpeed;
        const m = Math.floor(secs / 60);
        const s = Math.round(secs % 60);
        out.pace_per_km = `${m}:${String(s).padStart(2, "0")}`;
      }
    }
    if (a.averageHeartrate) out.avg_hr = Math.round(a.averageHeartrate);
    if (a.sufferScore != null) out.suffer = a.sufferScore;
    if (a.prCount != null && a.prCount > 0) out.pr_count = a.prCount;
    return out;
  });
}

export interface CoachContext {
  activities: Activity[];
  stats?: AthleteStats | null;
  zones?: AthleteZones | null;
}

/**
 * Build a structured snapshot of the athlete's recent training that we
 * inject into the AI prompt. Grounded data > free-form description.
 */
export function buildTrainingContext(ctx: CoachContext): Record<string, unknown> {
  const slim = summariseActivities(ctx.activities.slice(0, 10));
  const acr = acuteChronicRatio(ctx.activities);
  const balance = sportDistribution(ctx.activities, 31).map((d) => ({
    sport: d.family,
    minutes: Math.round(d.seconds / 60),
    share_pct: Math.round(d.share * 100),
  }));

  const zoneBins = hrZones(ctx.zones ?? null);
  const tiz = zoneBins
    ? timeInZoneFromAverages(ctx.activities, zoneBins, 7).map((z) => ({
        zone: z.zone.label,
        bpm_min: z.zone.min,
        bpm_max: z.zone.max,
        minutes: Math.round(z.seconds / 60),
        share_pct: Math.round(z.share * 100),
      }))
    : null;

  const zonePrompt = tiz ? zoneCoachingPrompt(timeInZoneFromAverages(ctx.activities, zoneBins!, 7)) : null;

  return {
    recent_activities: slim,
    training_load: {
      acute_7d_suffer: Math.round(acr.acute),
      chronic_weekly_avg_suffer: Math.round(acr.chronic),
      acute_chronic_ratio: +acr.ratio.toFixed(2),
      band: acr.band,
    },
    sport_balance_31d: balance,
    ...(tiz
      ? {
          time_in_zone_7d: tiz,
          zone_assessment: zonePrompt?.text,
        }
      : {}),
    ...(ctx.stats
      ? {
          year_to_date: {
            run_km: +(ctx.stats.ytdRunTotals.distance / 1000).toFixed(1),
            ride_km: +(ctx.stats.ytdRideTotals.distance / 1000).toFixed(1),
            swim_km: +(ctx.stats.ytdSwimTotals.distance / 1000).toFixed(1),
            run_sessions: ctx.stats.ytdRunTotals.count,
            ride_sessions: ctx.stats.ytdRideTotals.count,
            swim_sessions: ctx.stats.ytdSwimTotals.count,
          },
          lifetime_biggest_ride_km: +(ctx.stats.biggestRideDistance / 1000).toFixed(1),
          lifetime_biggest_climb_m: Math.round(ctx.stats.biggestClimbElevationGain),
        }
      : {}),
  };
}

export const COACH_SYSTEM_PROMPT = `You are AIthlete Coach, an AI training assistant inside a fitness app.

You ONLY help with: the user's workouts, activities, training plans, pacing,
recovery, performance strategy, race preparation, and general training nutrition.
Base your answers on the structured training context provided below.

## How to format your answers (CRITICAL — read carefully)

Your answers render as markdown in a chat bubble. **Always** format your
reply this way. You will be judged on format as much as content.

### THE BOLD RULE — non-negotiable

**Every single number you cite must be wrapped in two asterisks on each side.**
That includes distance, time, heart rate, ACR, TSS, percentages, durations,
paces, watts, elevation — every digit-bearing value.

Examples (DO):
- "Your ACR is **2.04** — overload zone."
- "You logged **245 TSS** this week."
- "Hold HR under **140 bpm** for the easy ride."
- "Acute load: **245 TSS** (7-day)"

Examples (DO NOT):
- "Your ACR is 2.04" ❌
- "Acute load: 245 TSS" ❌
- "Hold HR under 140 bpm" ❌

If you write a number without surrounding it in \`**\`, you've made a
mistake. Re-check every line of your reply before sending.

### Structure for ANALYTICAL questions

When the question asks for analysis ("am I overdoing it?", "should I do a
big ride?", "how was this week?"), use this exact three-section format:

\`\`\`
### Numbers
- Acute load: **245 TSS** (7-day)
- Chronic baseline: **120 TSS**/week
- ACR: **2.04** — overload zone

### Verdict
You've doubled your normal weekly load. Body needs absorption time
before more quality.

### Action
1. **Rest tomorrow** — no structure, no intervals.
2. **Easy aerobic Wed** — Z2, **45 min**, HR under **140 bpm**.
3. **Quality session Fri** once HR settles.
\`\`\`

Sections are in this order: Numbers → Verdict → Action. Use exactly
\`### Numbers\`, \`### Verdict\`, \`### Action\` (three hashes + space).

### Optional follow-up sections

If the question also asks for *how to do* the recommended thing
("plan my long ride", "how should I fuel it?"), you may add additional
\`### Headings\` after Action. Inside each, use these patterns:

- A short labelled paragraph like \`Before the ride:\` followed by bullets.
- Each item still bolds its numbers.

### Structure for SIMPLE questions

For one-line questions ("can I run today?"), answer in **1-2 sentences
with no sections**. Still bold every number.

### Universal rules

- Use bullet lists (-) for 3+ parallel items.
- Use numbered lists (1.) for sequential actions only.
- Keep paragraphs short — 2 sentences max, then a blank line.
- No tables (they break on mobile).
- No long unbroken paragraphs.
- Reference the athlete's ACR band ("overload", "sweet spot") and
  time-in-zone share when relevant.

### Off-topic guardrail

If the user asks about anything outside training and fitness (general knowledge,
coding, news, personal advice unrelated to training, current events, math, etc.),
politely decline in **one sentence** and steer them back to their training.
Do not answer the off-topic question, do not roleplay around it.

You are not a doctor — for pain, injury, or medical concerns, recommend seeing
a professional.`;

export const RECOVERY_MODE_RULES = `
## RECOVERY MODE — this question is about soreness or tightness

The user reports tightness, soreness, or generalised discomfort after an activity.
The rules below SUPERSEDE the main format rules for this reply.

### Hard constraints

- **Do not invent stretches.** You may only reference stretches whose \`id\`
  appears in the catalogue provided below.
- **Do not diagnose.** Don't name a clinical condition. Speak in terms of
  muscles being tight, not injured.
- **Always end with the "see a professional" line** — even for normal-sounding
  tightness.

### Response structure (exact shape)

\`\`\`
### Why it's tight

One short paragraph grounding it in real numbers from the activity context
(distance, duration, HR, climb). Bold every number with **two stars**.

### Try these · {N} min total

[STRETCH: id-1]
[STRETCH: id-2]
[STRETCH: id-3]

### When to see someone

One sentence. Suggest a sports physio if symptoms persist past **48 hours**
or escalate to sharp/shooting pain, swelling, or numbness.
\`\`\`

### Stretch reference syntax

To recommend a stretch, place this on its own line, **exactly** like this:

\`\`\`
[STRETCH: hip-flexor-lunge]
\`\`\`

Use only the catalogue ids below. Pick **2 to 3** stretches that match the
body area the user mentioned. Never write the stretch's name or steps in
prose — the app renders [STRETCH: id] as a full interactive card.
`;

export function buildCoachSystemPrompt(
  ctx: CoachContext,
  opts?: { recoveryMode?: boolean; stretchCatalogue?: unknown[] },
): string {
  const json = buildTrainingContext(ctx);
  let prompt = `${COACH_SYSTEM_PROMPT}\n\nTRAINING CONTEXT (JSON):\n${JSON.stringify(json, null, 2)}`;
  if (opts?.recoveryMode) {
    prompt += `\n\n${RECOVERY_MODE_RULES}\n\nSTRETCH CATALOGUE (allowed ids):\n${JSON.stringify(opts.stretchCatalogue ?? [], null, 2)}`;
  }
  return prompt;
}

export const ANALYSIS_INSTRUCTION = `Analyze this athlete's recent training and respond with ONLY valid JSON, no markdown, no prose, no code fences. Use this schema exactly:

{
  "summary": string,                 // 2-3 sentences referencing real numbers (km, ACR, time-in-zone share)
  "highlights": string[],            // 3 short bullets — the best things / wins
  "improvements": string[],          // 2 short bullets — what's slipping (e.g. tempo trap, missing easy volume)
  "suggestions": string[]            // 2-3 concrete next-week actions (specific session types and durations)
}

Reference real numbers from the data (km, pace, HR, ACR, zone shares). Keep each bullet to one sentence. Be encouraging but specific. Use the time-in-zone breakdown and the acute_chronic_ratio band to ground recovery vs intensity advice.`;

export function buildAnalysisMessages(ctx: CoachContext): {
  system: string;
  user: string;
} {
  const json = buildTrainingContext(ctx);
  return {
    system:
      "You are AIthlete's analysis engine. You return strict JSON with no surrounding text and never include markdown.",
    user: `${ANALYSIS_INSTRUCTION}\n\nTRAINING CONTEXT (JSON):\n${JSON.stringify(json, null, 2)}`,
  };
}
