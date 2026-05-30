import type { Activity } from "./strava/types";

export function metersToKm(m: number): number {
  return m / 1000;
}

export function formatKm(m: number, digits = 1): string {
  return `${metersToKm(m).toFixed(digits)} km`;
}

/** "1h 23m" / "23m 04s" / "47s" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** for run/walk: pace per km — "4:12 /km" */
export function formatPace(mPerSec: number): string {
  if (!mPerSec || mPerSec <= 0) return "—";
  const secsPerKm = 1000 / mPerSec;
  const m = Math.floor(secsPerKm / 60);
  const s = Math.round(secsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

/** for ride/swim: speed — "25.4 km/h" or swim "1:27 /100m" */
export function formatSpeed(mPerSec: number): string {
  if (!mPerSec || mPerSec <= 0) return "—";
  return `${(mPerSec * 3.6).toFixed(1)} km/h`;
}

export function formatSwimPace(mPerSec: number): string {
  if (!mPerSec || mPerSec <= 0) return "—";
  const secsPer100 = 100 / mPerSec;
  const m = Math.floor(secsPer100 / 60);
  const s = Math.round(secsPer100 % 60);
  return `${m}:${String(s).padStart(2, "0")} /100m`;
}

export function formatActivitySpeed(a: Activity): string {
  if (!a.averageSpeed) return "—";
  if (a.type === "Swim") return formatSwimPace(a.averageSpeed);
  if (a.type === "Ride" || a.type === "VirtualRide") return formatSpeed(a.averageSpeed);
  if (a.distance > 0) return formatPace(a.averageSpeed);
  return formatSpeed(a.averageSpeed);
}

/** "Fri, May 30" — short editorial date */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "07:14 · 30 May" — for activity card top-row */
export function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "2 days ago", "today", "yesterday" — coarse relative */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const dayMs = 24 * 60 * 60 * 1000;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThen = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startToday - startThen) / dayMs);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return formatDateShort(iso);
}

/** ISO weekday Mo=0 ... Su=6 */
export function isoWeekday(iso: string): number {
  const d = new Date(iso);
  return (d.getDay() + 6) % 7;
}
