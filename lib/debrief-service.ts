import { getStravaProvider } from "@/lib/strava";
import { computeMetrics } from "@/lib/metrics/compute";
import { computeTrainingState } from "@/lib/metrics/training-load";
import { narrateDebrief, narratePlan } from "@/lib/ai/narrate";
import type { AthleteGoal } from "@/lib/ai/debrief-prompts";
import type {
  ComputedMetrics,
  DebriefNarration,
  DeepNarration,
} from "@/lib/metrics/types";
import type { DetailedActivity, StreamSet } from "@/lib/strava/types";

interface BuildOpts {
  accessToken: string;
  athleteId: string;
  activityId: string;
  withStreams?: boolean;
  withHistory?: boolean;
}

interface BuildResult {
  activity: DetailedActivity;
  streams: StreamSet | null;
  metrics: ComputedMetrics;
}

async function buildBundle(opts: BuildOpts): Promise<BuildResult> {
  const provider = getStravaProvider({ accessToken: opts.accessToken });

  const activityPromise = provider.getActivity(opts.activityId);
  const streamsPromise = opts.withStreams
    ? provider
        .getActivityStreams(opts.activityId, [
          "time",
          "heartrate",
          "watts",
          "velocity_smooth",
          "altitude",
          "distance",
          "cadence",
        ])
        .catch(() => null)
    : Promise.resolve(null);
  const zonesPromise = provider.getAthleteZones().catch(() => null);
  const profilePromise = provider.getAthleteProfile(opts.athleteId).catch(() => null);
  const historyPromise = opts.withHistory
    ? provider.getRecentActivities(opts.athleteId, 30, 1).catch(() => [])
    : Promise.resolve(null);

  const [activity, streams, zones, profile, history] = await Promise.all([
    activityPromise,
    streamsPromise,
    zonesPromise,
    profilePromise,
    historyPromise,
  ]);

  const metrics = computeMetrics({
    activity,
    streams,
    zones,
    athleteFtp: profile?.ftp ?? null,
  });

  if (history && history.length > 0) {
    const ts = computeTrainingState(history);
    if (ts) {
      metrics.ctl = ts.ctl;
      metrics.atl = ts.atl;
      metrics.tsb = ts.tsb;
      metrics.acr = ts.acr;
      metrics.trainingStateStatus = "ready";
      metrics.readiness =
        ts.tsb > 5 ? "high" : ts.tsb < -10 ? "low" : "moderate";
    }
  }

  return { activity, streams, metrics };
}

export async function buildMetrics(opts: BuildOpts): Promise<ComputedMetrics> {
  const { metrics } = await buildBundle(opts);
  return metrics;
}

export interface DebriefResult {
  activity: DetailedActivity;
  metrics: ComputedMetrics;
  narration: DebriefNarration;
}

export async function buildDebrief(opts: BuildOpts): Promise<DebriefResult> {
  const bundle = await buildBundle({ ...opts, withStreams: true });
  const narration = await narrateDebrief(bundle.metrics);
  return {
    activity: bundle.activity,
    metrics: bundle.metrics,
    narration,
  };
}

export interface DeepDiveResult {
  activity: DetailedActivity;
  streams: StreamSet | null;
  metrics: ComputedMetrics;
  narration: DebriefNarration;
  deep: DeepNarration;
}

export async function buildDeepDive(
  opts: BuildOpts & { goal?: AthleteGoal | null },
): Promise<DeepDiveResult> {
  const bundle = await buildBundle({ ...opts, withStreams: true, withHistory: true });
  const [narration, deep] = await Promise.all([
    narrateDebrief(bundle.metrics),
    narratePlan(bundle.metrics, opts.goal ?? null),
  ]);
  return { ...bundle, narration, deep };
}
