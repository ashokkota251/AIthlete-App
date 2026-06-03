"use client";

import { CalendarDays, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { ActivityIcon } from "@/components/activity-icon";
import { GoalProgressRing } from "./goal-progress-ring";
import { GoalTipSection } from "./goal-tip-section";
import { cn } from "@/lib/cn";
import { computeGoalReadiness } from "@/lib/goals/progress";
import { SPORT_LABEL } from "@/lib/goals/sport-map";
import type { Goal } from "@/lib/goals/types";
import type { Activity, ActivityType } from "@/lib/strava/types";

interface Props {
  goal: Goal;
  activities: Activity[];
  athleteId: string;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
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

function eventDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GoalCard({ goal, activities, athleteId, onEdit, onDelete }: Props) {
  const readiness = computeGoalReadiness(goal, activities);
  const unit = goal.metric === "distance" ? "km" : "h";
  const archived = !!goal.archivedAt || readiness.eventPast;

  return (
    <article className={cn("card reveal !p-5", archived && "opacity-70")}>
      {/* Top row: sport + title + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="size-9 rounded-xl bg-coral-50 grid place-items-center text-coral shrink-0">
            <ActivityIcon type={SPORT_TO_ICON_TYPE[goal.sport]} size={16} />
          </span>
          <div className="min-w-0">
            <div className="eyebrow">{SPORT_LABEL[goal.sport]} · event</div>
            <h3 className="mt-0.5 font-display font-bold text-[15px] text-ink-900 leading-snug truncate">
              {goal.title}
            </h3>
            <div className="mt-1 text-[11.5px] text-muted flex items-center gap-1.5 nums">
              <CalendarDays size={11} className="text-ink-300" />
              {eventDateLabel(goal.eventDate)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            aria-label="Edit goal"
            className="size-8 grid place-items-center rounded-pill border border-line text-ink-500 hover:text-ink hover:border-ink-300 transition-colors"
          >
            <Pencil size={13} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            aria-label="Delete goal"
            className="size-8 grid place-items-center rounded-pill border border-line text-ink-500 hover:text-coral hover:border-coral-100 transition-colors"
          >
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Readiness row */}
      <div className="mt-4 flex items-center gap-4">
        <GoalProgressRing
          percent={readiness.readinessRatio}
          size={74}
          subline="READY"
        />
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[13px] text-coral leading-none">
            {readiness.eventPast
              ? "Event passed"
              : readiness.weeksUntilEvent > 0
                ? `${readiness.weeksUntilEvent} week${readiness.weeksUntilEvent === 1 ? "" : "s"} to go`
                : `${readiness.daysUntilEvent} day${readiness.daysUntilEvent === 1 ? "" : "s"} to go`}
          </div>
          <div className="mt-2 font-display font-extrabold text-[24px] leading-none nums">
            {readiness.longestRecent}
            <span className="text-[13px] font-semibold text-muted ml-1.5">
              of {goal.eventTarget} {unit} longest
            </span>
          </div>
          {!archived && (
            <div className="mt-1.5 flex items-center flex-wrap gap-x-3 gap-y-1 text-[11.5px] font-medium text-ink-700">
              <span className="nums">
                <span className="text-muted">Weekly: </span>
                {readiness.weeklyAvg} {unit}
              </span>
              <span className="text-ink-300">·</span>
              <span className="nums">
                {readiness.sessionsPerWeek}/wk
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 nums",
                  readiness.trendUp ? "text-good" : "text-amber",
                )}
              >
                {readiness.trendUp ? (
                  <TrendingUp size={11} strokeWidth={2.6} />
                ) : (
                  <TrendingDown size={11} strokeWidth={2.6} />
                )}
                {readiness.trendUp ? "building" : "flat"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI tip */}
      {!archived && <GoalTipSection goal={goal} athleteId={athleteId} />}
    </article>
  );
}
