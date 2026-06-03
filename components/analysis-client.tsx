"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalysisView } from "@/components/analysis-view";
import { AnalysisStreamingSkeleton } from "@/components/analysis-streaming-skeleton";
import { readAnalysisCache, writeAnalysisCache } from "@/lib/ai-cache";
import type { AnalysisResult } from "@/lib/ai/analysis";

interface Props {
  athleteId: string;
}

export const ANALYSIS_REGENERATE_EVENT = "aithlete:analysis:regenerate";

export function AnalysisClient({ athleteId }: Props) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analysis", { method: "POST" });
      if (!res.ok) throw new Error(`analysis ${res.status}`);
      const json = (await res.json()) as {
        analysis: AnalysisResult;
        count: number;
      };
      setData(json.analysis);
      setCount(json.count);
      writeAnalysisCache(athleteId, json.analysis, json.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    const cached = readAnalysisCache(athleteId);
    if (cached) {
      // localStorage is browser-only — server can't pre-seed; one cascading
      // render on mount is the cost of the cache hit avoiding the API call.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(cached.data);
      setCount(cached.count);
      return;
    }
    fetchFresh();
  }, [athleteId, fetchFresh]);

  useEffect(() => {
    function onRegenerate() {
      fetchFresh();
    }
    window.addEventListener(ANALYSIS_REGENERATE_EVENT, onRegenerate);
    return () =>
      window.removeEventListener(ANALYSIS_REGENERATE_EVENT, onRegenerate);
  }, [fetchFresh]);

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
