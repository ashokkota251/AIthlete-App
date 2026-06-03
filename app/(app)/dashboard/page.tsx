import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { resolveAthleteId } from "@/lib/athlete-id";
import type { AthleteProfile } from "@/lib/strava/types";
import { computeMetrics } from "@/lib/metrics/compute";
import { fallbackDebrief } from "@/lib/ai/debrief-prompts";
import { acuteChronicRatio } from "@/lib/training";
import { LatestDebriefHero } from "@/components/dashboard/latest-debrief-hero";
import { TodayCard } from "@/components/dashboard/today-card";
import { GoalsOverviewCard } from "@/components/dashboard/goals-overview-card";
import { MotivationStrip } from "@/components/dashboard/motivation-strip";
import { Avatar } from "@/components/ui/avatar";
import { ArrowUpRight, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const athleteId = resolveAthleteId(session?.stravaAthleteId);
  const sessionName = session?.user?.name ?? "Athlete";

  const [activities, athlete] = await Promise.all([
    provider.getRecentActivities(athleteId, 30).catch(() => [] as never[]),
    provider.getAthleteProfile(athleteId).catch(
      (): AthleteProfile => ({
        id: athleteId,
        stravaAthleteId: athleteId,
        firstName: sessionName.split(/\s+/)[0] ?? "Athlete",
        lastName: sessionName.split(/\s+/).slice(1).join(" "),
        username: "",
        avatarUrl: session?.user?.image ?? null,
      }),
    ),
  ]);
  const stravaOffline = activities.length === 0;

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
        <Link href="/profile" aria-label="Profile" className="shrink-0">
          <Avatar
            src={athlete.avatarUrl}
            initials={`${firstName[0] ?? ""}${(athlete.lastName?.[0] ?? "")}`.toUpperCase()}
            size={46}
            ring
          />
        </Link>
      </header>

      {stravaOffline && (
        <div className="reveal flex items-start gap-2.5 rounded-card border border-amber/30 bg-[#FFF4E6] px-3.5 py-3 text-[12.5px] leading-snug text-[#8a6a40]">
          <AlertTriangle size={16} strokeWidth={2.4} className="text-amber shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-display font-bold text-[13px] text-[#7a5a30]">
              Strava is unreachable
            </div>
            <p className="mt-0.5">
              We couldn&rsquo;t pull your recent activities just now — usually a
              transient blip on their end. Refresh in a minute.
            </p>
          </div>
        </div>
      )}

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

      {/* ── 3 · goals overview ─────────────────────────── */}
      <GoalsOverviewCard athleteId={athleteId} activities={activities} />

      {/* ── 4 · motivation strip ───────────────────────── */}
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
