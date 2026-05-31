import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateAnalysis } from "@/lib/ai/analysis";
import { AnalysisView } from "@/components/analysis-view";
import { AnalysisHeader } from "@/components/analysis-header";
import { AnalysisStreamingSkeleton } from "@/components/analysis-streaming-skeleton";

export const dynamic = "force-dynamic";

async function AnalysisBlock() {
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

export default function AnalysisPage() {
  return (
    <>
      <AnalysisHeader />
      <Suspense fallback={<AnalysisStreamingSkeleton />}>
        <AnalysisBlock />
      </Suspense>
    </>
  );
}
