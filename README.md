# AIthlete

AI-powered fitness companion for athletes. **Sign in with Strava** (one tap, no
passwords), see your recent activities and weekly dashboard, get an AI analysis
of your last 10 sessions, and chat with an AI coach that's strictly scoped to
training. Database-less Next.js monolith.

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in AUTH_STRAVA_ID, AUTH_STRAVA_SECRET, ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000 → **Sign in with Strava**.

### Strava app setup

1. Create your app at https://www.strava.com/settings/api
2. **Authorization Callback Domain** must be the bare host you serve from
   (`localhost` for local dev, no `http://`, no port, no path).
3. Paste the Client ID and Client Secret into `.env.local`.

### AI features

Set `ANTHROPIC_API_KEY` in `.env.local`. The `/analysis` and `/coach` routes
talk to Anthropic server-side; the key is never exposed to the client.

## Architecture

- **Framework**: Next.js 15 App Router + TypeScript
- **Styling**: Tailwind CSS with custom coral/ink/cream design tokens
- **Auth**: NextAuth v5, Strava OAuth, JWT session strategy, no DB adapter
- **AI**: Anthropic SDK, server-side only
- **Charts**: Recharts
- **No database** — sessions in encrypted JWT cookie, activities fetched live
  from Strava on each request, chat in client state.

## Folder layout

```
app/
  signin/             — sign-in screen (Strava button)
  (app)/              — protected routes (dashboard, activities, analysis,
                        coach, profile) behind a server-side auth guard
  api/auth/[...]      — NextAuth handlers
  api/activities      — GET last N activities via the provider
  api/analysis        — POST → AI analysis of last 10 activities
  api/chat            — POST → scoped AI coach reply
  auth-actions.ts     — server actions for signIn / signOut

lib/
  auth.ts             — NextAuth config (Strava provider, JWT, token refresh)
  strava/             — Strava REST provider + Activity types
  ai/                 — Anthropic client, prompts, analysis engine

components/           — UI primitives + feature components
```

## Deploy to Vercel

First-time deploy from your local machine — single command:

```powershell
npm run deploy:setup
```

What it does:
1. Installs the Vercel CLI globally (if not already present).
2. Opens a browser to log into Vercel (if not already logged in).
3. Creates the project on Vercel (or links to an existing one).
4. Reads `AUTH_STRAVA_ID`, `AUTH_STRAVA_SECRET`, `ANTHROPIC_API_KEY` from your local `.env.local` and pushes them to Production, Preview, and Development envs on Vercel.
5. Generates a fresh `AUTH_SECRET` for production (does **not** reuse the dev secret).
6. Deploys to production.
7. Prints the production URL and the exact domain you need to paste into Strava.

After the first run, just use `npm run deploy` for subsequent deploys (skips the env-var step).

To rotate the production `AUTH_SECRET`: `npm run deploy:rotate-secret`.

**Required Strava-side step after the first deploy:** copy the printed Vercel hostname into the **Authorization Callback Domain** field at https://www.strava.com/settings/api → your app. Save. Then sign-in will work.

### Auto-deploy on `git push` (GitHub Actions)

A workflow at `.github/workflows/deploy.yml` runs on every push to `main` (production deploy) and on every pull request (preview deploy with a URL commented onto the PR). It typechecks first, then runs `vercel pull → vercel build → vercel deploy --prebuilt`.

**One-time setup — three GitHub repo secrets to add:**

1. Generate a Vercel access token at https://vercel.com/account/tokens → "Create" → scope: Full account, no expiration (or your preferred lifetime).
2. Add the three secrets on GitHub (repo → Settings → Secrets and variables → Actions → "New repository secret"):

   | Secret name | Value |
   |---|---|
   | `VERCEL_TOKEN` | the token from step 1 |
   | `VERCEL_ORG_ID` | from your local `.vercel/project.json` → `orgId` |
   | `VERCEL_PROJECT_ID` | from your local `.vercel/project.json` → `projectId` |

3. If you've ever connected this repo via the Vercel dashboard's "Git Integration", **disconnect it** (Vercel project → Settings → Git → Disconnect). Otherwise every push triggers two deploys (one from Vercel, one from Actions). The Actions workflow is the canonical path going forward.

After that, every `git push origin main` builds + deploys to production. Every PR gets a preview deploy with the URL posted as a comment.

## Reference & roadmap

- [`docs/strava-swagger.json`](docs/strava-swagger.json) — verbatim Strava API v3 Swagger spec, kept locally so the full endpoint catalogue is in the repo.
- [`docs/strava-api-reference.md`](docs/strava-api-reference.md) — human-readable index keyed to AIthlete features: scope inventory, endpoints currently used, endpoints available, rate limits, key response shapes.
- [`docs/dashboard-roadmap.md`](docs/dashboard-roadmap.md) — phased plan for upgrading the dashboard with the new endpoints, organised by training value and build cost.

## Design system

- **Display type**: Bricolage Grotesque (variable axes for editorial weight)
- **Body type**: Onest
- **Primary**: `coral.500` `#F2541B`
- **Background**: warm cream `#FBF6EE`
- **Layout**: mobile-first, single phone-style column, max 480 px, bottom tab bar
