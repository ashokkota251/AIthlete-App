import type { Activity, ActivityType, AthleteZones } from "@/lib/strava/types";

/** Family classification used across dashboard charts. */
export type SportFamily = "run" | "ride" | "swim" | "strength" | "other";

const FAMILY_MAP: Record<ActivityType, SportFamily> = {
  Run: "run",
  Walk: "run",
  Hike: "run",
  Ride: "ride",
  VirtualRide: "ride",
  Swim: "swim",
  Workout: "strength",
  WeightTraining: "strength",
};

export function sportFamily(type: ActivityType): SportFamily {
  return FAMILY_MAP[type] ?? "other";
}

export const SPORT_COLORS: Record<SportFamily, string> = {
  run: "#F2541B",     // primary coral
  ride: "#FF8A4D",    // light coral
  swim: "#1F2233",    // ink (cool counterpoint to coral)
  strength: "#B23006",// deep coral
  other: "#A6A8B4",   // ink-300
};

export const SPORT_LABELS: Record<SportFamily, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
  strength: "Strength",
  other: "Other",
};

/* --------------------------------- weekly --------------------------------- */

/** Sum moving time per sport family for activities in the last N days. */
export function sportDistribution(
  activities: Activity[],
  days: number = 31,
  now: Date = new Date(),
): { family: SportFamily; seconds: number; share: number }[] {
  const cutoff = now.getTime() - days * 24 * 3600 * 1000;
  const buckets: Record<SportFamily, number> = {
    run: 0,
    ride: 0,
    swim: 0,
    strength: 0,
    other: 0,
  };
  for (const a of activities) {
    if (new Date(a.startDate).getTime() < cutoff) continue;
    buckets[sportFamily(a.type)] += a.movingTime;
  }
  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  return (Object.keys(buckets) as SportFamily[])
    .filter((f) => buckets[f] > 0)
    .map((family) => ({
      family,
      seconds: buckets[family],
      share: total > 0 ? buckets[family] / total : 0,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

/* ----------------------------- training load ----------------------------- */

export interface WeeklyLoad {
  /** week ending date (ISO) */
  weekEnd: string;
  /** sum of suffer scores in this week */
  load: number;
  /** total moving seconds in this week */
  seconds: number;
}

/** Group activities into 8 rolling weekly buckets ending at `now`. */
export function weeklyLoad(
  activities: Activity[],
  weeks: number = 8,
  now: Date = new Date(),
): WeeklyLoad[] {
  const buckets: WeeklyLoad[] = [];
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  // Monday-start week
  const dow = (now.getDay() + 6) % 7;
  startOfThisWeek.setDate(now.getDate() - dow);

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(startOfThisWeek);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    let load = 0;
    let seconds = 0;
    for (const a of activities) {
      const t = new Date(a.startDate).getTime();
      if (t >= start.getTime() && t < end.getTime()) {
        load += a.sufferScore ?? estimateSufferScore(a);
        seconds += a.movingTime;
      }
    }
    buckets.push({ weekEnd: end.toISOString(), load, seconds });
  }
  return buckets;
}

/**
 * Acute (last 7d) / Chronic (last 28d avg) ratio.
 * Returns 0 if no chronic load.
 *
 * Sweet spot: 0.8 ≤ ACR ≤ 1.3
 * Overload risk: > 1.5
 * Detrained: < 0.8
 */
export function acuteChronicRatio(
  activities: Activity[],
  now: Date = new Date(),
): { ratio: number; acute: number; chronic: number; band: "detrained" | "sweet" | "build" | "overload" } {
  const ms = (d: number) => d * 24 * 3600 * 1000;
  let acute = 0;
  let chronic = 0;
  for (const a of activities) {
    const t = new Date(a.startDate).getTime();
    const age = now.getTime() - t;
    const load = a.sufferScore ?? estimateSufferScore(a);
    if (age >= 0 && age < ms(7)) acute += load;
    if (age >= 0 && age < ms(28)) chronic += load;
  }
  const chronicWeekly = chronic / 4;
  const ratio = chronicWeekly > 0 ? acute / chronicWeekly : 0;
  let band: "detrained" | "sweet" | "build" | "overload";
  if (ratio === 0 || ratio < 0.8) band = "detrained";
  else if (ratio <= 1.3) band = "sweet";
  else if (ratio <= 1.5) band = "build";
  else band = "overload";
  return { ratio, acute, chronic: chronicWeekly, band };
}

/** Strava's suffer_score isn't always present; estimate a proxy. */
function estimateSufferScore(a: Activity): number {
  // crude: minutes of moving time scaled by relative intensity (HR/180)
  const mins = a.movingTime / 60;
  if (a.averageHeartrate) {
    const intensityFactor = Math.min(1.4, a.averageHeartrate / 150);
    return Math.round(mins * intensityFactor * 0.6);
  }
  // duration-only fallback
  return Math.round(mins * 0.4);
}

/* -------------------------------- HR zones -------------------------------- */

/** Build 5-zone HR bins from the athlete's zones (Strava's heart_rate.zones array). */
export interface HrZoneBin {
  index: number;
  min: number;
  max: number;
  label: string;
  description: string;
}

const ZONE_LABELS = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
const ZONE_DESCRIPTIONS = [
  "Recovery",
  "Aerobic",
  "Tempo",
  "Threshold",
  "VO2 max",
] as const;

export function hrZones(zones: AthleteZones | null | undefined): HrZoneBin[] | null {
  const hr = zones?.heartRate;
  if (!hr?.zones || hr.zones.length === 0) return null;
  // Strava returns 5 zones in order Z1..Z5.
  return hr.zones.slice(0, 5).map((z, i) => ({
    index: i,
    min: z.min,
    max: z.max <= 0 ? 220 : z.max, // -1 means open-ended
    label: ZONE_LABELS[i] ?? `Z${i + 1}`,
    description: ZONE_DESCRIPTIONS[i] ?? "",
  }));
}

/**
 * Estimate weekly time-in-zone using each activity's AVERAGE heartrate.
 * Approximation: a single activity contributes all its moving time to the
 * single zone that contains its avg HR. Less granular than a stream-based
 * calculation but uses no extra API quota.
 */
export function timeInZoneFromAverages(
  activities: Activity[],
  bins: HrZoneBin[],
  days: number = 7,
  now: Date = new Date(),
): { zone: HrZoneBin; seconds: number; share: number }[] {
  const cutoff = now.getTime() - days * 24 * 3600 * 1000;
  const out = bins.map((b) => ({ zone: b, seconds: 0, share: 0 }));
  let total = 0;
  for (const a of activities) {
    if (new Date(a.startDate).getTime() < cutoff) continue;
    if (!a.averageHeartrate || a.movingTime <= 0) continue;
    const z = bins.find((b) => a.averageHeartrate! >= b.min && a.averageHeartrate! <= b.max);
    if (!z) continue;
    out[z.index].seconds += a.movingTime;
    total += a.movingTime;
  }
  if (total > 0) {
    for (const item of out) item.share = item.seconds / total;
  }
  return out;
}

/** Generate a coaching prompt for a time-in-zone distribution. */
export function zoneCoachingPrompt(
  dist: { zone: HrZoneBin; seconds: number; share: number }[],
): { tone: "ok" | "warn" | "info"; text: string } | null {
  const total = dist.reduce((s, d) => s + d.seconds, 0);
  if (total < 60 * 30) {
    return { tone: "info", text: "Not enough HR data yet — log a couple more runs with a chest strap to unlock coaching." };
  }
  const easy = (dist[0]?.share ?? 0) + (dist[1]?.share ?? 0);
  const tempo = dist[2]?.share ?? 0;
  const hard = (dist[3]?.share ?? 0) + (dist[4]?.share ?? 0);

  if (tempo > 0.4) {
    return {
      tone: "warn",
      text: "Tempo trap — over 40% of your week sits in Z3. Replace one tempo with a true easy run and one with a short hard interval block.",
    };
  }
  if (easy < 0.45) {
    return {
      tone: "warn",
      text: "Aerobic deficit — less than 45% of training is easy. Add a slow Z1–Z2 session at conversational pace.",
    };
  }
  if (hard < 0.05 && total > 60 * 60 * 3) {
    return {
      tone: "info",
      text: "No quality work in 7 days. Add one Z4–Z5 session (intervals or threshold) to keep fitness sharp.",
    };
  }
  return { tone: "ok", text: "Healthy distribution — mostly aerobic with a sharp quality day. Keep this rhythm." };
}
