/**
 * Single source of truth for every Strava URL used by AIthlete.
 *
 * 2027-06-01 migration: Strava is moving REST + OAuth to
 * https://www.api-v3.strava.com. To cut over, set `STRAVA_API_BASE` in the
 * environment — every URL below recalculates from it. Authorization tokens
 * are sent in the `Authorization: Bearer` header (already correct in real.ts).
 *
 * Server-only module — never import from `"use client"` components.
 */

export const STRAVA_API_BASE =
  process.env.STRAVA_API_BASE ?? "https://www.strava.com/api/v3";

// ── OAuth endpoints (used by lib/auth.ts) ─────────────────────────────────
export const STRAVA_OAUTH_AUTHORIZE_URL = `${STRAVA_API_BASE}/oauth/authorize`;
export const STRAVA_OAUTH_TOKEN_URL = `${STRAVA_API_BASE}/oauth/token`;
/** Replaces /oauth/deauthorize, which is retired 2027-06-01. */
export const STRAVA_OAUTH_REVOKE_URL = `${STRAVA_API_BASE}/oauth/revoke`;
/** Used as the NextAuth userinfo URL. */
export const STRAVA_ATHLETE_URL = `${STRAVA_API_BASE}/athlete`;

// ── REST API paths (used by lib/strava/real.ts) ───────────────────────────
// Paths only — provider concatenates with STRAVA_API_BASE. Query strings
// stay at the call site so per-request params (per_page, keys, etc.) remain
// readable in context.
export const stravaPaths = {
  athlete: "/athlete",
  athleteActivities: "/athlete/activities",
  athleteZones: "/athlete/zones",
  athleteStats: (athleteId: string) => `/athletes/${athleteId}/stats`,
  athleteRoutes: (athleteId: string) => `/athletes/${athleteId}/routes`,
  activity: (id: string | number) => `/activities/${id}`,
  activityStreams: (id: string | number) => `/activities/${id}/streams`,
  segmentsStarred: "/segments/starred",
  segmentEfforts: "/segment_efforts",
  routeExportGpx: (routeId: number) => `/routes/${routeId}/export_gpx`,
} as const;
