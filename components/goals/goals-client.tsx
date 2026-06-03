"use client";

import { useEffect, useState } from "react";
import { Plus, Target, ChevronDown, ChevronUp } from "lucide-react";
import { GoalCard } from "./goal-card";
import { GoalFormSheet } from "./goal-form-sheet";
import {
  deleteGoal,
  readGoals,
  upsertGoal,
} from "@/lib/goals/storage";
import { computeGoalReadiness } from "@/lib/goals/progress";
import { cn } from "@/lib/cn";
import type { Goal } from "@/lib/goals/types";
import type { Activity } from "@/lib/strava/types";

interface Props {
  athleteId: string;
  activities: Activity[];
}

export function GoalsClient({ athleteId, activities }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    // localStorage is browser-only — server can't pre-seed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGoals(readGoals(athleteId));
    setHydrated(true);
  }, [athleteId]);

  function handleCreate() {
    setEditing(null);
    setSheetOpen(true);
  }
  function handleEdit(goal: Goal) {
    setEditing(goal);
    setSheetOpen(true);
  }
  function handleDelete(goal: Goal) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${goal.title}"?`)) return;
    setGoals(deleteGoal(athleteId, goal.id));
  }
  function handleSave(goal: Goal) {
    setGoals(upsertGoal(athleteId, goal));
    setSheetOpen(false);
    setEditing(null);
  }

  // Partition active vs archived (manually archived OR event date passed).
  const active: Goal[] = [];
  const archived: Goal[] = [];
  for (const g of goals) {
    const r = computeGoalReadiness(g, activities);
    if (g.archivedAt || r.eventPast) archived.push(g);
    else active.push(g);
  }

  if (!hydrated) {
    return (
      <div className="space-y-3 mt-5">
        {[0, 1].map((i) => (
          <div key={i} className="card !p-5 animate-pulse">
            <div className="h-4 w-1/3 bg-cream-deep rounded-md mb-3" />
            <div className="h-3 w-2/3 bg-cream-deep rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (active.length === 0 && archived.length === 0) {
    return (
      <>
        <EmptyState onCreate={handleCreate} />
        <GoalFormSheet
          open={sheetOpen}
          initial={editing}
          onClose={() => {
            setSheetOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mt-1">
        <span className="eyebrow">
          {active.length} active · {archived.length} archived
        </span>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-coral text-white text-[12px] font-display font-bold shadow-[0_6px_16px_-6px_rgba(242,84,27,0.55)] hover:bg-coral-700 transition-colors"
        >
          <Plus size={13} strokeWidth={2.8} />
          New goal
        </button>
      </div>

      {/* Active */}
      <div className="space-y-3 mt-4">
        {active.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            activities={activities}
            athleteId={athleteId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowArchive((v) => !v)}
            className="w-full flex items-center justify-between px-2 py-2 text-ink-700 hover:text-ink transition-colors"
          >
            <span className="eyebrow">Archived ({archived.length})</span>
            {showArchive ? (
              <ChevronUp size={14} strokeWidth={2.4} />
            ) : (
              <ChevronDown size={14} strokeWidth={2.4} />
            )}
          </button>
          <div className={cn("space-y-3", showArchive ? "mt-2" : "hidden")}>
            {archived.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                activities={activities}
                athleteId={athleteId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      <GoalFormSheet
        open={sheetOpen}
        initial={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-5 card-coral text-center py-10 px-6 flex flex-col items-center gap-4">
      <span className="size-14 rounded-2xl bg-white/15 grid place-items-center text-white">
        <Target size={22} strokeWidth={2} />
      </span>
      <div>
        <h2 className="font-display font-bold text-white text-[20px] leading-tight">
          Set your first goal
        </h2>
        <p className="mt-1.5 text-white/80 text-[13px] leading-relaxed max-w-[34ch] mx-auto">
          Tell me what you&rsquo;re chasing and I&rsquo;ll keep you honest with
          daily check-ins.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="px-5 py-3 rounded-pill bg-white text-coral text-[13px] font-display font-bold shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)] hover:bg-cream transition-colors flex items-center gap-1.5"
      >
        <Plus size={14} strokeWidth={2.8} />
        Create a goal
      </button>
    </div>
  );
}
