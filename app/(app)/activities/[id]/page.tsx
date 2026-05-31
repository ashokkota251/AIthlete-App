import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildBundle } from "@/lib/debrief-service";
import { narrateDebrief, narratePlan } from "@/lib/ai/narrate";
import { BackButton } from "@/components/debrief/back-button";
import { RouteHeader } from "@/components/debrief/route-header";
import { VerdictBanner } from "@/components/debrief/verdict-banner";
import { HeroStats } from "@/components/debrief/hero-stats";
import { PointsList } from "@/components/debrief/points-list";
import { NextActionCard } from "@/components/debrief/next-action-card";
import { AskCoachButton } from "@/components/debrief/ask-coach-button";
import { BodyCheckCard } from "@/components/recovery/body-check-card";
import { SectionHeader } from "@/components/breakdown/section-header";
import { MetricGrid } from "@/components/breakdown/metric-grid";
import { HrCard } from "@/components/breakdown/hr-card";
import { PowerCard } from "@/components/breakdown/power-card";
import { SplitsDetailTable } from "@/components/breakdown/splits-detail-table";
import { RecoveryCard } from "@/components/breakdown/recovery-card";
import { NextRideCard } from "@/components/breakdown/next-ride-card";
import { Skeleton } from "@/components/skeleton";
import { BarChart3, Heart, Zap, ListOrdered } from "lucide-react";

export const dynamic = "force-dynamic";

const SESSION_LABEL: Record<string, string> = {
  recovery: "Recovery",
  endurance: "Endurance",
  tempo: "Tempo",
  threshold: "Threshold",
  intervals: "Intervals",
  long: "Long ride",
  race: "Race",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SharedProps {
  accessToken: string;
  athleteId: string;
  activityId: string;
}

/* ──────────── Streamed block 1 — verdict + hero + points + next action ──── */
async function DebriefBlock({ accessToken, athleteId, activityId }: SharedProps) {
  const { metrics } = await buildBundle(accessToken, athleteId, activityId, true, true);
  const narration = await narrateDebrief(metrics);
  return (
    <>
      <VerdictBanner
        verdict={narration.verdict}
        sentiment={narration.sentiment}
        caption={narration.loadImpact}
      />
      <HeroStats metrics={metrics} />
      {narration.wentWell.length > 0 && (
        <PointsList title="What went well" variant="good" points={narration.wentWell} delay={3} />
      )}
      {narration.toWatch.length > 0 && (
        <PointsList title="What to watch" variant="watch" points={narration.toWatch} delay={4} />
      )}
      <NextActionCard
        title={titleFromNextAction(narration.nextAction)}
        copy={narration.nextAction}
        delay={5}
      />
    </>
  );
}

function DebriefSkeleton() {
  return (
    <>
      <Skeleton className="h-[58px] rounded-[14px]" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-[16px]" />
        ))}
      </div>
      <Skeleton className="h-[150px] rounded-card" />
      <Skeleton className="h-[120px] rounded-card" />
      <Skeleton className="h-[120px] rounded-card" />
    </>
  );
}

/* ──────────── Streamed block 2 — every metric + HR + Power + Splits ───────── */
async function DetailBlock({ accessToken, athleteId, activityId }: SharedProps) {
  const { metrics, streams } = await buildBundle(accessToken, athleteId, activityId, true, true);
  const hasPower = (metrics.normalizedPower ?? 0) > 0;
  const sessionPill = SESSION_LABEL[metrics.sessionType] ?? metrics.sessionType;

  const hrStreamData = streams?.heartrate?.data;
  const hrStream =
    Array.isArray(hrStreamData) && !Array.isArray(hrStreamData[0])
      ? (hrStreamData as number[])
      : undefined;

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted nums">
          {metrics.distanceKm.toFixed(1)} km · {Math.round(metrics.elevationGain)} m climb · {sessionPill.toLowerCase()} session
        </span>
        <span className="font-display font-bold text-[11px] text-white bg-coral px-2.5 py-1.5 rounded-pill shrink-0">
          {sessionPill}
        </span>
      </div>

      <SectionHeader label="Every metric" Icon={BarChart3} delay={1} />
      <MetricGrid metrics={metrics} delay={1} />

      <SectionHeader label="Heart rate" Icon={Heart} delay={2} />
      <HrCard metrics={metrics} hrStream={hrStream} delay={2} />

      {hasPower && (
        <>
          <SectionHeader label="Power · best efforts" Icon={Zap} delay={3} />
          <PowerCard metrics={metrics} delay={3} />
        </>
      )}

      <SectionHeader label="Splits" Icon={ListOrdered} delay={4} />
      <SplitsDetailTable splits={metrics.splits} hasPower={hasPower} delay={4} />
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="h-5 w-2/3" />
      <div className="grid grid-cols-3 gap-2 mt-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-[78px] rounded-[16px]" />
        ))}
      </div>
      <Skeleton className="h-[260px] rounded-card mt-3" />
      <Skeleton className="h-[200px] rounded-card" />
    </>
  );
}

/* ──────────── Streamed block 3 — recovery + next ride plan (AI) ───────────── */
async function PlanBlock({ accessToken, athleteId, activityId }: SharedProps) {
  const { metrics } = await buildBundle(accessToken, athleteId, activityId, true, true);
  const plan = await narratePlan(metrics, null);
  return (
    <>
      <div className="mt-6">
        <RecoveryCard metrics={metrics} deep={plan} delay={7} />
      </div>
      <NextRideCard deep={plan} delay={7} />
    </>
  );
}

function PlanSkeleton() {
  return (
    <>
      <Skeleton className="h-[200px] rounded-card mt-6" />
      <Skeleton className="h-[180px] rounded-card" />
    </>
  );
}

/* ──────────── Page shell ─────────────────────────────────────────────────── */
export default async function ActivityDebriefPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.accessToken) notFound();

  const shared: SharedProps = {
    accessToken: session.accessToken,
    athleteId: session.stravaAthleteId ?? "",
    activityId: id,
  };

  // Quick lookup just for the header (cached by the provider, ~no extra cost
  // because all three Suspense children below reuse this bundle via React.cache).
  const { activity } = await buildBundle(
    shared.accessToken,
    shared.athleteId,
    shared.activityId,
    true,
    true,
  );

  return (
    <div className="space-y-3.5 pb-2">
      <BackButton href="/dashboard" label="Debrief" />

      <RouteHeader
        title={activity.name}
        startDate={activity.startDate}
        typeLabel={activity.type.toLowerCase()}
        polyline={activity.polyline ?? activity.summaryPolyline}
      />

      <Suspense fallback={<DebriefSkeleton />}>
        <DebriefBlock {...shared} />
      </Suspense>

      <AskCoachButton activityName={activity.name} delay={6} />

      <BodyCheckCard
        activityName={activity.name}
        activityType={activity.type}
        delay={6}
      />

      <div className="pt-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="eyebrow flex items-center gap-1.5">
          <BarChart3 size={11} className="text-coral" />
          The detail
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Suspense fallback={<DetailSkeleton />}>
        <DetailBlock {...shared} />
      </Suspense>

      <Suspense fallback={<PlanSkeleton />}>
        <PlanBlock {...shared} />
      </Suspense>

      <p className="text-center text-[11px] text-muted pt-2 pb-1">
        Powered by Strava · {new Date(activity.startDate).getFullYear()}
      </p>
    </div>
  );
}

function titleFromNextAction(s: string): string {
  const split = s.split(/[—:.]/);
  return split[0]?.trim() ?? "Do this next";
}
