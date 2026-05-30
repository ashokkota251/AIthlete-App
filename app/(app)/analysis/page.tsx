import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateAnalysis } from "@/lib/ai/analysis";
import { AnalysisView } from "@/components/analysis-view";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const athleteId = session!.stravaAthleteId!;
  const [activities, stats, zones] = await Promise.all([
    provider.getRecentActivities(athleteId, 10),
    provider.getAthleteStats(athleteId).catch(() => null),
    provider.getAthleteZones().catch(() => null),
  ]);
  const analysis = await generateAnalysis(activities, stats, zones);

  return <AnalysisView initial={analysis} initialCount={activities.length} />;
}
