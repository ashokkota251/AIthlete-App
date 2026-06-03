"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Target } from "lucide-react";
import { ActivityIcon } from "@/components/activity-icon";
import { GoalProgressRing } from "@/components/goals/goal-progress-ring";
import { computeGoalReadiness, computeSentiment } from "@/lib/goals/progress";
import { readGoals } from "@/lib/goals/storage";
import { cn } from "@/lib/cn";
import type { Goal, TipSentiment } from "@/lib/goals/types";
import type { Activity, ActivityType } from "@/lib/strava/types";

interface Props {
  athleteId: string;
  activities: Activity[];
}

const SPORT_TO_ICON_TYPE: Record<Goal["sport"], ActivityType> = {
  Ride: "Ride",
  Run: "Run",
  Swim: "Swim",
  Workout: "Workout",
  WeightTraining: "WeightTraining",
  Hike: "Hike",
  Walk: "Walk",
};

const SENTIMENT_RANK: Record<TipSentiment, number> = {
  at_risk: 0,
  behind: 1,
  building: 2,
  ready: 3,
};

const SENTIMENT_DOT: Record<TipSentiment, string> = {
  ready: "bg-good",
  building: "bg-coral",
  behind: "bg-amber",
  at_risk: "bg-red-500",
};

export function GoalsOverviewCard({ athleteId, activities }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage is browser-only — server can't pre-seed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGoals(readGoals(athleteId));
    setHydrated(true);
  }, [athleteId]);

  if (!hydrated) {
    return (
      <div className="card reveal delay-4 animate-pulse">
        <div className="h-3 w-1/3 bg-cream-deep rounded-md mb-3" />
        <div className="h-12 w-full bg-cream-deep rounded-md" />
      </div>
    );
  }

  const active = goals
    .map((g) => {
      const readiness = computeGoalReadiness(g, activities);
      return { goal: g, readiness, sentiment: computeSentiment(readiness) };
    })
    .filter(({ goal, readiness }) => !goal.archivedAt && !readiness.eventPast)
    .sort((a, b) => SENTIMENT_RANK[a.sentiment] - SENTIMENT_RANK[b.sentiment]);

  if (active.length === 0) {
    return (
      <Link href="/goals" className="block reveal delay-4">
        <div className="card flex items-center justify-between hover:shadow-elev transition-shadow group">
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-coral-50 grid place-items-center text-coral">
              <Target size={16} strokeWidth={2.2} />
            </span>
            <div>
              <div className="eyebrow text-coral">Goals</div>
              <div className="mt-0.5 font-display font-bold text-[15px] text-ink leading-tight">
                Got an event? I&rsquo;ll build the plan
              </div>
            </div>
          </div>
          <span className="size-9 rounded-full bg-coral text-white grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <ArrowUpRight size={15} strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    );
  }

  const shown = active.slice(0, 3);
  const extra = active.length - shown.length;

  return (
    <div className="card reveal delay-4">
      <div className="flex items-center justify-between">
        <div className="eyebrow flex items-center gap-1.5">
          <Target size={11} className="text-coral" />
          Events · {active.length} on the calendar
        </div>
        <Link
          href="/goals"
          className="text-[11.5px] font-display font-bold text-coral-700 hover:text-coral flex items-center gap-1"
        >
          View all
          <ArrowUpRight size={12} strokeWidth={2.6} />
        </Link>
      </div>

      <ul className="mt-3 space-y-3 list-none">
        {shown.map(({ goal, readiness, sentiment }) => {
          const unit = goal.metric === "distance" ? "km" : "h";
          return (
            <li key={goal.id}>
              <Link
                href="/goals"
                className="flex items-center gap-3 -mx-1 px-1 py-1 rounded-[12px] hover:bg-cream-deep/40 transition-colors"
              >
                <GoalProgressRing
                  percent={readiness.readinessRatio}
                  size={42}
                  stroke={5}
                  subline=""
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-md bg-coral-50 grid place-items-center text-coral shrink-0">
                      <ActivityIcon
                        type={SPORT_TO_ICON_TYPE[goal.sport]}
                        size={11}
                      />
                    </span>
                    <span className="font-display font-bold text-[13px] text-ink-900 truncate">
                      {goal.title}
                    </span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-muted flex items-center gap-1.5 nums">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        SENTIMENT_DOT[sentiment],
                      )}
                      aria-hidden
                    />
                    <span>
                      longest {readiness.longestRecent} / {goal.eventTarget} {unit}
                    </span>
                    <span className="text-ink-300">·</span>
                    <span>
                      {readiness.weeksUntilEvent}w to go
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {extra > 0 && (
        <Link
          href="/goals"
          className="mt-3 block text-center text-[11.5px] font-display font-bold text-coral-700 hover:text-coral"
        >
          + {extra} more
        </Link>
      )}
    </div>
  );
}
