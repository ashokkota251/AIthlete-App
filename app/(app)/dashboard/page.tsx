import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { Card, CardCoral, CardSection } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WeeklyChart } from "@/components/charts/weekly-chart";
import { ActivityIcon } from "@/components/activity-icon";
import { buildWeekStats } from "@/components/dashboard-stats";
import { formatKm, formatDuration, formatDateShort } from "@/lib/format";
import { ArrowUpRight, TrendingUp, TrendingDown, Flame } from "lucide-react";

const WEEKLY_GOAL_KM = 50;

export default async function DashboardPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const athleteId = session!.stravaAthleteId!;
  const [activities, athlete] = await Promise.all([
    provider.getRecentActivities(athleteId, 15),
    provider.getAthleteProfile(athleteId),
  ]);

  const stats = buildWeekStats(activities);
  const goalPct = Math.min(1, stats.totalKm / WEEKLY_GOAL_KM);
  const initials = `${athlete.firstName[0] ?? ""}${athlete.lastName[0] ?? ""}`;
  const today = activities[0] ? new Date(activities[0].startDate) : new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const trendUp = stats.deltaPct >= 0;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <header className="rise flex items-center justify-between">
        <div>
          <div className="eyebrow mb-1">{dateLabel}</div>
          <h1 className="font-display-wide text-[28px] leading-[1] text-ink-900">
            Hey, <span className="text-coral">{athlete.firstName}</span>
          </h1>
        </div>
        <Link href="/profile" aria-label="Profile">
          <Avatar src={athlete.avatarUrl} initials={initials} size={48} ring />
        </Link>
      </header>

      {/* Hero coral card — This week */}
      <CardCoral className="rise delay-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70">
              This Week
            </div>
            <div className="mt-1 flex items-baseline gap-2 nums">
              <span className="font-display-compressed text-[56px] leading-[0.95]">
                {stats.totalKm.toFixed(1)}
              </span>
              <span className="text-base text-white/80 font-medium">km</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-white/90">
              {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="nums font-medium">
                {trendUp ? "+" : ""}
                {stats.deltaPct.toFixed(1)}%
              </span>
              <span className="text-white/70">vs last week</span>
            </div>
          </div>

          <div className="relative">
            <ProgressRing
              value={goalPct}
              size={88}
              strokeWidth={7}
              animateDelay={180}
              track="rgba(255,255,255,0.20)"
            >
              <div className="text-center">
                <div className="font-display-wide text-xl text-white nums leading-none">
                  {Math.round(goalPct * 100)}
                  <span className="text-xs ml-px">%</span>
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/70 mt-1">goal</div>
              </div>
            </ProgressRing>
          </div>
        </div>

        {/* Inline stat ticker */}
        <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-2">
          <Inline value={String(stats.count)} label="sessions" />
          <Inline value={formatDuration(stats.totalSeconds)} label="moving" />
          <Inline value={`${Math.round(stats.totalElevation)}m`} label="elev" />
        </div>
      </CardCoral>

      {/* Weekly chart */}
      <Card className="rise delay-2">
        <CardSection
          label="Weekly Activity"
          trailing={
            <span className="text-[11px] text-ink-400 nums">
              Mo – Su · {formatKm(stats.totalKm * 1000, 1)}
            </span>
          }
        >
          <WeeklyChart data={stats.perDay} />
        </CardSection>
      </Card>

      {/* Two-up: streak + longest */}
      <div className="grid grid-cols-2 gap-3 rise delay-3">
        <Card className="!p-4 flex flex-col gap-3">
          <div className="eyebrow flex items-center gap-1.5">
            <Flame size={11} className="text-coral" /> Streak
          </div>
          <div className="flex items-baseline gap-1 nums">
            <span className="font-display-compressed text-4xl leading-none">{stats.count >= 5 ? "12" : "6"}</span>
            <span className="text-xs text-ink-400">days</span>
          </div>
          <div className="text-[11px] text-ink-500 leading-snug">
            One short day before resetting. Light run keeps it alive.
          </div>
        </Card>

        <Card className="!p-4 flex flex-col gap-3">
          <div className="eyebrow">Longest</div>
          {stats.longest ? (
            <>
              <div className="flex items-baseline gap-1 nums">
                <span className="font-display-compressed text-4xl leading-none">
                  {(stats.longest.distance / 1000).toFixed(1)}
                </span>
                <span className="text-xs text-ink-400">km</span>
              </div>
              <div className="text-[11px] text-ink-500 leading-snug flex items-center gap-1">
                <ActivityIcon type={stats.longest.type} size={12} />
                <span className="truncate">{stats.longest.name}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-ink-400">No activities this week.</div>
          )}
        </Card>
      </div>

      {/* Most active day */}
      {stats.mostActiveDay && stats.mostActiveDay.activity && (
        <Card className="rise delay-4 flex items-center justify-between">
          <div>
            <div className="eyebrow mb-1">Most Active Day</div>
            <div className="flex items-baseline gap-2 nums">
              <span className="font-display-wide text-2xl text-ink-900">
                {stats.mostActiveDay.day === "Mo" ? "Monday" :
                 stats.mostActiveDay.day === "Tu" ? "Tuesday" :
                 stats.mostActiveDay.day === "We" ? "Wednesday" :
                 stats.mostActiveDay.day === "Th" ? "Thursday" :
                 stats.mostActiveDay.day === "Fr" ? "Friday" :
                 stats.mostActiveDay.day === "Sa" ? "Saturday" : "Sunday"}
              </span>
              <span className="text-xs text-ink-400">·</span>
              <span className="text-xs text-ink-500">{formatDateShort(stats.mostActiveDay.activity.startDate)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-500">
              <ActivityIcon type={stats.mostActiveDay.activity.type} size={13} className="text-coral" />
              <span className="truncate">{stats.mostActiveDay.activity.name}</span>
              <span className="text-ink-300">·</span>
              <span className="nums">{(stats.mostActiveDay.km).toFixed(1)} km</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-coral-50 grid place-items-center">
            <span className="font-display-compressed text-2xl text-coral leading-none">
              {Math.round(stats.mostActiveDay.km)}
            </span>
          </div>
        </Card>
      )}

      {/* CTA card → Analysis */}
      <Link href="/analysis" className="block rise delay-5">
        <Card className="flex items-center justify-between hover:shadow-elev transition-shadow group">
          <div>
            <div className="eyebrow mb-1 text-coral">Weekly Intelligence</div>
            <div className="font-display-wide text-lg text-ink-900 leading-tight">
              Read your AI analysis of these {Math.min(activities.length, 10)} sessions
            </div>
            <div className="text-[12px] text-ink-500 mt-1">
              Summary · highlights · what to fix · what to do next
            </div>
          </div>
          <div className="size-10 rounded-full bg-coral text-white grid place-items-center group-hover:scale-105 transition-transform shadow-glow">
            <ArrowUpRight size={18} strokeWidth={2.4} />
          </div>
        </Card>
      </Link>
    </div>
  );
}

function Inline({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display-wide text-base text-white nums leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-white/70 mt-1">{label}</div>
    </div>
  );
}
