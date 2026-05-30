# Dashboard improvement roadmap

> Goal: turn AIthlete from a "log of recent activity" into a coach that
> actively helps the athlete train better. The Strava API gives us much more
> than we currently use — this doc maps each new feature to the training
> principle it serves, with a build cost and dependency.

## Guiding training principles

1. **Polarised intensity** — most time easy (Z1–Z2), some hard (Z4–Z5), little in the middle. The "tempo trap" is when too much volume sits in Z3 and you accumulate fatigue without adaptation.
2. **Progressive overload** — load grows slowly and consistently. Acute (last 7 days) vs chronic (last 28 days) load ratio between 0.8 and 1.3 is the sweet spot.
3. **Recovery is where adaptation lives** — flat or down weeks aren't lazy, they're the point.
4. **Sport balance** — for runners, cross-training and strength reduce injury. For triathletes, the three sport blocks need visibility.
5. **Long-arc context** — weekly numbers feel small; YTD and lifetime numbers anchor motivation.

## Phase A — High training value, low complexity (no new scopes)

These three changes alone roughly double the dashboard's analytical depth without needing extra OAuth scopes.

### A1. "Year so far" panel — *uses `GET /athletes/{id}/stats`*

The single biggest missing piece. Today the dashboard only knows "this week." Stats gives us YTD and lifetime totals per sport, plus the biggest single workout the athlete has ever done.

UI: a coral hero card on the dashboard, **below** the existing "This week" card.

```
┌──────────────────────────────────────────────┐
│ YEAR SO FAR                                  │
│                                              │
│   1,247km                          ╲╱        │
│   ────────                       ◔ 78%       │
│   Run · Ride · Swim              of 1,600    │
│                                  goal        │
│                                              │
│  Run 487 km · Ride 760 km · Swim 14 km      │
│  Biggest single ride: 96 km · climb: 1,420m  │
└──────────────────────────────────────────────┘
```

Adds: annual goal, on-pace indicator, sport split, lifetime PR highlights. Pure server-rendered. ~1 day of work.

### A2. Training-load / suffer-score trend — *uses fields we already fetch*

Each activity includes `suffer_score` (Strava's internal training-stress estimate). Today we discard it. Aggregate it weekly and plot the last 8 weeks.

UI: a small bar chart card on the dashboard.

- Y axis: weekly suffer score
- X axis: 8 weeks
- Coral bar with a soft trend line for the 28-day rolling mean
- **Acute / Chronic ratio** shown as a single number under the chart:
  - < 0.8 → "Detrained — ramp gradually"
  - 0.8–1.3 → "In the sweet spot"
  - > 1.5 → "Overload — recovery week recommended"

This is the single most important feature for injury prevention. ~0.5 days.

### A3. Sport balance donut

For multi-sport athletes (the ones we care most about), a small donut on the dashboard showing **this month's** sport distribution (run/ride/swim/strength) by time. Visually obvious if one discipline is being neglected.

Server-computed from fetched activities. ~0.25 days.

## Phase B — Medium complexity, high training impact

### B1. Time-in-zone panel — *needs `profile:read_all` scope + `/athlete/zones`*

The most coaching-rich addition. Combine the athlete's HR zones with each activity's average HR (we already have it) to estimate weekly time in each zone.

UI: stacked horizontal bar broken into Z1–Z5, with the polarised-training reference overlaid.

```
This week's intensity                        9h 12m
Z1 ████████████████████  4h 30m   easy
Z2 ████████████          2h 40m   aerobic
Z3 ███                   1h 12m   tempo
Z4 ██                      45m    threshold
Z5 █                        15m   VO2
```

**Coach prompt** below the bar — generated from these numbers:
- > 40% in Z3 → "Tempo trap — back two sessions off"
- < 20% in Z1 + Z2 → "You're missing aerobic volume"
- 0 minutes in Z4 + Z5 last 14 days → "Add one quality session"

This becomes the single most-referenced screen by a serious athlete. ~1.5 days.

> Scope change: edit `lib/auth.ts` → `authorization.params.scope` to `"read,activity:read_all,profile:read_all"`. Users must re-sign-in to re-consent.

### B2. Activity Detail screen — *uses `GET /activities/{id}` + `/streams`*

Today the activity list is terminal — tap a card, nothing happens. Build a detail screen.

UI:

- **Map** — render `map.polyline` as an SVG path (the encoded format decodes to lat/lng array; we can render it Mercator-projected into a fixed viewBox without any third-party map tile vendor).
- **Hero numbers** — distance, moving time, pace, avg HR, max HR, calories, suffer score.
- **Elevation + HR profile** — line chart with two y-axes from `/streams?keys=altitude,heartrate,distance`. Hover scrubs both.
- **Per-lap table** — from `laps[]`. Each row: split #, time, pace, HR, elev gain. Highlights the fastest split.
- **Segment efforts list** — name, time, PR rank.

~2.5 days. The map and stream chart are the bulk of it.

### B3. PR & achievement timeline

Every activity has `pr_count` and `achievement_count`. Aggregate across the season:

- Sparkline of PRs / week
- Recent achievement callouts ("3 PRs in your Tuesday tempo run")
- Total PRs YTD

~0.5 days. Pairs nicely with A1's annual goal card.

## Phase C — Advanced features

### C1. Starred segments scoreboard

`GET /segments/starred` + `GET /segment_efforts?segment_id=...` lets us track PR-vs-effort trends on the athlete's favourite hills. Show one "benchmark segment" on the dashboard with a chart of efforts over the last 12 months.

### C2. Saved routes library

`GET /athletes/{id}/routes` + the route's encoded polyline → a gallery of routes the athlete has saved. "Try a route" CTA exports `GET /routes/{id}/export_gpx` for their watch.

### C3. AI coach upgrades

Right now the coach gets a JSON snapshot of the last 10 activities. Add to its system prompt:

- The `/athletes/{id}/stats` payload (YTD context)
- The Phase-B1 time-in-zone breakdown (intensity context)
- A computed acute/chronic ratio (training-load context)

This single change makes the coach's advice an order of magnitude more useful — every suggestion is grounded in real numbers the model previously had to guess at.

### C4. Manual activity logging — *needs `activity:write` scope*

`POST /activities` lets the athlete log a strength session, indoor workout, or cross-training inside AIthlete. This is the "complete the picture" feature — strength volume that today is invisible.

UI: floating "+" button → simple form (name, sport_type, start_date_local, elapsed_time, notes). One round-trip.

## Suggested build order

1. **A1 + A3** in one PR — both feed off `/athletes/{id}/stats` + the existing activities array. Most visible win.
2. **A2** — training-load trend with acute/chronic ratio.
3. **C3** — bolt the new data onto the AI coach prompt so it benefits immediately from A1/A2.
4. **B2** — activity detail screen (the gateway to all the stream-based features).
5. **B1** — time-in-zone panel (requires the scope-change deploy).
6. **B3 → C1 → C2 → C4** as time allows.

## Concrete next steps to start Phase A

Files to add/modify:

| File | Change |
|---|---|
| `lib/strava/types.ts` | Add `AthleteStats` interface (see ActivityStats shape in `strava-api-reference.md`). |
| `lib/strava/real.ts` | Add `getAthleteStats(athleteId): Promise<AthleteStats>` method calling `/athletes/{id}/stats`. |
| `lib/strava/types.ts` (provider) | Extend `StravaProvider` interface with `getAthleteStats`. |
| `components/dashboard/year-so-far-card.tsx` | New component — coral hero card, annual goal computation, sport split. |
| `components/dashboard/load-trend-card.tsx` | New — weekly suffer-score bar chart + acute/chronic ratio chip. |
| `components/dashboard/sport-balance-donut.tsx` | New — SVG donut chart, % by sport this month. |
| `app/(app)/dashboard/page.tsx` | Wire the three new cards into the existing layout. |

Once you give the word, I can ship Phase A in one commit and have it auto-deploy via the GitHub Actions workflow.
