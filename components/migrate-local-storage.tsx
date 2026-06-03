"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * One-shot migration of `aithlete:*:v2:*` localStorage data into the DB.
 * Runs once per browser per athlete (gated by a `:done` marker key).
 * On success clears the migrated keys and calls router.refresh() so the
 * just-rendered server components re-fetch from the DB.
 */
interface Props {
  athleteId: string;
}

interface GoalShape {
  id: string;
  sport: string;
  metric: string;
  eventTarget: number;
  eventDate: string;
  title: string;
  createdAt: number;
  archivedAt?: number;
}

interface TipsBlob {
  entries?: Record<string, {
    goalId: string;
    date: string;
    tip: unknown;
  }>;
}

interface AnalysisBlob {
  date: string;
  count: number;
  data: unknown;
}

interface DebriefBlob {
  entries?: Record<string, {
    debrief?: unknown;
    plan?: unknown;
    savedAt?: number;
  }>;
}

export function MigrateLocalStorage({ athleteId }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!athleteId) return;
    if (typeof window === "undefined") return;

    const markerKey = `aithlete:migrated:v1:${athleteId}`;
    if (window.localStorage.getItem(markerKey)) return;

    void (async () => {
      try {
        const goalsKey = `aithlete:goals:v2:${athleteId}`;
        const tipsKey = `aithlete:tips:v2:${athleteId}`;
        const analysisKey = `aithlete:analysis:v1:${athleteId}`;
        const debriefKey = `aithlete:debrief:v1:${athleteId}`;

        const goals = parse<GoalShape[]>(goalsKey) ?? [];
        const tipsBlob = parse<TipsBlob>(tipsKey);
        const analysisBlob = parse<AnalysisBlob>(analysisKey);
        const debriefBlob = parse<DebriefBlob>(debriefKey);

        const tips = Object.values(tipsBlob?.entries ?? {}).map((e) => ({
          goalId: e.goalId,
          tipDate: e.date,
          tip: e.tip,
        }));
        const analysis = analysisBlob ? [analysisBlob] : [];
        const debrief = Object.entries(debriefBlob?.entries ?? {}).map(
          ([activityId, entry]) => ({
            activityId,
            debrief: entry.debrief,
            plan: entry.plan,
            savedAt: entry.savedAt,
          }),
        );

        const hasAnything =
          goals.length > 0 || tips.length > 0 || analysis.length > 0 || debrief.length > 0;

        if (hasAnything) {
          const res = await fetch("/api/migrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goals, tips, analysis, debrief }),
          });
          if (!res.ok) {
            // Don't set the marker — we'll retry on the next page load.
            console.error("[migrate] /api/migrate failed", await res.text());
            return;
          }
        }

        window.localStorage.removeItem(goalsKey);
        window.localStorage.removeItem(tipsKey);
        window.localStorage.removeItem(analysisKey);
        window.localStorage.removeItem(debriefKey);
        window.localStorage.setItem(markerKey, String(Date.now()));

        if (hasAnything) router.refresh();
      } catch (err) {
        console.error("[migrate] unexpected failure", err);
      }
    })();
  }, [athleteId, router]);

  return null;
}

function parse<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
