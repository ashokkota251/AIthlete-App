import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { computeMetrics } from "@/lib/metrics/compute";
import { fallbackDebrief } from "@/lib/ai/debrief-prompts";
import { acuteChronicRatio } from "@/lib/training";
import { LatestDebriefHero } from "@/components/dashboard/latest-debrief-hero";
import { TodayCard } from "@/components/dashboard/today-card";
import { FormLoadCard } from "@/components/dashboard/form-load-card";
import { RoadToGoalCard } from "@/components/dashboard/road-to-goal-card";
import { MotivationStrip } from "@/components/dashboard/motivation-strip";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const athleteId = session!.stravaAthleteId!;

  const [activities, athlete, stats] = await Promise.all([
    provider.getRecentActivities(athleteId, 30),
    provider.getAthleteProfile(athleteId),
    provider.getAthleteStats(athleteId).catch(() => null),
  ]);

  // Deterministic debrief from list-summary fields only — no extra round-trip.
  let latestDebrief = null;
  if (activities[0]) {
    try {
      const metrics = computeMetrics({
        activity: activities[0],
        athleteFtp: athlete.ftp ?? null,
      });
      latestDebrief = {
        activity: activities[0],
        metrics,
        narration: fallbackDebrief(metrics),
      };
    } catch {
      // soft-fail — hide the hero rather than break the dashboard
    }
  }

  const acr = acuteChronicRatio(activities);

  const firstName = athlete.firstName || "Athlete";
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const initial = (firstName[0] ?? "A").toUpperCase();

  return (
    <div className="space-y-3.5 pb-4">
      {/* ── greeting ───────────────────────────────────── */}
      <header className="reveal flex items-center justify-between mt-1 mb-1">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <div className="mt-1 font-display font-bold text-[26px] leading-none">
            Hey, <span className="text-coral">{firstName}</span>
          </div>
        </div>
        <Link
          href="/profile"
          aria-label="Profile"
          className="size-[46px] rounded-full grid place-items-center font-display font-bold text-white text-[17px] shrink-0 border-2 border-white"
          style={{
            background: "linear-gradient(135deg, #FFB78A, #F2541B)",
            boxShadow: "0 6px 18px -10px rgba(196,66,15,.22)",
          }}
        >
          {initial}
        </Link>
      </header>

      {/* ── 1 · latest debrief hero ────────────────────── */}
      {latestDebrief && (
        <LatestDebriefHero
          activityId={latestDebrief.activity.id}
          activityName={latestDebrief.activity.name}
          startDate={latestDebrief.activity.startDate}
          prCount={latestDebrief.activity.prCount}
          metrics={latestDebrief.metrics}
          narration={latestDebrief.narration}
        />
      )}

      {/* ── 2 · today's call ───────────────────────────── */}
      <TodayCard band={acr.band} acrRatio={acr.ratio} readiness="moderate" />

      {/* ── 3 · form & load ────────────────────────────── */}
      <FormLoadCard activities={activities} />

      {/* ── 4 · road to goal ───────────────────────────── */}
      <RoadToGoalCard stats={stats} />

      {/* ── 5 · motivation strip ───────────────────────── */}
      <MotivationStrip activities={activities} />

      {/* ── CTA to weekly analysis ─────────────────────── */}
      <Link href="/analysis" className="block reveal delay-6">
        <div className="card flex items-center justify-between hover:shadow-elev transition-shadow group">
          <div>
            <div className="eyebrow text-coral">Weekly intelligence</div>
            <div className="mt-1 font-display font-bold text-[17px] text-ink leading-tight">
              Read the AI analysis of your last 10 sessions
            </div>
            <div className="mt-1 text-[12px] text-muted">
              Summary · highlights · what to fix · what to do next
            </div>
          </div>
          <span className="size-10 rounded-full bg-coral text-white grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <ArrowUpRight size={18} strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    </div>
  );
}
