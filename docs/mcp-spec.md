# AIthlete × Strava MCP — Integration Spec

**Status:** Draft · authored 2026-06-01
**Owner:** Ashoka
**Scope:** How and where AIthlete should adopt the official Strava MCP Connector that began rolling out 2026-06-01.

---

## 1. Verdict

**Augment, don't replace.** The REST API stays the load-bearing data path for the deterministic UI; the Strava MCP slots in behind the conversational surfaces (Coach, optionally Analysis) where its subscription-only signals and live querying actually pay off.

Reasons the MCP can't be a wholesale replacement:

- **Subscriber-gated.** The MCP is included with a Strava subscription. Non-subscribers must continue to work — they get the REST-backed app.
- **Read-only and conversational scope.** Activity history, fitness trends, readiness, goal planning, cross-sport, gear. No streams, no segment efforts, no detailed splits, no polylines — all of which the activity-detail page and metrics pipeline depend on.
- **Topology mismatch for non-chat surfaces.** Dashboard / activity detail / metrics need structured JSON in a single round-trip. MCP tool-calling adds latency that's invisible in a chat but painful on a page render.
- **Rate limits.** MCP has per-minute and per-day caps; the REST API has its own. Two pools is better than one when one of them throttles.

---

## 2. Topology

```
Browser ─► AIthlete API route ─► Anthropic Messages API
                                       │
                                       ▼ mcp_servers[]
                              https://mcp.strava.com/mcp
                              (per-user OAuth token)
```

AIthlete's backend stays the AI client. Anthropic's Messages API forwards tool calls to the Strava MCP using the user-specific authorization token we provide on each request.

---

## 3. What stays on REST (forever)

| Surface | File(s) | Why |
|---|---|---|
| Dashboard | `app/(app)/dashboard/page.tsx` | Structured cards, computed metrics, must render in one round-trip. |
| Activity detail | `app/(app)/activities/[id]/*` | Needs streams (`getActivityStreams`), segment efforts, polyline — outside MCP scope. |
| Activities list | `app/(app)/activities/page.tsx` | Pagination, structured JSON. |
| Profile | `app/(app)/profile/page.tsx` | Static athlete profile fields. |
| Metrics pipeline | `lib/metrics/compute.ts` | Deterministic, must operate on raw JSON. |
| Recovery / Stretches | `components/recovery/*` | Local catalogue, no Strava data. |

---

## 4. What moves to MCP

| Surface | File(s) | Notes |
|---|---|---|
| Coach chat | `app/api/chat/route.ts` | Primary target. Conversational, latency-tolerant, benefits most from live data + subscriber features. |
| Weekly Analysis | `app/api/analysis/route.ts` | Secondary, optional. Lower priority — analysis emits structured JSON so tool-call latency stacks. |

---

## 5. Phased plan

### Phase 1 — MCP OAuth + token storage (~1 day)

- **New OAuth flow** against Strava's MCP authorize endpoint (separate token from the existing REST OAuth). Discover OAuth metadata at `https://mcp.strava.com/mcp/.well-known/oauth-authorization-server`.
- **Routes to add:**
  - `app/api/auth/strava-mcp/connect/route.ts` — kicks off PKCE flow, redirects to Strava MCP authorize.
  - `app/api/auth/strava-mcp/callback/route.ts` — exchanges code, stores token in JWT.
- **Storage:** AIthlete uses NextAuth JWT-only with no DB. Cheapest path is to stash `mcpAccessToken` / `mcpRefreshToken` / `mcpExpiresAt` in the JWT alongside the existing `accessToken`. Mirror `refreshStravaToken` in `lib/auth.ts` for refresh.
- **UI:** add a "Connect to Strava MCP (subscriber-only)" toggle on `app/(app)/profile/page.tsx`. Show subscription-required messaging if connect fails with a 403/insufficient-scope error.

### Phase 2 — Coach reads from MCP (~1 day)

- **Extend the provider.** `lib/ai/providers/anthropic.ts` accepts an optional `mcpServers` arg passed through to `client().messages.create`:

  ```ts
  await client().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system,
    messages,
    mcp_servers: [{
      type: "url",
      url: "https://mcp.strava.com/mcp",
      name: "strava",
      authorization_token: userMcpToken,
    }],
  }, {
    headers: { "anthropic-beta": "mcp-client-2025-04-04" },
  });
  ```

  Beta header name must be verified against current Anthropic docs at integration time — pin it in one place (e.g. `lib/ai/providers/anthropic.ts`).

- **Branch in `app/api/chat/route.ts`** on `session.mcpAccessToken`:
  - If present → drop the pre-fetched `getRecentActivities` / `getAthleteStats` injection. Pass `mcpServers` to the provider. System prompt switches to "you have live Strava tools — call them rather than guessing."
  - If absent → keep the current REST-backed pipeline unchanged.

- **System prompt:** the "Time-window honesty" rule we added 2026-05-31 becomes redundant in MCP-mode — Claude can ask for the actual window. Keep it for the REST fallback branch.

### Phase 3 — Weekly Analysis (~0.5 day, optional)

- Same swap in `app/api/analysis/route.ts`.
- Lower priority: analysis emits structured JSON; tool-call round-trips slow the first byte materially.

### Phase 4 — Hardening (~0.5 day)

- **MCP 429 → REST fallback** for that single request.
- **MCP unreachable → REST fallback** with `[mcp-fallback]` log line.
- **Single observability line per chat request:** `mcp_used | mcp_tool_calls | fallback_reason`.
- **Heartbeat:** if MCP returns 401 for an authenticated user, mark the token stale and prompt re-connect on next page load.

---

## 6. Trade-offs to keep in mind

- **Subscriber gate is permanent.** The REST fallback path is not a temporary scaffolding — it must remain a first-class code path forever.
- **Beta API.** Anthropic's MCP connector is in beta; pin the beta header in one place so future renames are a one-line edit.
- **Latency.** Tool-calling adds seconds per turn. Acceptable for chat; do not propagate this pattern to render-blocking pages.
- **Data shape uncertainty.** Strava's MCP returns whatever they decide; verify the actual tool schema once authorized and adjust the system prompt accordingly.
- **Rollout gradient.** "Gradual" from 2026-06-01 — even subscribed users may not have access immediately. Detect, degrade, and don't show the "Connect" toggle until eligibility is confirmed (we can detect 404 on the well-known doc, or a specific Strava error).

---

## 7. Regulatory context (Developer Program changes effective 2026-06-01)

Strava's program updates published 2026-06-01 change the surrounding ground rules — they don't change this plan, but they shape why we want to be on the MCP for chat surfaces and stay vigilant on the REST side:

- **Standard Tier developers now require a Strava subscription.** Existing devs have until 2026-06-30. Confirm AIthlete's dev account is subscribed.
- **Intermediary platforms are restricted.** AIthlete is a direct integration (our backend → Strava API), so we are not affected. We must never route athlete data through a third-party intermediary.
- **June 2027 technical changes** — tracked separately in `docs/strava-api-2027-migration.md` (TBD): base URL change to `https://www.api-v3.strava.com`, `oauth/revoke` replaces `oauth/deauthorize`. Authorization-header requirement is already met.
- **Endpoint deprecations 2026-09-01** (Clubs ×3, Segments Explore) — confirmed not used in AIthlete's code (only present in `docs/strava-swagger.json` reference).

---

## 8. Open questions

1. **Exact Anthropic beta header** — verify at implementation time. Current best guess: `anthropic-beta: mcp-client-2025-04-04`.
2. **MCP tool schema** — read it once we have a connected account; the system prompt for MCP-mode depends on tool names/shapes.
3. **Token refresh semantics** — does Strava's MCP issue refresh tokens with the same TTL as the REST OAuth? Refresh logic mirrors `refreshStravaToken` either way; just need to confirm the endpoint and grant type.
4. **DB or JWT for MCP token?** JWT is cheaper for v1 but caps token size and complicates rotation. Revisit if we add other persistent state.
5. **Should non-subscribers see the Coach at all?** Today they do (REST-backed). Plan keeps that — but Strava may prefer subscriber-only AI surfaces. Re-check Strava's terms before launch.

---

## 9. Acceptance criteria

- A Strava-subscriber user can click "Connect Strava MCP" on the profile page and complete OAuth.
- After connecting, every Coach reply is grounded by MCP tool calls, not by pre-fetched JSON injection.
- If MCP is unavailable (429, 5xx, or token revoked), the Coach silently falls back to the REST-backed pipeline within one request — no user-facing error.
- Non-subscribers see no MCP UI and use the existing pipeline unchanged.
- Dashboard, activity detail, activities list, and metrics pipeline behavior is unchanged.
