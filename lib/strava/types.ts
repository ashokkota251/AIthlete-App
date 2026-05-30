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
  /** ISO date */
  startDate: string;
  /** optional sub-label / description */
  description?: string;
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
}
