/** Classification of one workout — drives verdict copy + plan logic. */
export type SessionType =
  | "recovery"
  | "endurance"
  | "tempo"
  | "threshold"
  | "intervals"
  | "long"
  | "race";

/** Sentiment for the verdict banner. */
export type Sentiment = "nailed_it" | "solid" | "off_target" | "red_flag";

export interface SplitRow {
  /** which range, e.g. "1–9" or "Km 1" */
  label: string;
  /** km */
  distanceKm: number;
  /** km/h */
  speedKmh: number;
  /** s/km — for runs */
  paceSecPerKm?: number;
  /** watts */
  avgPower?: number;
  /** bpm */
  avgHr?: number;
  /** meters of climb in this split */
  climbM?: number;
  /** index into the splits — used to highlight the fastest */
  index: number;
}

export interface ComputedMetrics {
  // headline
  sessionType: SessionType;
  distanceKm: number;
  movingSec: number;
  elapsedSec: number;
  avgSpeedKmh: number;
  maxSpeedKmh?: number;
  elevationGain: number;
  maxGradePct?: number;

  // heart rate
  avgHr?: number;
  maxHr?: number;
  hrPctMax?: number;
  /** seconds in each zone [z1..z5] */
  timeInZoneSec?: number[];
  cardiacDriftPct?: number;
  /** bpm drop in first 60s after the effort */
  recoveryHr1min?: number;

  // power (cycling, if power meter present)
  avgPower?: number;
  normalizedPower?: number;
  intensityFactor?: number;
  variabilityIndex?: number;
  ftpEstimate?: number;
  /** best rolling average power over each window */
  bestPower?: { s5: number; s60: number; s300: number; s1200: number };

  // load
  /** TSS — preferred order: power, HR-zone, suffer_score fallback */
  tss: number;
  /** which source produced TSS */
  tssSource: "power" | "hr" | "suffer";
  /** "is it working" — NP/avgHr for rides, speed/avgHr for runs */
  efficiencyFactor?: number;

  // training state (needs history; absent until baseline built)
  ctl?: number;
  atl?: number;
  tsb?: number;
  acr?: number;
  /** "building" while we don't have enough history */
  trainingStateStatus: "ready" | "building";

  // recovery
  /** modeled estimate */
  recoveryHours: number;
  freshByISO: string;
  readiness: "low" | "moderate" | "high";

  // splits
  splits: SplitRow[];
  negativeSplit: boolean;
}

export interface DebriefNarration {
  /** "Tempo ride · executed well" */
  verdict: string;
  sentiment: Sentiment;
  /** 2–3, each citing a real number from ComputedMetrics */
  wentWell: string[];
  /** 1–2 */
  toWatch: string[];
  /** one line on fitness/fatigue */
  loadImpact: string;
  /** single coral CTA line */
  nextAction: string;
}

export interface DeepNarration {
  /** 2–3 recovery to-dos */
  restActions: string[];
  nextRide: {
    title: string;
    when: string;
    durationMin: number;
    intensity: string;
    targetHr: string;
    why: string;
  };
}

/** Result of computing + narrating one activity. */
export interface ActivityDebrief {
  metrics: ComputedMetrics;
  narration: DebriefNarration;
}

export interface ActivityDeepDive {
  metrics: ComputedMetrics;
  narration: DebriefNarration;
  deep: DeepNarration;
}
