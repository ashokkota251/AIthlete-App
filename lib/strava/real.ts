import type {
  Activity,
  ActivityType,
  AthleteProfile,
  StravaProvider,
} from "./types";

/**
 * Real Strava REST API provider.
 * Reads the access token from the current session JWT.
 *
 * Wiring up: in API routes call `auth()` to get the session, then pass
 * `session.accessToken` to `new RealStravaProvider(accessToken)`.
 */
export class RealStravaProvider implements StravaProvider {
  constructor(private accessToken: string) {}

  async getRecentActivities(
    _userId: string,
    limit: number,
    page: number = 1,
  ): Promise<Activity[]> {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    const perPage = Math.min(Math.max(1, limit), 30);
    const pg = Math.max(1, Math.floor(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(pg));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      // Strava activities update infrequently — cache the first page briefly
      // (refresh re-fetches with `cache: "no-store"` via the API route).
      next: { revalidate: pg === 1 ? 60 : 300 },
    });

    if (!res.ok) {
      throw new Error(`Strava activities fetch failed: ${res.status}`);
    }

    const raw = (await res.json()) as StravaActivityDTO[];
    return raw.map(toActivity);
  }

  async getAthleteProfile(_userId: string): Promise<AthleteProfile> {
    const res = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Strava athlete fetch failed: ${res.status}`);
    }

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
    };
  }
}

/* --------------- raw Strava DTOs (subset) --------------- */
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
  start_date: string;
  description?: string;
}

interface StravaAthleteDTO {
  id: number;
  firstname: string;
  lastname: string;
  username?: string;
  profile?: string;
  city?: string;
  country?: string;
  created_at: string;
}

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

function toActivity(s: StravaActivityDTO): Activity {
  const type = (KNOWN_TYPES.find((t) => t === s.type) ?? "Workout") as ActivityType;
  return {
    id: String(s.id),
    name: s.name,
    type,
    distance: s.distance,
    movingTime: s.moving_time,
    elapsedTime: s.elapsed_time,
    totalElevationGain: s.total_elevation_gain,
    averageSpeed: s.average_speed,
    averageHeartrate: s.average_heartrate,
    startDate: s.start_date,
    description: s.description,
  };
}
