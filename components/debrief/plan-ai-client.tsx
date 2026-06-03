"use client";

import { useEffect, useState } from "react";
import { RecoveryCard } from "@/components/breakdown/recovery-card";
import { NextRideCard } from "@/components/breakdown/next-ride-card";
import { Skeleton } from "@/components/skeleton";
import type { ComputedMetrics, DeepNarration } from "@/lib/metrics/types";

interface Props {
  activityId: string;
  metrics: ComputedMetrics;
}

export function PlanAIClient({ activityId, metrics }: Props) {
  const [plan, setPlan] = useState<DeepNarration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activities/${activityId}/plan`)
      .then((r) => {
        if (!r.ok) throw new Error(`plan ${r.status}`);
        return r.json();
      })
      .then((data: { deep: DeepNarration }) => {
        if (cancelled) return;
        setPlan(data.deep);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (error && !plan) {
    return (
      <div className="mt-6 rounded-card border border-line bg-white/60 px-3.5 py-3 text-[12.5px] leading-snug text-muted">
        Couldn&rsquo;t load the AI plan — refresh to try again.
      </div>
    );
  }

  if (!plan) {
    return (
      <>
        <Skeleton className="h-[200px] rounded-card mt-6" />
        <Skeleton className="h-[180px] rounded-card" />
      </>
    );
  }

  return (
    <>
      <div className="mt-6">
        <RecoveryCard metrics={metrics} deep={plan} delay={7} />
      </div>
      <NextRideCard deep={plan} delay={7} />
    </>
  );
}
