import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildDeepDive } from "@/lib/debrief-service";
import { BackButton } from "@/components/debrief/back-button";
import { RouteHeader } from "@/components/debrief/route-header";
import { VerdictBanner } from "@/components/debrief/verdict-banner";
import { HeroStats } from "@/components/debrief/hero-stats";
import { PointsList } from "@/components/debrief/points-list";
import { NextActionCard } from "@/components/debrief/next-action-card";
import { AskCoachButton } from "@/components/debrief/ask-coach-button";
import { SectionHeader } from "@/components/breakdown/section-header";
import { MetricGrid } from "@/components/breakdown/metric-grid";
import { HrCard } from "@/components/breakdown/hr-card";
import { PowerCard } from "@/components/breakdown/power-card";
import { SplitsDetailTable } from "@/components/breakdown/splits-detail-table";
import { RecoveryCard } from "@/components/breakdown/recovery-card";
import { NextRideCard } from "@/components/breakdown/next-ride-card";
import { BarChart3, Heart, Zap, ListOrdered } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const SESSION_LABEL: Record<string, string> = {
  recovery: "Recovery",
  endurance: "Endurance",
  tempo: "Tempo",
  threshold: "Threshold",
  intervals: "Intervals",
  long: "Long ride",
  race: "Race",
};

export default async function ActivityDebriefPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.accessToken) notFound();

  let result;
  try {
    result = await buildDeepDive({
      accessToken: session.accessToken,
      athleteId: session.stravaAthleteId ?? "",
      activityId: id,
    });
  } catch {
    notFound();
  }

  const { activity, streams, metrics, narration, deep } = result;
  const hasPower = (metrics.normalizedPower ?? 0) > 0;
  const sessionPill = SESSION_LABEL[metrics.sessionType] ?? metrics.sessionType;

  const hrStreamData = streams?.heartrate?.data;
  const hrStream =
    Array.isArray(hrStreamData) && !Array.isArray(hrStreamData[0])
      ? (hrStreamData as number[])
      : undefined;

  return (
    <div className="space-y-3.5 pb-2">
      <BackButton href="/dashboard" label="Debrief" />

      <RouteHeader
        title={activity.name}
        startDate={activity.startDate}
        typeLabel={activity.type.toLowerCase()}
        polyline={activity.polyline ?? activity.summaryPolyline}
      />

      <VerdictBanner
        verdict={narration.verdict}
        sentiment={narration.sentiment}
        caption={narration.loadImpact}
      />

      <HeroStats metrics={metrics} />

      {narration.wentWell.length > 0 && (
        <PointsList
          title="What went well"
          variant="good"
          points={narration.wentWell}
          delay={3}
        />
      )}

      {narration.toWatch.length > 0 && (
        <PointsList
          title="What to watch"
          variant="watch"
          points={narration.toWatch}
          delay={4}
        />
      )}

      <NextActionCard
        title={titleFromNextAction(narration.nextAction)}
        copy={narration.nextAction}
        delay={5}
      />

      <AskCoachButton activityName={activity.name} delay={6} />

      {/* ── Detail break ────────────────────────────────────────────── */}
      <div className="pt-3 flex items-center gap-3 reveal delay-6">
        <span className="h-px flex-1 bg-line" />
        <span className="eyebrow flex items-center gap-1.5">
          <BarChart3 size={11} className="text-coral" />
          The detail
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Session pill — quick context for the lower sections */}
      <div className="flex items-center justify-between reveal delay-7">
        <span className="text-[12px] text-muted nums">
          {metrics.distanceKm.toFixed(1)} km · {Math.round(metrics.elevationGain)} m climb · {sessionPill.toLowerCase()} session
        </span>
        <span className="font-display font-bold text-[11px] text-white bg-coral px-2.5 py-1.5 rounded-pill shrink-0">
          {sessionPill}
        </span>
      </div>

      {/* Every metric grid */}
      <SectionHeader label="Every metric" Icon={BarChart3} delay={7} />
      <MetricGrid metrics={metrics} delay={7} />

      {/* Heart rate */}
      <SectionHeader label="Heart rate" Icon={Heart} delay={8} />
      <HrCard metrics={metrics} hrStream={hrStream} delay={8} />

      {/* Power (only if available) */}
      {hasPower && (
        <>
          <SectionHeader label="Power · best efforts" Icon={Zap} delay={8} />
          <PowerCard metrics={metrics} delay={8} />
        </>
      )}

      {/* Splits with climb */}
      <SectionHeader label="Splits" Icon={ListOrdered} delay={8} />
      <SplitsDetailTable splits={metrics.splits} hasPower={hasPower} delay={8} />

      {/* Recovery */}
      <div className="mt-6">
        <RecoveryCard metrics={metrics} deep={deep} delay={8} />
      </div>

      {/* Next ride plan */}
      <NextRideCard deep={deep} delay={8} />

      <p className="reveal delay-8 text-center text-[11px] text-muted pt-2 pb-1">
        Powered by Strava · {new Date(activity.startDate).getFullYear()}
      </p>
    </div>
  );
}

function titleFromNextAction(s: string): string {
  const split = s.split(/[—:.]/);
  return split[0]?.trim() ?? "Do this next";
}
