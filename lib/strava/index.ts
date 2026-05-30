import type { StravaProvider } from "./types";
import { RealStravaProvider } from "./real";

/**
 * Returns a Strava REST client bound to the current session's access token.
 * Throws if no token is provided — protected routes must already have
 * verified the session.
 */
export function getStravaProvider(opts: { accessToken: string }): StravaProvider {
  if (!opts.accessToken) {
    throw new Error("getStravaProvider: missing access token");
  }
  return new RealStravaProvider(opts.accessToken);
}

export type { StravaProvider, Activity, ActivityType, AthleteProfile } from "./types";
