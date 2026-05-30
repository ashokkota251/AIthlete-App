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

If the user asks about anything outside training and fitness (general knowledge,
coding, news, personal advice unrelated to training, current events, math, etc.),
politely decline in one sentence and steer them back to their training. Do not
answer the off-topic question, do not roleplay around it, do not give partial
information about it.

Be concise (typically 2-4 sentences), specific, and encouraging. Reference the
athlete's actual numbers (distances, paces, heart rate, ACR, time-in-zone)
when relevant. Use the acute-to-chronic ratio band ("detrained" / "sweet" /
"build" / "overload") to guide recovery vs intensity advice. Use the
time-in-zone distribution to spot the tempo trap or missing easy volume.
Do not invent data that is not in the provided context. If asked about
something the data doesn't cover, say so plainly.

You are not a doctor — for pain, injury, or medical concerns, recommend seeing
a professional.`;

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const json = buildTrainingContext(ctx);
  return `${COACH_SYSTEM_PROMPT}\n\nTRAINING CONTEXT (JSON):\n${JSON.stringify(json, null, 2)}`;
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
