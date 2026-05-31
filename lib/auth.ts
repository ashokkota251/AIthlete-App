import NextAuth, { type NextAuthConfig } from "next-auth";

const STRAVA_AUTH_URL = "https://www.strava.com/api/v3/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";
const STRAVA_ATHLETE_URL = "https://www.strava.com/api/v3/athlete";

async function refreshStravaToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: process.env.AUTH_STRAVA_ID ?? "",
    client_secret: process.env.AUTH_STRAVA_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strava refresh ${res.status}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
  };
}

/**
 * Custom Strava OAuth provider.
 *
 * Strava's token endpoint returns a non-RFC-6749 body — it includes an extra
 * top-level `athlete` field, omits `scope`, and its error responses don't use
 * the standard {error,error_description} envelope. The strict `oauth4webapi`
 * library that Auth.js v5 uses internally rejects these with
 * `OperationProcessingError`. The `conform` hook lets us rewrite the response
 * into a shape oauth4webapi accepts.
 */
const StravaProvider: NextAuthConfig["providers"][number] = {
  id: "strava",
  name: "Strava",
  type: "oauth",
  authorization: {
    url: STRAVA_AUTH_URL,
    params: {
      // profile:read_all is needed for GET /athlete/zones (time-in-zone panel)
      scope: "read,activity:read_all,profile:read_all",
      approval_prompt: "auto",
      response_type: "code",
    },
  },
  token: {
    url: STRAVA_TOKEN_URL,
    async conform(response: Response): Promise<Response> {
      const raw = await response.clone().text();

      if (!response.ok) {
        console.error("[strava/token] failed:", response.status, raw.slice(0, 300));
        // Repackage Strava's non-standard error body into an RFC-compliant one.
        return new Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description: raw.slice(0, 300) || `Strava returned ${response.status}`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(raw);
      } catch {
        // not JSON — bubble up an error oauth4webapi can show
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Strava returned non-JSON" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Build a strictly conformant token response. Drop the non-standard
      // `athlete` field — we'll fetch it via the userinfo step below, and the
      // raw athlete is also available via the userinfo endpoint at any time.
      const conformant = {
        access_token: data.access_token,
        token_type: data.token_type ?? "Bearer",
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: "read,activity:read_all",
      };

      return new Response(JSON.stringify(conformant), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  },
  userinfo: STRAVA_ATHLETE_URL,
  clientId: process.env.AUTH_STRAVA_ID,
  clientSecret: process.env.AUTH_STRAVA_SECRET,
  // Strava requires client credentials in the POST body, not HTTP Basic auth.
  client: { token_endpoint_auth_method: "client_secret_post" },
  // PKCE only — Strava's `state` round-trip is unreliable.
  checks: ["pkce"],
  profile(profile: { id: number | string; firstname?: string; lastname?: string; profile?: string; username?: string }) {
    return {
      id: String(profile.id),
      name:
        `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim() ||
        `Athlete ${profile.id}`,
      email: null,
      image: profile.profile ?? null,
    };
  },
};

/* ----------------------------- Config ------------------------------------ */
export const authConfig: NextAuthConfig = {
  providers: [StravaProvider],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/signin", error: "/signin" },
  trustHost: true,
  debug: false,

  callbacks: {
    async jwt({ token, account, profile }) {
      try {
        if (account?.provider === "strava") {
          const p = profile as
            | { id?: number | string; username?: string }
            | undefined;

          token.stravaAthleteId = String(p?.id ?? account.providerAccountId ?? "");
          token.athleteUsername = p?.username;
          token.accessToken = account.access_token as string | undefined;
          token.refreshToken = account.refresh_token as string | undefined;
          token.expiresAt = account.expires_at as number | undefined;
          return token;
        }

        if (
          token.expiresAt &&
          token.refreshToken &&
          Date.now() / 1000 > Number(token.expiresAt) - 60
        ) {
          const fresh = await refreshStravaToken(String(token.refreshToken));
          token.accessToken = fresh.access_token;
          token.refreshToken = fresh.refresh_token;
          token.expiresAt = fresh.expires_at;
        }

        return token;
      } catch (err) {
        console.error("[auth/jwt] failed:", err);
        token.error = "JwtCallbackError";
        return token;
      }
    },

    async session({ session, token }) {
      session.stravaAthleteId = token.stravaAthleteId as string | undefined;
      session.athleteUsername = token.athleteUsername as string | undefined;
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      if (session.user && typeof token.stravaAthleteId === "string") {
        session.user.id = token.stravaAthleteId;
      }
      return session;
    },

    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isPublic =
        path === "/signin" ||
        path === "/terms" ||
        path === "/privacy" ||
        path === "/contact" ||
        path.startsWith("/api/auth") ||
        path.startsWith("/_next") ||
        path === "/favicon.ico";
      if (isPublic) return true;
      return Boolean(auth);
    },
  },

};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
