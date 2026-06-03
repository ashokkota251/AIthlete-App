import { AnalysisClient } from "@/components/analysis-client";
import { AnalysisHeader } from "@/components/analysis-header";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  return (
    <>
      <AnalysisHeader />
      <AnalysisClient />
    </>
  );
}
