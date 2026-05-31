import { cache } from "react";
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

interface BuildResult {
  activity: DetailedActivity;
  streams: StreamSet | null;
  metrics: ComputedMetrics;
}

// React.cache requires primitive-equal args to dedupe — positional args, not an opts object.
export const buildBundle = cache(
  async (
    accessToken: string,
    athleteId: string,
    activityId: string,
    withStreams: boolean,
    withHistory: boolean,
  ): Promise<BuildResult> => {
    const provider = getStravaProvider({ accessToken });

    const activityPromise = provider.getActivity(activityId);
    const streamsPromise = withStreams
      ? provider
          .getActivityStreams(activityId, [
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
    const profilePromise = provider.getAthleteProfile(athleteId).catch(() => null);
    const historyPromise = withHistory
      ? provider.getRecentActivities(athleteId, 30, 1).catch(() => [])
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
        metrics.readiness = ts.tsb > 5 ? "high" : ts.tsb < -10 ? "low" : "moderate";
      }
    }

    return { activity, streams, metrics };
  },
);

export interface DebriefResult {
  activity: DetailedActivity;
  metrics: ComputedMetrics;
  narration: DebriefNarration;
}

export async function buildDebrief(
  accessToken: string,
  athleteId: string,
  activityId: string,
): Promise<DebriefResult> {
  const bundle = await buildBundle(accessToken, athleteId, activityId, true, false);
  const narration = await narrateDebrief(bundle.metrics);
  return { activity: bundle.activity, metrics: bundle.metrics, narration };
}

export interface DeepDiveResult {
  activity: DetailedActivity;
  streams: StreamSet | null;
  metrics: ComputedMetrics;
  narration: DebriefNarration;
  deep: DeepNarration;
}

export async function buildDeepDive(
  accessToken: string,
  athleteId: string,
  activityId: string,
  goal?: AthleteGoal | null,
): Promise<DeepDiveResult> {
  const bundle = await buildBundle(accessToken, athleteId, activityId, true, true);
  const [narration, deep] = await Promise.all([
    narrateDebrief(bundle.metrics),
    narratePlan(bundle.metrics, goal ?? null),
  ]);
  return { ...bundle, narration, deep };
}
