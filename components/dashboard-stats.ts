import type { Activity } from "@/lib/strava/types";
import { isoWeekday } from "@/lib/format";
import type { WeeklyPoint } from "@/components/charts/weekly-chart";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export interface WeekStats {
  totalKm: number;
  totalSeconds: number;
  totalElevation: number;
  count: number;
  longest: Activity | null;
  perDay: WeeklyPoint[];
  mostActiveDay: { day: string; km: number; activity: Activity | null } | null;
  /** % vs previous 7-day window. positive => up */
  deltaPct: number;
}

export function buildWeekStats(activities: Activity[]): WeekStats {
  // Anchor "now" to the latest activity so weekly windows align with the data
  // that was just fetched (rather than wall-clock, which can drift between requests).
  const now = activities.length > 0 ? new Date(activities[0].startDate) : new Date();
  const startOfWeek = new Date(now);
  // Monday-start week
  const dow = (now.getDay() + 6) % 7;
  startOfWeek.setDate(now.getDate() - dow);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfWeek.getDate() - 7);

  const inWeek = activities.filter((a) => new Date(a.startDate) >= startOfWeek);
  const inPrev = activities.filter((a) => {
    const t = new Date(a.startDate);
    return t >= startOfPrevWeek && t < startOfWeek;
  });

  const totalKm = inWeek.reduce((s, a) => s + a.distance / 1000, 0);
  const prevKm = inPrev.reduce((s, a) => s + a.distance / 1000, 0);
  const totalSeconds = inWeek.reduce((s, a) => s + a.movingTime, 0);
  const totalElevation = inWeek.reduce((s, a) => s + a.totalElevationGain, 0);
  const count = inWeek.length;

  const longest = inWeek.reduce<Activity | null>(
    (best, a) => (!best || a.distance > best.distance ? a : best),
    null,
  );

  const perDayKm: number[] = Array(7).fill(0);
  const perDayBest: (Activity | null)[] = Array(7).fill(null);
  for (const a of inWeek) {
    const w = isoWeekday(a.startDate);
    perDayKm[w] += a.distance / 1000;
    if (!perDayBest[w] || a.distance > perDayBest[w]!.distance) perDayBest[w] = a;
  }

  const perDay: WeeklyPoint[] = perDayKm.map((km, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return { day: DAY_LABELS[i], km, date: d.toISOString() };
  });

  let mostActiveDay: WeekStats["mostActiveDay"] = null;
  const maxIdx = perDayKm.reduce((bi, v, i) => (v > perDayKm[bi] ? i : bi), 0);
  if (perDayKm[maxIdx] > 0) {
    mostActiveDay = {
      day: DAY_LABELS[maxIdx],
      km: perDayKm[maxIdx],
      activity: perDayBest[maxIdx],
    };
  }

  const deltaPct = prevKm > 0 ? ((totalKm - prevKm) / prevKm) * 100 : totalKm > 0 ? 100 : 0;

  return {
    totalKm,
    totalSeconds,
    totalElevation,
    count,
    longest,
    perDay,
    mostActiveDay,
    deltaPct,
  };
}
