import Link from "next/link";
import { ArrowUpRight, Target, TrendingUp, TrendingDown } from "lucide-react";
import { ActivityIcon } from "@/components/activity-icon";
import {
  computeTrainingStats,
  fallbackReadinessPercent,
  fallbackSentiment,
  isGoalEventPast,
} from "@/lib/goals/progress";
import { cn } from "@/lib/cn";
import type { Goal, TipSentiment } from "@/lib/goals/types";
import type { Activity, ActivityType } from "@/lib/strava/types";

interface Props {
  goals: Goal[];
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

export function GoalsOverviewCard({ goals, activities }: Props) {
  const active = goals
    .filter((g) => !g.archivedAt && !isGoalEventPast(g))
    .map((g) => {
      const stats = computeTrainingStats(g, activities);
      // Dashboard avoids per-goal AI calls — uses the same heuristic the
      // AI fallback uses so the dot/order are still meaningful.
      const sentiment = fallbackSentiment(stats);
      const percent = fallbackReadinessPercent(stats);
      return { goal: g, stats, sentiment, percent };
    })
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
        {shown.map(({ goal, stats, sentiment, percent }) => (
          <li key={goal.id}>
            <Link
              href="/goals"
              className="flex items-center gap-3 -mx-1 px-1 py-1.5 rounded-[12px] hover:bg-cream-deep/40 transition-colors"
            >
              <span className="size-8 rounded-xl bg-coral-50 grid place-items-center text-coral shrink-0">
                <ActivityIcon
                  type={SPORT_TO_ICON_TYPE[goal.sport]}
                  size={14}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-[13px] text-ink-900 truncate">
                    {goal.title}
                  </span>
                  <span className="font-display font-bold text-[12px] text-coral nums shrink-0">
                    {percent}%
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
                    {stats.totalSessions} sessions · {stats.weeklyHours} h/wk
                  </span>
                  <span className="text-ink-300">·</span>
                  <span className="flex items-center gap-0.5">
                    {stats.trendUp ? (
                      <TrendingUp size={10} strokeWidth={2.6} className="text-good" />
                    ) : (
                      <TrendingDown size={10} strokeWidth={2.6} className="text-amber" />
                    )}
                    {stats.weeksUntilEvent}w
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
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
