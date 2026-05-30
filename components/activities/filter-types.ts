import type { Activity, ActivityType } from "@/lib/strava/types";

/** Activity-type families shown as filter chips. */
export type TypeFilter = "all" | "run" | "ride" | "swim" | "strength" | "other";

/** Time window options. */
export type PeriodFilter = "all" | "week" | "month" | "quarter";

/** Sort order options. */
export type SortKey = "newest" | "oldest" | "distance" | "duration" | "elevation" | "hr";

export interface ActivityFilters {
  type: TypeFilter;
  period: PeriodFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: ActivityFilters = {
  type: "all",
  period: "all",
  sort: "newest",
};

const FAMILY: Record<ActivityType, TypeFilter> = {
  Run: "run",
  Walk: "run",
  Hike: "run",
  Ride: "ride",
  VirtualRide: "ride",
  Swim: "swim",
  Workout: "strength",
  WeightTraining: "strength",
};

function matchesType(a: Activity, t: TypeFilter): boolean {
  if (t === "all") return true;
  if (t === "other") return !(["run", "ride", "swim", "strength"] as TypeFilter[]).includes(FAMILY[a.type]);
  return FAMILY[a.type] === t;
}

function matchesPeriod(a: Activity, p: PeriodFilter): boolean {
  if (p === "all") return true;
  const days = p === "week" ? 7 : p === "month" ? 31 : 92;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(a.startDate).getTime() >= cutoff;
}

function compare(a: Activity, b: Activity, key: SortKey): number {
  switch (key) {
    case "oldest":
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    case "distance":
      return b.distance - a.distance;
    case "duration":
      return b.movingTime - a.movingTime;
    case "elevation":
      return b.totalElevationGain - a.totalElevationGain;
    case "hr":
      return (b.averageHeartrate ?? 0) - (a.averageHeartrate ?? 0);
    case "newest":
    default:
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  }
}

export function applyFilters(activities: Activity[], f: ActivityFilters): Activity[] {
  const filtered = activities.filter(
    (a) => matchesType(a, f.type) && matchesPeriod(a, f.period),
  );
  filtered.sort((a, b) => compare(a, b, f.sort));
  return filtered;
}

export function countActiveFilters(f: ActivityFilters): number {
  return (
    (f.type !== "all" ? 1 : 0) +
    (f.period !== "all" ? 1 : 0) +
    (f.sort !== "newest" ? 1 : 0)
  );
}

export const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "run", label: "Run" },
  { value: "ride", label: "Ride" },
  { value: "swim", label: "Swim" },
  { value: "strength", label: "Strength" },
  { value: "other", label: "Other" },
];

export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 31 days" },
  { value: "quarter", label: "Last 3 mo" },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "distance", label: "Longest" },
  { value: "duration", label: "Most time" },
  { value: "elevation", label: "Most elev" },
  { value: "hr", label: "Highest HR" },
];
