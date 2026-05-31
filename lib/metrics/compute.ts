import type {
  DetailedActivity,
  StreamSet,
  AthleteZones,
} from "@/lib/strava/types";
import type { ComputedMetrics, SessionType, SplitRow } from "./types";

/* helpers */
function asNumberArray(stream: { data: unknown } | undefined): number[] | undefined {
  if (!stream) return undefined;
  const arr = stream.data;
  if (!Array.isArray(arr)) return undefined;
  // Filter out latlng (tuples) — only return scalar streams here.
  if (arr.length > 0 && Array.isArray(arr[0])) return undefined;
  return arr as number[];
}

function rollingMean(values: number[], windowSec: number, dtSec = 1): number[] {
  if (values.length === 0) return [];
  const window = Math.max(1, Math.floor(windowSec / dtSec));
  const out = new Array(values.length).fill(0);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out[i] = i >= window - 1 ? sum / window : sum / (i + 1);
  }
  return out;
}

function maxRollingMean(values: number[], windowSec: number, dtSec = 1): number {
  if (values.length === 0) return 0;
  const window = Math.max(1, Math.floor(windowSec / dtSec));
  if (values.length < window) return mean(values);
  let sum = 0;
  for (let i = 0; i < window; i++) sum += values[i];
  let best = sum;
  for (let i = window; i < values.length; i++) {
    sum += values[i] - values[i - window];
    if (sum > best) best = sum;
  }
  return best / window;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ───────────────────────────── power ──────────────────────────────────── */

/** NP = 4th-root of mean of (30s rolling mean ^ 4). */
export function normalizedPower(watts: number[], dtSec = 1): number {
  if (watts.length === 0) return 0;
  const rolled = rollingMean(watts, 30, dtSec);
  let sum4 = 0;
  for (const v of rolled) sum4 += v * v * v * v;
  return Math.pow(sum4 / rolled.length, 0.25);
}

/** IF = NP / FTP */
export function intensityFactor(np: number, ftp: number): number | undefined {
  if (!ftp || ftp <= 0) return undefined;
  return np / ftp;
}

/** VI = NP / avgPower (~1.0 steady, >1.1 punchy) */
export function variabilityIndex(np: number, avgPower: number): number | undefined {
  if (!avgPower || avgPower <= 0) return undefined;
  return np / avgPower;
}

/** FTP estimate = 0.95 × best 20-min rolling avg power. */
export function ftpEstimate(watts: number[], dtSec = 1): number | undefined {
  if (watts.length < 60) return undefined;
  return 0.95 * maxRollingMean(watts, 1200, dtSec);
}

/** Best rolling averages for the canonical PowerCurve windows. */
export function bestPower(watts: number[], dtSec = 1) {
  return {
    s5: Math.round(maxRollingMean(watts, 5, dtSec)),
    s60: Math.round(maxRollingMean(watts, 60, dtSec)),
    s300: Math.round(maxRollingMean(watts, 300, dtSec)),
    s1200: Math.round(maxRollingMean(watts, 1200, dtSec)),
  };
}

/* ───────────────────────────── TSS ────────────────────────────────────── */

/** Power-based TSS = (movingSec × NP × IF) / (FTP × 3600) × 100 */
export function powerTss(movingSec: number, np: number, ftp: number): number {
  const intensity = np / ftp;
  return (movingSec * np * intensity) / (ftp * 3600) * 100;
}

/**
 * Zone-weighted HR-based TSS — when we don't have power.
 * Weights chosen so that 1h all-Z4 ≈ 80 TSS, 1h all-Z5 ≈ 100, 1h all-Z3 ≈ 60.
 */
export function hrTss(timeInZoneSec: number[]): number {
  const weights = [20, 40, 60, 80, 100];
  let weighted = 0;
  for (let i = 0; i < 5; i++) weighted += (timeInZoneSec[i] ?? 0) * weights[i];
  return weighted / 3600;
}

/* ─────────────────────── time in zone ────────────────────────────────── */

/** Walk HR stream + zones, bucket each second into the zone whose [min,max] contains it. */
export function timeInZoneFromStream(
  hrStream: number[],
  zones: AthleteZones | null,
  dtSec = 1,
): number[] | undefined {
  const hrZones = zones?.heartRate?.zones;
  if (!hrZones || hrZones.length < 5) return undefined;
  const buckets = [0, 0, 0, 0, 0];
  for (const hr of hrStream) {
    if (hr <= 0) continue;
    let i = hrZones.findIndex((z) => hr >= z.min && (z.max <= 0 || hr <= z.max));
    if (i === -1) {
      // Above the open-ended Z5 max — count as Z5
      if (hr > hrZones[hrZones.length - 1].min) i = hrZones.length - 1;
      else continue;
    }
    buckets[Math.min(i, 4)] += dtSec;
  }
  return buckets;
}

/* ───────────────────────── EF / drift / recovery HR ────────────────────── */

/**
 * Efficiency Factor — output divided by HR.
 * Rides: NP / avgHr.
 * Runs:  (speed in m/min) / avgHr.
 */
export function efficiencyFactor(opts: {
  type: "ride" | "run";
  np?: number;
  speedMps?: number;
  avgHr: number;
}): number | undefined {
  if (!opts.avgHr) return undefined;
  if (opts.type === "ride" && opts.np) return opts.np / opts.avgHr;
  if (opts.type === "run" && opts.speedMps) return (opts.speedMps * 60) / opts.avgHr;
  return undefined;
}

/**
 * Aerobic decoupling — split the steady portion in half, compare EF.
 * Positive % = HR rose relative to output (fatigue accumulating).
 */
export function cardiacDriftPct(opts: {
  hr: number[];
  output: number[]; // either watts or m/s
  dtSec?: number;
}): number | undefined {
  const { hr, output } = opts;
  if (hr.length < 600 || output.length < 600) return undefined;
  const n = Math.min(hr.length, output.length);

  // Skip the first ~5 min warm-up + last ~1 min cool-down to get the steady portion.
  const dt = opts.dtSec ?? 1;
  const start = Math.min(Math.floor(300 / dt), Math.floor(n * 0.1));
  const end = Math.max(n - Math.floor(60 / dt), Math.floor(n * 0.9));
  if (end - start < 200) return undefined;

  const mid = start + Math.floor((end - start) / 2);
  const h1Hr = mean(hr.slice(start, mid).filter((v) => v > 0));
  const h2Hr = mean(hr.slice(mid, end).filter((v) => v > 0));
  const h1Out = mean(output.slice(start, mid).filter((v) => v > 0));
  const h2Out = mean(output.slice(mid, end).filter((v) => v > 0));
  if (!h1Hr || !h2Hr || !h1Out || !h2Out) return undefined;
  const ef1 = h1Out / h1Hr;
  const ef2 = h2Out / h2Hr;
  return ((ef1 - ef2) / ef1) * 100;
}

/** Best-effort 1-min recovery HR drop after the activity. */
export function recoveryHr1min(hr: number[], dtSec = 1): number | undefined {
  if (hr.length < Math.floor(120 / dtSec)) return undefined;
  // peak HR near the end of the work portion
  const tailStart = hr.length - Math.floor(180 / dtSec);
  let peak = 0;
  for (let i = tailStart; i < hr.length - Math.floor(60 / dtSec); i++) {
    if (hr[i] > peak) peak = hr[i];
  }
  if (peak <= 0) return undefined;
  const last = hr[hr.length - 1];
  if (!last || last <= 0) return undefined;
  const drop = peak - last;
  return drop > 0 ? Math.round(drop) : undefined;
}

/* ──────────────────────────── splits ──────────────────────────────────── */

/**
 * Lift split rows from a DetailedActivity's `splitsMetric` (cycling/running).
 * Falls back to `laps`. Groups 1-km splits into quartiles for the UI table.
 */
export function buildSplits(activity: DetailedActivity): SplitRow[] {
  const km = activity.splitsMetric;
  if (km && km.length > 0) {
    // Group into 4 quartile bands of ~equal length.
    const total = km.length;
    const groups = 4;
    const sizes = [
      Math.floor(total / groups),
      Math.floor(total / groups),
      Math.floor(total / groups),
      total - 3 * Math.floor(total / groups),
    ];
    const rows: SplitRow[] = [];
    let idx = 1;
    let cursor = 0;
    for (let g = 0; g < groups; g++) {
      const slice = km.slice(cursor, cursor + sizes[g]);
      if (slice.length === 0) continue;
      const dist = slice.reduce((s, r) => s + r.distance, 0);
      const move = slice.reduce((s, r) => s + r.movingTime, 0);
      const elev = slice.reduce((s, r) => s + (r.elevationDifference || 0), 0);
      const speed = move > 0 ? (dist / move) * 3.6 : 0;
      rows.push({
        label: `${idx}–${idx + slice.length - 1}`,
        distanceKm: +(dist / 1000).toFixed(1),
        speedKmh: +speed.toFixed(1),
        paceSecPerKm: move > 0 ? move / (dist / 1000) : undefined,
        climbM: Math.round(elev),
        index: g,
      });
      cursor += sizes[g];
      idx += slice.length;
    }
    return rows;
  }

  // Fall back to laps if no splits_metric.
  const laps = activity.laps;
  if (laps && laps.length > 0) {
    return laps.map((l, i) => ({
      label: l.name || `Lap ${l.lapIndex}`,
      distanceKm: +(l.distance / 1000).toFixed(1),
      speedKmh: l.averageSpeed ? +(l.averageSpeed * 3.6).toFixed(1) : 0,
      avgPower: l.averageWatts,
      avgHr: l.averageHeartrate,
      climbM: Math.round(l.totalElevationGain),
      index: i,
    }));
  }
  return [];
}

/* ────────────────────────── session classifier ────────────────────────── */

export function classifySession(opts: {
  movingSec: number;
  intensityFactor?: number;
  hrPctMax?: number;
  prCount?: number;
  hrVarianceCv?: number;
}): SessionType {
  const { movingSec, intensityFactor: IF, hrPctMax, prCount, hrVarianceCv } = opts;
  // Race signal — multiple PRs or very high IF.
  if ((prCount ?? 0) >= 3 || (IF ?? 0) >= 1.05) return "race";
  // Long: > 2.5 hr, unless it's clearly intervals.
  if (movingSec > 9000 && (hrVarianceCv ?? 0) < 0.15) return "long";
  // Intervals: high HR variance.
  if ((hrVarianceCv ?? 0) > 0.18) return "intervals";
  // Intensity buckets from IF when we have it.
  if (IF != null) {
    if (IF >= 0.85) return "threshold";
    if (IF >= 0.75) return "tempo";
    if (IF >= 0.65) return "endurance";
    return "recovery";
  }
  // HR-based fallback.
  if (hrPctMax != null) {
    if (hrPctMax >= 0.88) return "threshold";
    if (hrPctMax >= 0.80) return "tempo";
    if (hrPctMax >= 0.70) return "endurance";
    return "recovery";
  }
  return "endurance";
}

/* ───────────────────────── master entry point ────────────────────────── */

/**
 * Compute everything we can from a DetailedActivity + (optional) streams + zones.
 * Pure function. No AI. No network.
 */
export function computeMetrics(opts: {
  activity: DetailedActivity;
  streams?: StreamSet | null;
  zones?: AthleteZones | null;
  athleteMaxHr?: number;
  athleteFtp?: number | null;
}): ComputedMetrics {
  const { activity, streams, zones, athleteMaxHr, athleteFtp } = opts;

  const hrArr = asNumberArray(streams?.heartrate);
  const wattsArr = asNumberArray(streams?.watts);
  const speedArr = asNumberArray(streams?.velocitySmooth);
  const altitudeArr = asNumberArray(streams?.altitude);
  const distanceArr = asNumberArray(streams?.distance);
  const timeArr = asNumberArray(streams?.time);

  // Detect dtSec from time stream (usually 1, sometimes coarser on smart trainers).
  const dtSec =
    timeArr && timeArr.length > 1 ? Math.max(1, Math.round(timeArr[1] - timeArr[0])) : 1;

  /* power */
  let np: number | undefined;
  let If: number | undefined;
  let vi: number | undefined;
  let ftp: number | undefined = athleteFtp ?? undefined;
  let bp: ComputedMetrics["bestPower"];
  if (wattsArr && wattsArr.length > 30) {
    np = Math.round(normalizedPower(wattsArr, dtSec));
    bp = bestPower(wattsArr, dtSec);
    if (!ftp) ftp = ftpEstimate(wattsArr, dtSec);
    if (ftp) {
      If = intensityFactor(np, ftp);
      if (If) If = +If.toFixed(2);
    }
    const avg = activity.averageWatts ?? mean(wattsArr);
    if (avg && np) vi = +variabilityIndex(np, avg)!.toFixed(2);
  }

  /* HR */
  const avgHr = activity.averageHeartrate;
  const maxHr = activity.maxHeartrate ?? (hrArr ? Math.max(...hrArr) : undefined);
  const hrPctMax = avgHr && athleteMaxHr ? avgHr / athleteMaxHr : undefined;
  const tiz = hrArr ? timeInZoneFromStream(hrArr, zones ?? null, dtSec) : undefined;
  const drift = hrArr && wattsArr
    ? cardiacDriftPct({ hr: hrArr, output: wattsArr, dtSec })
    : hrArr && speedArr
      ? cardiacDriftPct({ hr: hrArr, output: speedArr, dtSec })
      : undefined;
  const recoveryHr = hrArr ? recoveryHr1min(hrArr, dtSec) : undefined;

  /* HR variance — used for session classification */
  let hrVarianceCv: number | undefined;
  if (hrArr && avgHr && avgHr > 0) {
    let varianceSum = 0;
    let n = 0;
    for (const v of hrArr) {
      if (v > 0) {
        varianceSum += (v - avgHr) ** 2;
        n++;
      }
    }
    hrVarianceCv = n > 0 ? Math.sqrt(varianceSum / n) / avgHr : undefined;
  }

  /* TSS — power preferred, then HR-zone, then suffer fallback */
  let tss = 0;
  let tssSource: ComputedMetrics["tssSource"] = "suffer";
  if (np && ftp) {
    tss = Math.round(powerTss(activity.movingTime, np, ftp));
    tssSource = "power";
  } else if (tiz) {
    tss = Math.round(hrTss(tiz));
    tssSource = "hr";
  } else if (activity.sufferScore != null) {
    tss = Math.round(activity.sufferScore);
    tssSource = "suffer";
  }

  /* EF */
  const ride = activity.type === "Ride" || activity.type === "VirtualRide";
  const ef = avgHr
    ? efficiencyFactor({
        type: ride ? "ride" : "run",
        np,
        speedMps: activity.averageSpeed,
        avgHr,
      })
    : undefined;

  /* Session classification */
  const sessionType = classifySession({
    movingSec: activity.movingTime,
    intensityFactor: If,
    hrPctMax,
    prCount: activity.prCount,
    hrVarianceCv,
  });

  /* Splits */
  const splits = buildSplits(activity);
  const negativeSplit =
    splits.length >= 2 &&
    splits[splits.length - 1].speedKmh > splits[0].speedKmh;

  /* max grade from altitude+distance */
  let maxGradePct: number | undefined;
  if (altitudeArr && distanceArr && altitudeArr.length > 30) {
    const window = Math.floor(30 / dtSec);
    let best = 0;
    for (let i = window; i < altitudeArr.length; i++) {
      const dAlt = altitudeArr[i] - altitudeArr[i - window];
      const dDist = distanceArr[i] - distanceArr[i - window];
      if (dDist > 5) {
        const g = (dAlt / dDist) * 100;
        if (g > best) best = g;
      }
    }
    if (best > 0.5) maxGradePct = +best.toFixed(1);
  }

  /* Recovery — heuristic, tunable */
  const ifForRest = If ?? (hrPctMax ?? 0.7);
  const recoveryHours = Math.round(clamp(tss * 0.32 * (0.7 + ifForRest), 8, 72));
  const freshBy = new Date(Date.now() + recoveryHours * 3600 * 1000).toISOString();
  // Readiness is anchored to TSB when we have it; otherwise we infer from TSS.
  // (caller can pass a more accurate readiness by overlaying training-load.ts output.)
  const readiness: ComputedMetrics["readiness"] =
    tss > 110 ? "low" : tss > 60 ? "moderate" : "high";

  /* max speed */
  const maxSpeedKmh = activity.maxSpeed
    ? +(activity.maxSpeed * 3.6).toFixed(1)
    : speedArr
      ? +(Math.max(...speedArr) * 3.6).toFixed(1)
      : undefined;

  return {
    sessionType,
    distanceKm: +(activity.distance / 1000).toFixed(2),
    movingSec: activity.movingTime,
    elapsedSec: activity.elapsedTime,
    avgSpeedKmh: activity.averageSpeed ? +(activity.averageSpeed * 3.6).toFixed(1) : 0,
    maxSpeedKmh,
    elevationGain: Math.round(activity.totalElevationGain),
    maxGradePct,
    avgHr,
    maxHr,
    hrPctMax: hrPctMax ? +hrPctMax.toFixed(2) : undefined,
    timeInZoneSec: tiz,
    cardiacDriftPct: drift != null ? +drift.toFixed(1) : undefined,
    recoveryHr1min: recoveryHr,
    avgPower: activity.averageWatts,
    normalizedPower: np,
    intensityFactor: If,
    variabilityIndex: vi,
    ftpEstimate: ftp ? Math.round(ftp) : undefined,
    bestPower: bp,
    tss,
    tssSource,
    efficiencyFactor: ef ? +ef.toFixed(2) : undefined,
    trainingStateStatus: "building",
    recoveryHours,
    freshByISO: freshBy,
    readiness,
    splits,
    negativeSplit,
  };
}
