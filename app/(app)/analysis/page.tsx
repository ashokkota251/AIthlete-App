import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateAnalysis } from "@/lib/ai/analysis";
import { AnalysisView } from "@/components/analysis-view";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const activities = await provider.getRecentActivities(
    session!.stravaAthleteId!,
    10,
  );
  const analysis = await generateAnalysis(activities);

  return <AnalysisView initial={analysis} initialCount={activities.length} />;
}
