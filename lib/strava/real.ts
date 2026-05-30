import type {
  Activity,
  ActivityType,
  AthleteProfile,
  AthleteStats,
  AthleteZones,
  DetailedActivity,
  LapInfo,
  Route,
  SegmentEffortDetail,
  SegmentEffortSummary,
  SportTotal,
  StreamSet,
  StravaProvider,
  SummarySegment,
  ZoneSet,
} from "./types";

const API_BASE = "https://www.strava.com/api/v3";

/**
 * Real Strava REST API provider.
 * Reads the access token from the current session JWT.
 */
export class RealStravaProvider implements StravaProvider {
  constructor(private accessToken: string) {}

  /* ----------------------------- private helpers ---------------------------- */
  private async req(path: string, init?: { revalidate?: number; cache?: RequestCache }): Promise<Response> {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      ...(init?.cache
        ? { cache: init.cache }
        : { next: { revalidate: init?.revalidate ?? 60 } }),
    });
    if (!res.ok) {
      throw new Error(`Strava ${path} ${res.status}`);
    }
    return res;
  }

  /* -------------------------------- activities ------------------------------ */
  async getRecentActivities(
    _userId: string,
    limit: number,
    page: number = 1,
  ): Promise<Activity[]> {
    const perPage = Math.min(Math.max(1, limit), 30);
    const pg = Math.max(1, Math.floor(page));
    const res = await this.req(
      `/athlete/activities?per_page=${perPage}&page=${pg}`,
      { revalidate: pg === 1 ? 60 : 300 },
    );
    const raw = (await res.json()) as StravaActivityDTO[];
    return raw.map(toActivity);
  }

  async getActivity(id: string | number): Promise<DetailedActivity> {
    const res = await this.req(`/activities/${id}?include_all_efforts=true`, {
      revalidate: 300,
    });
    const raw = (await res.json()) as StravaDetailedActivityDTO;
    return toDetailedActivity(raw);
  }

  async getActivityStreams(id: string | number, keys: string[]): Promise<StreamSet> {
    const k = keys.join(",");
    const res = await this.req(
      `/activities/${id}/streams?keys=${encodeURIComponent(k)}&key_by_type=true`,
      { revalidate: 600 },
    );
    const raw = (await res.json()) as Record<string, RawStreamDTO>;
    return mapStreamSet(raw);
  }

  /* --------------------------------- athlete -------------------------------- */
  async getAthleteProfile(_userId: string): Promise<AthleteProfile> {
    const res = await this.req("/athlete", { revalidate: 300 });
    const raw = (await res.json()) as StravaAthleteDTO;
    return {
      id: String(raw.id),
      stravaAthleteId: String(raw.id),
      firstName: raw.firstname,
      lastName: raw.lastname,
      username: raw.username ?? `${raw.firstname.toLowerCase()}${raw.id}`,
      avatarUrl: raw.profile ?? null,
      city: raw.city ?? undefined,
      country: raw.country ?? undefined,
      joinedAt: raw.created_at,
      ftp: raw.ftp ?? null,
      weight: raw.weight ?? null,
      measurementPreference: raw.measurement_preference ?? undefined,
    };
  }

  async getAthleteStats(userId: string): Promise<AthleteStats> {
    const res = await this.req(`/athletes/${userId}/stats`, { revalidate: 300 });
    const raw = (await res.json()) as StravaStatsDTO;
    return toAthleteStats(raw);
  }

  async getAthleteZones(): Promise<AthleteZones> {
    const res = await this.req("/athlete/zones", { revalidate: 3600 });
    const raw = (await res.json()) as unknown;
    return toAthleteZones(raw);
  }

  /* -------------------------------- segments -------------------------------- */
  async getStarredSegments(page = 1, perPage = 20): Promise<SummarySegment[]> {
    const res = await this.req(
      `/segments/starred?page=${page}&per_page=${perPage}`,
      { revalidate: 600 },
    );
    const raw = (await res.json()) as StravaSegmentDTO[];
    return raw.map(toSummarySegment);
  }

  async getSegmentEfforts(
    segmentId: number,
    opts?: { perPage?: number },
  ): Promise<SegmentEffortDetail[]> {
    const perPage = opts?.perPage ?? 30;
    const res = await this.req(
      `/segment_efforts?segment_id=${segmentId}&per_page=${perPage}`,
      { revalidate: 600 },
    );
    if (!res.ok) return [];
    const raw = (await res.json()) as StravaSegmentEffortDTO[];
    return raw.map((e) => ({
      id: e.id,
      segmentId: e.segment?.id ?? segmentId,
      segmentName: e.segment?.name ?? e.name,
      elapsedTime: e.elapsed_time,
      movingTime: e.moving_time,
      distance: e.distance,
      startDate: e.start_date,
      averageWatts: e.average_watts ?? undefined,
      averageHeartrate: e.average_heartrate ?? undefined,
      prRank: e.pr_rank ?? null,
      komRank: e.kom_rank ?? null,
    }));
  }

  /* --------------------------------- routes --------------------------------- */
  async getAthleteRoutes(
    athleteId: string,
    page = 1,
    perPage = 20,
  ): Promise<Route[]> {
    const res = await this.req(
      `/athletes/${athleteId}/routes?page=${page}&per_page=${perPage}`,
      { revalidate: 600 },
    );
    const raw = (await res.json()) as StravaRouteDTO[];
    return raw.map(toRoute);
  }

  async exportRouteGpx(routeId: number): Promise<string> {
    const res = await fetch(`${API_BASE}/routes/${routeId}/export_gpx`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Strava /routes/${routeId}/export_gpx ${res.status}`);
    return res.text();
  }
}

/* ============================== DTO mappings ============================== */

const KNOWN_TYPES: ActivityType[] = [
  "Run",
  "Ride",
  "Swim",
  "Workout",
  "Hike",
  "Walk",
  "VirtualRide",
  "WeightTraining",
];

function coerceType(t: string | undefined): ActivityType {
  return (KNOWN_TYPES.find((x) => x === t) ?? "Workout") as ActivityType;
}

interface StravaActivityDTO {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number | null;
  pr_count?: number;
  achievement_count?: number;
  calories?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  start_date: string;
  description?: string;
}

function toActivity(s: StravaActivityDTO): Activity {
  return {
    id: String(s.id),
    name: s.name,
    type: coerceType(s.type),
    distance: s.distance,
    movingTime: s.moving_time,
    elapsedTime: s.elapsed_time,
    totalElevationGain: s.total_elevation_gain,
    averageSpeed: s.average_speed,
    averageHeartrate: s.average_heartrate,
    maxHeartrate: s.max_heartrate,
    sufferScore: s.suffer_score ?? undefined,
    prCount: s.pr_count,
    achievementCount: s.achievement_count,
    calories: s.calories,
    averageWatts: s.average_watts,
    weightedAverageWatts: s.weighted_average_watts,
    startDate: s.start_date,
    description: s.description,
  };
}

interface StravaDetailedActivityDTO extends StravaActivityDTO {
  start_latlng?: [number, number] | null;
  end_latlng?: [number, number] | null;
  map?: { polyline?: string | null; summary_polyline?: string | null };
  average_cadence?: number;
  average_temp?: number;
  max_watts?: number;
  kilojoules?: number;
  has_heartrate?: boolean;
  laps?: StravaLapDTO[];
  segment_efforts?: StravaSegmentEffortDTO[];
  splits_metric?: Array<{
    split: number;
    distance: number;
    elapsed_time: number;
    moving_time: number;
    elevation_difference: number;
    average_speed: number;
    pace_zone?: number;
  }>;
  device_name?: string;
  max_speed?: number;
  workout_type?: number | null;
}

interface StravaLapDTO {
  id: number;
  name: string;
  lap_index: number;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  distance: number;
  total_elevation_gain: number;
  average_speed?: number;
  max_speed?: number;
  average_cadence?: number;
  average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

interface StravaSegmentEffortDTO {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  start_date: string;
  average_heartrate?: number;
  average_watts?: number;
  average_cadence?: number;
  pr_rank?: number | null;
  kom_rank?: number | null;
  achievements?: { type_id: number; type: string; rank: number }[];
  segment?: {
    id: number;
    name: string;
    activity_type: string;
    climb_category: number;
    average_grade?: number;
    distance: number;
  };
}

function toDetailedActivity(s: StravaDetailedActivityDTO): DetailedActivity {
  return {
    ...toActivity(s),
    startLatLng: s.start_latlng ?? null,
    endLatLng: s.end_latlng ?? null,
    polyline: s.map?.polyline ?? null,
    summaryPolyline: s.map?.summary_polyline ?? null,
    averageCadence: s.average_cadence,
    averageTemp: s.average_temp,
    maxWatts: s.max_watts,
    kilojoules: s.kilojoules,
    hasHeartrate: s.has_heartrate,
    laps: s.laps?.map(toLap),
    segmentEfforts: s.segment_efforts?.map(toSegmentEffortSummary),
    splitsMetric: s.splits_metric?.map((sp) => ({
      split: sp.split,
      distance: sp.distance,
      elapsedTime: sp.elapsed_time,
      movingTime: sp.moving_time,
      elevationDifference: sp.elevation_difference,
      averageSpeed: sp.average_speed,
      paceZone: sp.pace_zone,
    })),
    deviceName: s.device_name,
    maxSpeed: s.max_speed,
    workoutType: s.workout_type ?? null,
  };
}

function toLap(l: StravaLapDTO): LapInfo {
  return {
    id: l.id,
    name: l.name,
    lapIndex: l.lap_index,
    elapsedTime: l.elapsed_time,
    movingTime: l.moving_time,
    startDate: l.start_date,
    distance: l.distance,
    totalElevationGain: l.total_elevation_gain,
    averageSpeed: l.average_speed,
    maxSpeed: l.max_speed,
    averageCadence: l.average_cadence,
    averageWatts: l.average_watts,
    averageHeartrate: l.average_heartrate,
    maxHeartrate: l.max_heartrate,
  };
}

function toSegmentEffortSummary(e: StravaSegmentEffortDTO): SegmentEffortSummary {
  return {
    id: e.id,
    name: e.name,
    elapsedTime: e.elapsed_time,
    movingTime: e.moving_time,
    distance: e.distance,
    startDate: e.start_date,
    averageHeartrate: e.average_heartrate,
    averageWatts: e.average_watts,
    averageCadence: e.average_cadence,
    prRank: e.pr_rank ?? null,
    komRank: e.kom_rank ?? null,
    achievements: (e.achievements ?? []).map((a) => ({ type: a.type, rank: a.rank })),
    segment: e.segment
      ? {
          id: e.segment.id,
          name: e.segment.name,
          activityType: e.segment.activity_type,
          climbCategory: e.segment.climb_category,
          averageGrade: e.segment.average_grade,
          distance: e.segment.distance,
        }
      : undefined,
  };
}

/* --------------------------------- streams -------------------------------- */
interface RawStreamDTO {
  type?: string;
  data: number[] | [number, number][];
  series_type?: string;
  original_size?: number;
  resolution?: "low" | "medium" | "high";
}

function mapStream(raw: RawStreamDTO | undefined): StreamSet[keyof StreamSet] | undefined {
  if (!raw) return undefined;
  return {
    type: raw.type ?? "unknown",
    data: raw.data,
    seriesType: raw.series_type ?? "distance",
    originalSize: raw.original_size ?? raw.data.length,
    resolution: raw.resolution ?? "medium",
  };
}

function mapStreamSet(raw: Record<string, RawStreamDTO>): StreamSet {
  return {
    time: mapStream(raw.time),
    distance: mapStream(raw.distance),
    latlng: mapStream(raw.latlng),
    altitude: mapStream(raw.altitude),
    velocitySmooth: mapStream(raw.velocity_smooth),
    heartrate: mapStream(raw.heartrate),
    cadence: mapStream(raw.cadence),
    watts: mapStream(raw.watts),
    temp: mapStream(raw.temp),
    moving: mapStream(raw.moving),
    gradeSmooth: mapStream(raw.grade_smooth),
  };
}

/* --------------------------------- athlete -------------------------------- */
interface StravaAthleteDTO {
  id: number;
  firstname: string;
  lastname: string;
  username?: string;
  profile?: string;
  city?: string;
  country?: string;
  created_at: string;
  ftp?: number | null;
  weight?: number | null;
  measurement_preference?: "feet" | "meters";
}

interface StravaSportTotalDTO {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}

interface StravaStatsDTO {
  biggest_ride_distance?: number;
  biggest_climb_elevation_gain?: number;
  recent_ride_totals?: StravaSportTotalDTO;
  recent_run_totals?: StravaSportTotalDTO;
  recent_swim_totals?: StravaSportTotalDTO;
  ytd_ride_totals?: StravaSportTotalDTO;
  ytd_run_totals?: StravaSportTotalDTO;
  ytd_swim_totals?: StravaSportTotalDTO;
  all_ride_totals?: StravaSportTotalDTO;
  all_run_totals?: StravaSportTotalDTO;
  all_swim_totals?: StravaSportTotalDTO;
}

function toSportTotal(dto?: StravaSportTotalDTO): SportTotal {
  return {
    count: dto?.count ?? 0,
    distance: dto?.distance ?? 0,
    movingTime: dto?.moving_time ?? 0,
    elapsedTime: dto?.elapsed_time ?? 0,
    elevationGain: dto?.elevation_gain ?? 0,
    achievementCount: dto?.achievement_count,
  };
}

function toAthleteStats(s: StravaStatsDTO): AthleteStats {
  return {
    biggestRideDistance: s.biggest_ride_distance ?? 0,
    biggestClimbElevationGain: s.biggest_climb_elevation_gain ?? 0,
    recentRideTotals: toSportTotal(s.recent_ride_totals),
    recentRunTotals: toSportTotal(s.recent_run_totals),
    recentSwimTotals: toSportTotal(s.recent_swim_totals),
    ytdRideTotals: toSportTotal(s.ytd_ride_totals),
    ytdRunTotals: toSportTotal(s.ytd_run_totals),
    ytdSwimTotals: toSportTotal(s.ytd_swim_totals),
    allRideTotals: toSportTotal(s.all_ride_totals),
    allRunTotals: toSportTotal(s.all_run_totals),
    allSwimTotals: toSportTotal(s.all_swim_totals),
  };
}

/* ---------------------------------- zones --------------------------------- */
function toAthleteZones(raw: unknown): AthleteZones {
  const out: AthleteZones = {};
  if (!Array.isArray(raw)) {
    // Some shapes wrap heart_rate/power as object properties.
    const obj = raw as { heart_rate?: unknown; power?: unknown };
    if (obj?.heart_rate) out.heartRate = parseZoneSet(obj.heart_rate, "heart_rate");
    if (obj?.power) out.power = parseZoneSet(obj.power, "power");
    return out;
  }
  for (const item of raw as Array<{ type: string }>) {
    if (item.type === "heart_rate") out.heartRate = parseZoneSet(item, "heart_rate");
    if (item.type === "power") out.power = parseZoneSet(item, "power");
  }
  return out;
}

function parseZoneSet(
  raw: unknown,
  type: "heart_rate" | "power",
): ZoneSet {
  const r = raw as {
    distribution_buckets?: { min: number; max: number; time?: number }[];
    zones?: { min: number; max: number }[];
    custom_zones?: boolean;
    sensor_based?: boolean;
  };
  return {
    type,
    sensorBased: r.sensor_based,
    customZones: r.custom_zones,
    distributionBuckets: r.distribution_buckets ?? [],
    zones: r.zones,
  };
}

/* --------------------------------- segments ------------------------------- */
interface StravaSegmentDTO {
  id: number;
  name: string;
  activity_type: string;
  distance: number;
  average_grade?: number;
  maximum_grade?: number;
  elevation_high?: number;
  elevation_low?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  climb_category: number;
  city?: string;
  state?: string;
  country?: string;
  starred?: boolean;
  athlete_segment_stats?: {
    pr_elapsed_time?: number | null;
    pr_date?: string | null;
    effort_count?: number;
  };
}

function toSummarySegment(s: StravaSegmentDTO): SummarySegment {
  return {
    id: s.id,
    name: s.name,
    activityType: s.activity_type,
    distance: s.distance,
    averageGrade: s.average_grade,
    maximumGrade: s.maximum_grade,
    elevationHigh: s.elevation_high,
    elevationLow: s.elevation_low,
    startLatLng: s.start_latlng,
    endLatLng: s.end_latlng,
    climbCategory: s.climb_category,
    city: s.city,
    state: s.state,
    country: s.country,
    starred: s.starred,
    prTime: s.athlete_segment_stats?.pr_elapsed_time ?? null,
    prDate: s.athlete_segment_stats?.pr_date ?? null,
    effortCount: s.athlete_segment_stats?.effort_count,
  };
}

/* --------------------------------- routes --------------------------------- */
interface StravaRouteDTO {
  id: number;
  id_str: string;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  /** 1=Ride, 2=Run */
  type?: number;
  sub_type?: number;
  estimated_moving_time?: number;
  created_at: string;
  updated_at?: string;
  map?: { summary_polyline?: string };
}

function toRoute(r: StravaRouteDTO): Route {
  const typeMap = { 1: "Ride", 2: "Run" } as const;
  return {
    id: r.id,
    idStr: r.id_str,
    name: r.name,
    description: r.description,
    distance: r.distance,
    elevationGain: r.elevation_gain,
    type: typeMap[(r.type ?? 1) as 1 | 2] ?? "Ride",
    estimatedMovingTime: r.estimated_moving_time,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    summaryPolyline: r.map?.summary_polyline,
  };
}
