export type ActivityType =
  | "Run"
  | "Ride"
  | "Swim"
  | "Workout"
  | "Hike"
  | "Walk"
  | "VirtualRide"
  | "WeightTraining";

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  /** meters */
  distance: number;
  /** seconds */
  movingTime: number;
  /** seconds */
  elapsedTime: number;
  /** meters */
  totalElevationGain: number;
  /** m/s */
  averageSpeed?: number;
  /** bpm */
  averageHeartrate?: number;
  /** bpm */
  maxHeartrate?: number;
  /** Strava's training-stress estimate */
  sufferScore?: number;
  /** number of PRs broken on this activity */
  prCount?: number;
  /** total achievements (PR + segment placements) */
  achievementCount?: number;
  /** kilocalories */
  calories?: number;
  averageWatts?: number;
  weightedAverageWatts?: number;
  /** ISO date */
  startDate: string;
  /** optional sub-label / description */
  description?: string;
}

/** Single sport's totals (run / ride / swim / etc.) */
export interface SportTotal {
  count: number;
  /** meters */
  distance: number;
  /** seconds */
  movingTime: number;
  /** seconds */
  elapsedTime: number;
  /** meters */
  elevationGain: number;
  achievementCount?: number;
}

export interface AthleteStats {
  /** meters — biggest single ride distance ever */
  biggestRideDistance: number;
  /** meters — biggest single climb */
  biggestClimbElevationGain: number;
  recentRideTotals: SportTotal;
  recentRunTotals: SportTotal;
  recentSwimTotals: SportTotal;
  ytdRideTotals: SportTotal;
  ytdRunTotals: SportTotal;
  ytdSwimTotals: SportTotal;
  allRideTotals: SportTotal;
  allRunTotals: SportTotal;
  allSwimTotals: SportTotal;
}

export interface ZoneBucket {
  /** lower bound — bpm or watts. -1 means no upper bound. */
  min: number;
  max: number;
  /** historical seconds spent in this bucket (Strava-provided) */
  time?: number;
}

export interface ZoneSet {
  type: "heart_rate" | "power";
  sensorBased?: boolean;
  customZones?: boolean;
  /** lifetime distribution Strava knows about (may be empty) */
  distributionBuckets: ZoneBucket[];
  /** the actual zone definitions: [{min,max}] per zone */
  zones?: { min: number; max: number }[];
}

export interface AthleteZones {
  heartRate?: ZoneSet;
  power?: ZoneSet;
}

export interface LapInfo {
  id: number;
  name: string;
  lapIndex: number;
  elapsedTime: number;
  movingTime: number;
  startDate: string;
  /** meters */
  distance: number;
  totalElevationGain: number;
  /** m/s */
  averageSpeed?: number;
  maxSpeed?: number;
  averageCadence?: number;
  averageWatts?: number;
  averageHeartrate?: number;
  maxHeartrate?: number;
}

export interface SegmentEffortSummary {
  id: number;
  name: string;
  elapsedTime: number;
  movingTime: number;
  /** meters */
  distance: number;
  startDate: string;
  averageHeartrate?: number;
  averageWatts?: number;
  averageCadence?: number;
  prRank: number | null;
  komRank: number | null;
  achievements: { type: string; rank: number }[];
  segment?: {
    id: number;
    name: string;
    activityType: string;
    climbCategory: number;
    averageGrade?: number;
    distance: number;
  };
}

export interface DetailedActivity extends Activity {
  /** [lat, lng] arrays */
  startLatLng?: [number, number] | null;
  endLatLng?: [number, number] | null;
  /** encoded polyline (Google encoded polyline algorithm) */
  polyline?: string | null;
  summaryPolyline?: string | null;
  averageCadence?: number;
  averageTemp?: number;
  maxWatts?: number;
  kilojoules?: number;
  hasHeartrate?: boolean;
  laps?: LapInfo[];
  segmentEfforts?: SegmentEffortSummary[];
  splitsMetric?: Array<{
    split: number;
    distance: number;
    elapsedTime: number;
    movingTime: number;
    elevationDifference: number;
    averageSpeed: number;
    paceZone?: number;
  }>;
  deviceName?: string;
  /** km/h */
  maxSpeed?: number;
  workoutType?: number | null;
}

export interface ActivityStream {
  type: string;
  data: number[] | [number, number][];
  seriesType: string;
  originalSize: number;
  resolution: "low" | "medium" | "high";
}

export interface StreamSet {
  time?: ActivityStream;
  distance?: ActivityStream;
  latlng?: ActivityStream;
  altitude?: ActivityStream;
  velocitySmooth?: ActivityStream;
  heartrate?: ActivityStream;
  cadence?: ActivityStream;
  watts?: ActivityStream;
  temp?: ActivityStream;
  moving?: ActivityStream;
  gradeSmooth?: ActivityStream;
}

export interface SummarySegment {
  id: number;
  name: string;
  activityType: string;
  /** meters */
  distance: number;
  averageGrade?: number;
  maximumGrade?: number;
  elevationHigh?: number;
  elevationLow?: number;
  startLatLng?: [number, number];
  endLatLng?: [number, number];
  climbCategory: number;
  city?: string;
  state?: string;
  country?: string;
  starred?: boolean;
  prTime?: number | null;
  prDate?: string | null;
  effortCount?: number;
}

export interface SegmentEffortDetail {
  id: number;
  segmentId: number;
  segmentName: string;
  /** seconds */
  elapsedTime: number;
  movingTime: number;
  /** meters */
  distance: number;
  startDate: string;
  averageWatts?: number;
  averageHeartrate?: number;
  prRank: number | null;
  komRank: number | null;
}

export interface Route {
  id: number;
  idStr: string;
  name: string;
  description?: string;
  /** meters */
  distance: number;
  elevationGain: number;
  /** "Run" | "Ride" | etc. — derived from sub_type */
  type: string;
  /** seconds */
  estimatedMovingTime?: number;
  createdAt: string;
  updatedAt?: string;
  summaryPolyline?: string;
}

export interface AthleteProfile {
  id: string;
  stravaAthleteId: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
  city?: string;
  country?: string;
  /** ISO date — when the athlete created their Strava account */
  joinedAt?: string;
  /** Functional Threshold Power (watts) */
  ftp?: number | null;
  /** kg */
  weight?: number | null;
  measurementPreference?: "feet" | "meters";
}

export interface StravaProvider {
  /**
   * @param userId  the Strava athlete id (kept for symmetry; the real client
   *                uses the bearer token rather than this id)
   * @param limit   how many activities to fetch per page (1..30)
   * @param page    1-based page index; defaults to 1
   */
  getRecentActivities(userId: string, limit: number, page?: number): Promise<Activity[]>;
  getAthleteProfile(userId: string): Promise<AthleteProfile>;
  getAthleteStats(userId: string): Promise<AthleteStats>;
  getAthleteZones(): Promise<AthleteZones>;
  getActivity(id: string | number): Promise<DetailedActivity>;
  getActivityStreams(id: string | number, keys: string[]): Promise<StreamSet>;
  getStarredSegments(page?: number, perPage?: number): Promise<SummarySegment[]>;
  getSegmentEfforts(segmentId: number, opts?: { perPage?: number }): Promise<SegmentEffortDetail[]>;
  getAthleteRoutes(athleteId: string, page?: number, perPage?: number): Promise<Route[]>;
  /** Returns GPX XML as a string */
  exportRouteGpx(routeId: number): Promise<string>;
}
