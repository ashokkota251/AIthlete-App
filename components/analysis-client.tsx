"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalysisView } from "@/components/analysis-view";
import { AnalysisStreamingSkeleton } from "@/components/analysis-streaming-skeleton";
import type { AnalysisResult } from "@/lib/ai/analysis";

export const ANALYSIS_REGENERATE_EVENT = "aithlete:analysis:regenerate";

export function AnalysisClient() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (fresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analysis${fresh ? "?fresh=1" : ""}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`analysis ${res.status}`);
      const json = (await res.json()) as {
        analysis: AnalysisResult;
        count: number;
      };
      setData(json.analysis);
      setCount(json.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fire the initial fetch — setState happens inside load() but is the
    // intended one-time cascade on mount, same pattern as the other clients.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
  }, [load]);

  useEffect(() => {
    function onRegenerate() {
      load(true);
    }
    window.addEventListener(ANALYSIS_REGENERATE_EVENT, onRegenerate);
    return () =>
      window.removeEventListener(ANALYSIS_REGENERATE_EVENT, onRegenerate);
  }, [load]);

  if (error && !data) {
    return (
      <div className="mt-5 rounded-card border border-line bg-white/60 px-3.5 py-3 text-[12.5px] leading-snug text-muted">
        Couldn&rsquo;t load the analysis — try the refresh button above.
      </div>
    );
  }

  if (loading || !data) {
    return <AnalysisStreamingSkeleton />;
  }

  return <AnalysisView initial={data} initialCount={count} />;
}
