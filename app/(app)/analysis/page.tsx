import { auth } from "@/lib/auth";
import { AnalysisClient } from "@/components/analysis-client";
import { AnalysisHeader } from "@/components/analysis-header";
import { resolveAthleteId } from "@/lib/athlete-id";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const session = await auth();
  const athleteId = resolveAthleteId(session?.stravaAthleteId);
  return (
    <>
      <AnalysisHeader />
      <AnalysisClient athleteId={athleteId} />
    </>
  );
}
