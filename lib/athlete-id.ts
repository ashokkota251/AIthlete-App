/**
 * Coerce any session/raw athlete id into a usable string, or empty if invalid.
 *
 * Upstream auth occasionally produces stringified nullish values
 * ("undefined", "null", "NaN") instead of a real id — usually when Strava's
 * userinfo response is missing `id` and a `String(undefined)` runs somewhere
 * along the way. Filter those out at every consumer so cache keys, Strava
 * API URLs, and downstream lookups don't inherit a poisoned id.
 *
 * Accepts `unknown` so it works for both `session.stravaAthleteId`
 * (typed `string | undefined`) and raw Strava `id` fields (typed
 * `number | string`).
 */
export function resolveAthleteId(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  if (trimmed === "undefined" || trimmed === "null" || trimmed === "NaN")
    return "";
  return trimmed;
}
