"use client";

import { useEffect, useState } from "react";
import { VerdictBanner } from "@/components/debrief/verdict-banner";
import { HeroStats } from "@/components/debrief/hero-stats";
import { PointsList } from "@/components/debrief/points-list";
import { NextActionCard } from "@/components/debrief/next-action-card";
import { Skeleton } from "@/components/skeleton";
import { readDebriefEntry, writeDebriefNarration } from "@/lib/ai-cache";
import type { ComputedMetrics, DebriefNarration } from "@/lib/metrics/types";

interface Props {
  activityId: string;
  athleteId: string;
  metrics: ComputedMetrics;
}

function titleFromNextAction(s: string): string {
  const split = s.split(/[—:.]/);
  return split[0]?.trim() ?? "Do this next";
}

export function DebriefAIClient({ activityId, athleteId, metrics }: Props) {
  const [narration, setNarration] = useState<DebriefNarration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readDebriefEntry(athleteId, activityId)?.debrief;
    if (cached) {
      // localStorage is browser-only — server can't pre-seed; one cascading
      // render on mount is the cost of the cache hit avoiding the API call.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNarration(cached);
      return;
    }
    let cancelled = false;
    fetch(`/api/activities/${activityId}/debrief`)
      .then((r) => {
        if (!r.ok) throw new Error(`debrief ${r.status}`);
        return r.json();
      })
      .then((data: { narration: DebriefNarration }) => {
        if (cancelled) return;
        setNarration(data.narration);
        writeDebriefNarration(athleteId, activityId, data.narration);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [activityId, athleteId]);

  if (error && !narration) {
    return (
      <>
        <div className="rounded-card border border-line bg-white/60 px-3.5 py-3 text-[12.5px] leading-snug text-muted">
          Couldn&rsquo;t load the AI debrief — refresh to try again.
        </div>
        <HeroStats metrics={metrics} />
      </>
    );
  }

  if (!narration) {
    return (
      <>
        <Skeleton className="h-[58px] rounded-[14px]" />
        <HeroStats metrics={metrics} />
        <Skeleton className="h-[150px] rounded-card" />
        <Skeleton className="h-[120px] rounded-card" />
        <Skeleton className="h-[120px] rounded-card" />
      </>
    );
  }

  return (
    <>
      <VerdictBanner
        verdict={narration.verdict}
        sentiment={narration.sentiment}
        caption={narration.loadImpact}
      />
      <HeroStats metrics={metrics} />
      {narration.wentWell.length > 0 && (
        <PointsList
          title="What went well"
          variant="good"
          points={narration.wentWell}
          delay={3}
        />
      )}
      {narration.toWatch.length > 0 && (
        <PointsList
          title="What to watch"
          variant="watch"
          points={narration.toWatch}
          delay={4}
        />
      )}
      <NextActionCard
        title={titleFromNextAction(narration.nextAction)}
        copy={narration.nextAction}
        delay={5}
      />
    </>
  );
}
