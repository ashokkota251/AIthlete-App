import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { buildBundle } from "@/lib/debrief-service";
import { resolveAthleteId } from "@/lib/athlete-id";
import { BackButton } from "@/components/debrief/back-button";
import { RouteHeader } from "@/components/debrief/route-header";
import { AskCoachButton } from "@/components/debrief/ask-coach-button";
import { BodyCheckCard } from "@/components/recovery/body-check-card";
import { SectionHeader } from "@/components/breakdown/section-header";
import { MetricGrid } from "@/components/breakdown/metric-grid";
import { HrCard } from "@/components/breakdown/hr-card";
import { PowerCard } from "@/components/breakdown/power-card";
import { SplitsDetailTable } from "@/components/breakdown/splits-detail-table";
import { DebriefAIClient } from "@/components/debrief/debrief-ai-client";
import { PlanAIClient } from "@/components/debrief/plan-ai-client";
import { BarChart3, Heart, Zap, ListOrdered, Sparkles } from "lucide-react";

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

export default async function ActivityDebriefPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.accessToken) notFound();

  const athleteId = resolveAthleteId(session.stravaAthleteId);
  const provider = getStravaProvider({ accessToken: session.accessToken });

  const [{ activity, metrics, streams }, recent] = await Promise.all([
    buildBundle(session.accessToken, athleteId, id, true, true),
    provider.getRecentActivities(athleteId, 5).catch(() => []),
  ]);

  const isRecent = recent.some((a) => String(a.id) === String(id));
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

      {isRecent ? (
        <DebriefAIClient activityId={id} metrics={metrics} />
      ) : (
        <div className="rounded-card border border-line bg-white/60 px-3.5 py-3 text-[12.5px] leading-snug text-muted flex items-start gap-2.5">
          <Sparkles size={14} className="text-coral shrink-0 mt-0.5" />
          <p>
            AI insights are kept only for your{" "}
            <strong>5 most recent</strong> activities. The metrics below are
            still available.
          </p>
        </div>
      )}

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

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted nums">
          {metrics.distanceKm.toFixed(1)} km ·{" "}
          {Math.round(metrics.elevationGain)} m climb ·{" "}
          {sessionPill.toLowerCase()} session
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

      {isRecent && <PlanAIClient activityId={id} metrics={metrics} />}

      <p className="text-center text-[11px] text-muted pt-2 pb-1">
        Powered by Strava · {new Date(activity.startDate).getFullYear()}
      </p>
    </div>
  );
}
