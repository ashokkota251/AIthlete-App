"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { GOAL_SPORTS, SPORT_LABEL } from "@/lib/goals/sport-map";
import { defaultGoalTitle } from "@/lib/goals/progress";
import type { Goal, GoalMetric, GoalSport } from "@/lib/goals/types";

interface Props {
  open: boolean;
  initial?: Goal | null;
  onClose: () => void;
  onSave: (goal: Goal) => void;
}

const METRIC_LABEL: Record<GoalMetric, string> = {
  distance: "Distance",
  time: "Time",
};

const METRIC_UNIT: Record<GoalMetric, string> = {
  distance: "km",
  time: "hours",
};

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function plusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function newGoalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalFormSheet({ open, initial, onClose, onSave }: Props) {
  const [sport, setSport] = useState<GoalSport>("Ride");
  const [metric, setMetric] = useState<GoalMetric>("distance");
  const [eventTarget, setEventTarget] = useState<string>("100");
  const [eventDate, setEventDate] = useState<string>(plusDaysISO(90));
  const [title, setTitle] = useState<string>("");
  const [errors, setErrors] = useState<{ target?: string; date?: string }>({});

  useEffect(() => {
    if (!open) return;
    // Sync form state with the goal-being-edited each time the sheet opens.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initial) {
      setSport(initial.sport);
      setMetric(initial.metric);
      setEventTarget(String(initial.eventTarget));
      setEventDate(initial.eventDate);
      setTitle(initial.title);
    } else {
      setSport("Ride");
      setMetric("distance");
      setEventTarget("100");
      setEventDate(plusDaysISO(90));
      setTitle("");
    }
    setErrors({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetNum = Number(eventTarget);
    const nextErrors: typeof errors = {};
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      nextErrors.target = "Enter a positive number";
    }
    if (!eventDate || eventDate <= todayISO()) {
      nextErrors.date = "Pick a future date";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const trimmedTitle = title.trim();
    const base = { sport, metric, eventTarget: targetNum, eventDate };
    const finalTitle = trimmedTitle || defaultGoalTitle(base);

    const goal: Goal = initial
      ? { ...initial, ...base, title: finalTitle }
      : { id: newGoalId(), ...base, title: finalTitle, createdAt: Date.now() };

    onSave(goal);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-form-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-fadeIn"
      />

      <div className="relative w-full max-w-[480px] md:max-w-[560px] bg-paper rounded-t-[28px] shadow-[0_-12px_40px_-12px_rgba(20,16,8,0.25)] animate-slideUp">
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <div className="eyebrow text-coral">
              {initial ? "Edit goal" : "New event"}
            </div>
            <h2
              id="goal-form-title"
              className="mt-1 font-display font-bold text-[22px] text-ink-900 leading-none"
            >
              What are you preparing for<span className="text-coral">?</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-9 grid place-items-center rounded-pill border border-line text-ink-500 hover:text-ink"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-5 pb-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Sport */}
          <div>
            <label className="eyebrow mb-2 block">Sport</label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_SPORTS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSport(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-pill text-[12px] font-medium border transition-colors",
                    sport === s
                      ? "bg-coral text-white border-coral"
                      : "bg-paper text-ink-700 border-line hover:border-ink-300",
                  )}
                >
                  {SPORT_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Metric */}
          <div>
            <label className="eyebrow mb-2 block">Event type</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-pill bg-cream-deep/60">
              {(Object.keys(METRIC_LABEL) as GoalMetric[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "py-2 rounded-pill text-[12px] font-display font-bold transition-all",
                    metric === m
                      ? "bg-paper text-ink-900 shadow-sm"
                      : "text-ink-500 hover:text-ink",
                  )}
                >
                  {METRIC_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Event target */}
          <div>
            <label htmlFor="goal-target" className="eyebrow mb-2 block">
              Event {metric === "distance" ? "distance" : "duration"}
            </label>
            <div className="relative">
              <input
                id="goal-target"
                type="number"
                inputMode="decimal"
                min={1}
                step={metric === "distance" ? "0.1" : "0.5"}
                value={eventTarget}
                onChange={(e) => setEventTarget(e.target.value)}
                className="w-full px-4 py-3 pr-20 rounded-[14px] border border-line bg-paper font-display font-bold text-[18px] text-ink-900 nums focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-medium text-muted">
                {METRIC_UNIT[metric]}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              What you want to be able to do on event day — e.g. complete a 100&nbsp;km ride.
            </p>
            {errors.target && (
              <p className="mt-1 text-[11px] text-coral-700">{errors.target}</p>
            )}
          </div>

          {/* Event date */}
          <div>
            <label htmlFor="goal-date" className="eyebrow mb-2 block">
              Event date
            </label>
            <input
              id="goal-date"
              type="date"
              min={plusDaysISO(1)}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-[14px] border border-line bg-paper font-display font-bold text-[15px] text-ink-900 nums focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral-50"
            />
            {errors.date && (
              <p className="mt-1 text-[11px] text-coral-700">{errors.date}</p>
            )}
          </div>

          {/* Title (optional) */}
          <div>
            <label htmlFor="goal-title" className="eyebrow mb-2 block">
              Title (optional)
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultGoalTitle({
                sport,
                metric,
                eventTarget: Number(eventTarget) || 0,
                eventDate,
              })}
              className="w-full px-4 py-3 rounded-[14px] border border-line bg-paper text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-pill border border-line bg-paper text-[13px] font-display font-bold text-ink-700 hover:border-ink-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-5 py-3 rounded-pill bg-coral text-white text-[13px] font-display font-bold shadow-[0_6px_16px_-6px_rgba(242,84,27,0.55)] hover:bg-coral-700 transition-colors"
            >
              {initial ? "Save changes" : "Lock it in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
