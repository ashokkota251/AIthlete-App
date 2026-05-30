# Strava API v3 — quick reference

Source: `docs/strava-swagger.json` (verbatim copy of the user-provided Swagger spec, saved 2026-05-31).

Upstream playground: <https://developers.strava.com/playground>

## OAuth scopes — what we have vs. what unlocks what

| Scope | Granted today | What it unlocks |
|---|---|---|
| `read` | yes | public profile, public segments, public routes |
| `activity:read_all` | yes | all athlete activities incl. *Only Me*, with privacy-zone data |
| `profile:read_all` | **no** | `GET /athlete/zones` — HR & power zones, needed for the time-in-zone training intensity panel |
| `profile:write` | no | star/unstar segments, set FTP/weight from inside AIthlete |
| `activity:write` | no | create manual activities (e.g. strength sessions), upload `.fit`/`.gpx` files, edit activity name/visibility |

To request more scopes, edit `lib/auth.ts` → `authorization.params.scope` and have the user re-sign-in to re-consent.

## Endpoint inventory grouped by use-case

### Currently used by AIthlete

| Endpoint | Where |
|---|---|
| `GET /athlete` | `lib/strava/real.ts → getAthleteProfile` |
| `GET /athlete/activities` | `lib/strava/real.ts → getRecentActivities` (powers Dashboard / Activities / AI Analysis / Coach) |

### Available, not yet used — ranked by training value

**High value, low effort**

| Endpoint | What it gives us |
|---|---|
| `GET /athletes/{id}/stats` | Lifetime + YTD totals split by Run / Ride / Swim. Biggest single ride. Biggest single climb. Foundation for annual goal tracking. |
| `GET /activities/{id}` | Per-activity detail incl. `suffer_score`, `calories`, `kilojoules`, `weighted_average_watts`, `max_heartrate`, `pr_count`, `splits_metric`, `laps`, segment efforts, encoded `map.polyline`. Foundation for an Activity Detail screen. |
| `GET /activities/{id}/laps` | Per-lap breakdown (good for interval workouts). |

**High value, medium effort**

| Endpoint | What it gives us |
|---|---|
| `GET /athlete/zones` *(needs `profile:read_all`)* | The athlete's HR & power zones. Combined with each activity's avg HR you can compute time-in-zone for the week. |
| `GET /activities/{id}/streams` | Second-by-second HR, watts, altitude, latlng, cadence. Powers HR/elevation profile chart + map render for the detail screen. |
| `GET /activities/{id}/zones` | Per-activity time-in-zone (Summit / paid Strava). |

**Nice-to-have**

| Endpoint | What it gives us |
|---|---|
| `GET /segments/starred` + `GET /segment_efforts` | Track PR progress on the athlete's favourite hills/sprints. |
| `GET /segments/explore` | "Top segments near you" feature, bbox-based. |
| `GET /athletes/{id}/routes` | Saved-route library with GPX export. |
| `GET /athlete/clubs` + `GET /clubs/{id}/activities` | Social / club leaderboard. |

**Write endpoints** *(would need `activity:write` / `profile:write`)*

| Endpoint | What it gives us |
|---|---|
| `POST /activities` | Log strength/indoor sessions without leaving AIthlete. |
| `POST /uploads` | Upload `.fit`/`.gpx` files. |
| `PUT /activities/{id}` | Edit activity name/description (rename a Garmin auto-name). |
| `PUT /segments/{id}/starred` | Star/unstar from AIthlete. |
| `PUT /athlete` | Set weight & FTP. |

## Rate limits

Default tier-1: **100 requests / 15 minutes, 1,000 / day** per app. Higher tier available on request.

Strava sends `X-RateLimit-Limit` and `X-RateLimit-Usage` headers on every response. `RealStravaProvider` could surface these and back-off gracefully — currently not implemented.

## Useful response shapes (memorise these)

**ActivityStats** (`/athletes/{id}/stats`):

```ts
{
  biggest_ride_distance: number;          // meters
  biggest_climb_elevation_gain: number;   // meters
  recent_ride_totals: ActivityTotal;      // last 4 weeks
  recent_run_totals: ActivityTotal;
  recent_swim_totals: ActivityTotal;
  ytd_ride_totals: ActivityTotal;
  ytd_run_totals: ActivityTotal;
  ytd_swim_totals: ActivityTotal;
  all_ride_totals: ActivityTotal;
  all_run_totals: ActivityTotal;
  all_swim_totals: ActivityTotal;
}
type ActivityTotal = {
  count: number;
  distance: number;       // meters
  moving_time: number;    // seconds
  elapsed_time: number;
  elevation_gain: number; // meters
  achievement_count?: number;
}
```

**Zones** (`/athlete/zones`):

```ts
Array<{
  type: "heart_rate" | "power";
  sensor_based: boolean;
  custom_zones?: boolean;
  distribution_buckets: Array<{ min: number; max: number; time: number /* seconds */ }>;
  zones?: Array<{ min: number; max: number }>;
}>
```

**Activity streams** (`/activities/{id}/streams?keys=heartrate,altitude,latlng,distance`):

```ts
{
  heartrate: { type: "heartrate"; data: number[]; series_type: "distance" | "time"; original_size: number; resolution: "low"|"medium"|"high" };
  altitude:  { type: "altitude";  data: number[]; ... };
  latlng:    { type: "latlng";    data: [lat, lng][]; ... };
  distance:  { type: "distance";  data: number[]; ... };
  // and any other key you pass
}
```
