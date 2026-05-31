import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/strava-signin-button";
import { AithleteIcon, StravaGlyph } from "@/components/aithlete-icon";

const STRAVA_ERROR_COPY: Record<string, string> = {
  OAuthCallback:
    "The redirect_uri sent to Strava doesn't match your app's Authorization Callback Domain.",
  OAuthSignin: "Couldn't reach Strava to start the OAuth flow.",
  OAuthAccountNotLinked: "This Strava athlete is already linked to another session.",
  AccessDenied: "You declined to grant Strava access.",
  Configuration: "Auth.js can't read your AUTH_STRAVA_ID / AUTH_STRAVA_SECRET.",
  JwtCallbackError: "We couldn't finalise your session — please try signing in again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  // Healthy session → straight to the app
  if (session?.accessToken) redirect("/dashboard");

  const oauthError = params.error;
  const errorMessage = oauthError ? STRAVA_ERROR_COPY[oauthError] ?? "Please try again." : null;

  return (
    <div
      className="relative flex flex-col px-6 pt-8 pb-6 overflow-hidden"
      style={{ height: "100dvh", minHeight: "100dvh" }}
    >
      <DecorativeRing />

      {errorMessage && (
        <div className="relative z-10 mb-3 rise">
          <div className="rounded-2xl bg-coral-50 border border-coral-200 px-4 py-3 text-[12px] leading-relaxed text-coral-700">
            <strong className="font-semibold">Strava sign-in didn&apos;t complete.</strong>{" "}
            {errorMessage}
          </div>
        </div>
      )}

      {/* Centered hero */}
      <section className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 relative z-10">
        {/* Logo tile */}
        <div className="relative">
          <span
            aria-hidden
            className="absolute -inset-5 rounded-[44px] border border-dashed border-coral/25"
          />
          <div
            className="rounded-[34px] overflow-hidden"
            style={{
              animation:
                "logo-float 5.5s ease-in-out infinite, logo-glow 5.5s ease-in-out infinite",
            }}
          >
            <AithleteIcon size={120} />
          </div>
        </div>

        {/* Wordmark + hairline + tagline */}
        <div className="rise delay-2 text-center">
          <div className="font-display text-[44px] font-bold tracking-tight leading-none">
            AIthlete<span className="text-coral">.</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-ink-200" />
            <span className="text-[10px] uppercase tracking-[0.32em] font-semibold text-ink-500">
              Training intelligence
            </span>
            <span className="h-px w-8 bg-ink-200" />
          </div>
        </div>
      </section>

      {/* Sign-in action */}
      <section className="relative z-10 space-y-4 rise delay-3">
        <div
          className="relative rounded-pill"
          style={{
            boxShadow:
              "0 18px 40px -12px rgba(252,76,2,0.55), 0 4px 14px -4px rgba(252,76,2,0.35)",
          }}
        >
          <SignInButton className="group relative w-full overflow-hidden rounded-pill block active:scale-[0.985] transition-transform">
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, #FF6A1F 0%, #FC4C02 55%, #D63D00 100%)",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1/2 opacity-60 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-pill pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.14)",
              }}
            />
            <span className="relative flex items-center justify-center gap-3 py-4 text-white font-semibold tracking-[-0.005em] text-[15px] pointer-events-none">
              <StravaGlyph size={18} />
              <span>Sign in with Strava</span>
            </span>
          </SignInButton>
        </div>

        <p className="text-[11px] text-ink-400 text-center leading-relaxed max-w-[36ch] mx-auto">
          By continuing you agree to our{" "}
          <em className="not-italic underline decoration-dotted underline-offset-2 text-ink-500">
            terms
          </em>
          . We never store your Strava data — it stays in your session.
        </p>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-5 pt-4 border-t border-ink-100 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] font-semibold text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="text-coral">
            <StravaGlyph size={10} />
          </span>
          Powered by Strava
        </span>
        <span className="nums">© AIthlete · 2026</span>
      </footer>
    </div>
  );
}

/** Atmospheric decorative coral activity rings, anchored off-canvas. */
function DecorativeRing() {
  return (
    <>
      <svg
        aria-hidden
        className="absolute pointer-events-none"
        style={{ right: "-180px", top: "12%", width: "440px", height: "440px", opacity: 0.55 }}
        viewBox="0 0 440 440"
      >
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF8A4D" stopOpacity="0.7" />
            <stop offset="1" stopColor="#F2541B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="220" cy="220" r="200" fill="none" stroke="url(#ring-grad)" strokeWidth="1.5" strokeDasharray="2 6" />
        <circle
          cx="220" cy="220" r="170"
          fill="none" stroke="#F2541B" strokeOpacity="0.18" strokeWidth="14" strokeLinecap="round"
          strokeDasharray="380 700" transform="rotate(-100 220 220)"
        />
      </svg>
      <svg
        aria-hidden
        className="absolute pointer-events-none"
        style={{ left: "-120px", bottom: "10%", width: "260px", height: "260px", opacity: 0.4 }}
        viewBox="0 0 260 260"
      >
        <circle
          cx="130" cy="130" r="120"
          fill="none" stroke="#F2541B" strokeOpacity="0.18" strokeWidth="10" strokeLinecap="round"
          strokeDasharray="180 600" transform="rotate(40 130 130)"
        />
      </svg>
    </>
  );
}
