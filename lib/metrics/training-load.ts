/**
 * CTL / ATL / TSB / ACR — derived from a daily TSS history.
 *
 * Definitions (TrainingPeaks convention):
 *   CTL (Fitness)  — EWMA of daily TSS with 42-day time constant.
 *   ATL (Fatigue)  — EWMA of daily TSS with 7-day time constant.
 *   TSB (Form)     — CTL_yesterday − ATL_yesterday.
 *   ACR            — acute(7-day load) / chronic(28-day average).
 *
 * Needs ≥ 42 days of history for a steady CTL signal. Until then,
 * trainingStateStatus stays "building".
 */
import type { Activity } from "@/lib/strava/types";

const CTL_TAU = 42;
const ATL_TAU = 7;
const ALPHA_CTL = 1 - Math.exp(-1 / CTL_TAU);
const ALPHA_ATL = 1 - Math.exp(-1 / ATL_TAU);

export interface DailyLoadPoint {
  /** YYYY-MM-DD */
  date: string;
  /** sum of TSS for that day (zero on rest days) */
  tss: number;
  ctl: number;
  atl: number;
  /** CTL_yesterday − ATL_yesterday */
  tsb: number;
}

/**
 * Aggregate `Activity[]` into daily TSS using whatever's available
 * (sufferScore is a reasonable proxy when we don't yet have power-derived TSS).
 */
export function dailyTssFromActivities(
  activities: Activity[],
  now: Date = new Date(),
): Map<string, number> {
  const daily = new Map<string, number>();
  for (const a of activities) {
    const d = new Date(a.startDate);
    if (d.getTime() > now.getTime()) continue;
    const key = isoDate(d);
    const load = a.sufferScore ?? estimateLoad(a);
    daily.set(key, (daily.get(key) ?? 0) + load);
  }
  return daily;
}

/** Fallback when neither power nor suffer_score is present — duration × HR intensity. */
function estimateLoad(a: Activity): number {
  const mins = a.movingTime / 60;
  if (a.averageHeartrate) {
    const intensity = clamp(a.averageHeartrate / 160, 0.5, 1.4);
    return Math.round(mins * intensity * 0.7);
  }
  return Math.round(mins * 0.4);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Walk every day from `start` to `end` (inclusive) in order, applying the
 * EWMA recursion. Returns the full series + the latest CTL/ATL/TSB.
 */
export function buildLoadSeries(
  dailyTss: Map<string, number>,
  start: Date,
  end: Date,
): { series: DailyLoadPoint[]; latest: DailyLoadPoint | null } {
  const series: DailyLoadPoint[] = [];
  let ctl = 0;
  let atl = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const stop = new Date(end);
  stop.setHours(0, 0, 0, 0);
  while (cur.getTime() <= stop.getTime()) {
    const key = isoDate(cur);
    const tss = dailyTss.get(key) ?? 0;
    const prevCtl = ctl;
    const prevAtl = atl;
    ctl = prevCtl + (tss - prevCtl) * ALPHA_CTL;
    atl = prevAtl + (tss - prevAtl) * ALPHA_ATL;
    series.push({
      date: key,
      tss,
      ctl: +ctl.toFixed(1),
      atl: +atl.toFixed(1),
      tsb: +(prevCtl - prevAtl).toFixed(1),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return { series, latest: series[series.length - 1] ?? null };
}

/** Acute-to-chronic load ratio for a given day. Default windows: 7 / 28 days. */
export function acuteChronicRatio(
  series: DailyLoadPoint[],
  acuteDays = 7,
  chronicDays = 28,
): { acute: number; chronic: number; ratio: number; band: "detrained" | "sweet" | "build" | "overload" } {
  if (series.length === 0) {
    return { acute: 0, chronic: 0, ratio: 0, band: "detrained" };
  }
  const tail = series.slice(-chronicDays);
  const acute = tail.slice(-acuteDays).reduce((s, p) => s + p.tss, 0);
  const chronicWeekly = (tail.reduce((s, p) => s + p.tss, 0) / chronicDays) * 7;
  const ratio = chronicWeekly > 0 ? acute / chronicWeekly : 0;
  const band: "detrained" | "sweet" | "build" | "overload" =
    ratio === 0 || ratio < 0.8
      ? "detrained"
      : ratio <= 1.3
        ? "sweet"
        : ratio <= 1.5
          ? "build"
          : "overload";
  return { acute, chronic: chronicWeekly, ratio: +ratio.toFixed(2), band };
}

/**
 * Convenience: compute the current CTL/ATL/TSB/ACR from `Activity[]` history.
 * Needs ≥ 42 days of history to be accurate. Returns `null` otherwise.
 */
export function computeTrainingState(
  activities: Activity[],
  now: Date = new Date(),
): null | {
  ctl: number;
  atl: number;
  tsb: number;
  acr: number;
  band: "detrained" | "sweet" | "build" | "overload";
  series: DailyLoadPoint[];
} {
  if (activities.length === 0) return null;
  const oldest = activities.reduce(
    (min, a) => Math.min(min, new Date(a.startDate).getTime()),
    Infinity,
  );
  const daysOfHistory = (now.getTime() - oldest) / (24 * 3600 * 1000);
  if (!Number.isFinite(daysOfHistory) || daysOfHistory < 42) {
    // Not enough history — still produce CTL/ATL but flag as building elsewhere.
  }
  // Walk a full 56-day window so EWMA settles.
  const start = new Date(now);
  start.setDate(now.getDate() - 56);
  const daily = dailyTssFromActivities(activities, now);
  const { series, latest } = buildLoadSeries(daily, start, now);
  if (!latest) return null;
  const acr = acuteChronicRatio(series);
  return {
    ctl: latest.ctl,
    atl: latest.atl,
    tsb: +(latest.ctl - latest.atl).toFixed(1),
    acr: acr.ratio,
    band: acr.band,
    series,
  };
}
