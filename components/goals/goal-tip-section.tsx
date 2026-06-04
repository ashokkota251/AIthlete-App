"use client";

import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/cn";
import type { GoalTip, TipSentiment } from "@/lib/goals/types";

interface Props {
  /** Null while the parent is still fetching. */
  tip: GoalTip | null;
}

const SENTIMENT_STYLES: Record<
  TipSentiment,
  { dot: string; chip: string; label: string }
> = {
  ready: { dot: "bg-good", chip: "bg-good/10 text-good", label: "Event-ready" },
  building: { dot: "bg-coral", chip: "bg-coral-50 text-coral-700", label: "Building" },
  behind: { dot: "bg-amber", chip: "bg-amber/10 text-[#8a6a40]", label: "Behind" },
  at_risk: { dot: "bg-red-500", chip: "bg-red-50 text-red-700", label: "At risk" },
};

export function GoalTipSection({ tip }: Props) {
  if (!tip) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  const styles = SENTIMENT_STYLES[tip.sentiment];

  return (
    <div className="mt-4 space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden />
          <span
            className={cn(
              "px-2 py-0.5 rounded-pill text-[10px] font-display font-bold uppercase tracking-[0.12em]",
              styles.chip,
            )}
          >
            {styles.label}
          </span>
        </div>
        <p className="font-display font-bold text-[14px] text-ink-900 leading-snug">
          {tip.headline}
        </p>
      </div>

      <p className="text-[13px] text-ink-700 leading-relaxed">{tip.status}</p>

      {tip.actions.length > 0 && (
        <div>
          <div className="eyebrow mb-1.5 flex items-center gap-1.5">
            <Sparkles size={10} className="text-coral" />
            Do this
          </div>
          <ul className="space-y-1.5 list-none">
            {tip.actions.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12.5px] text-ink-700 leading-relaxed"
              >
                <ArrowRight
                  size={12}
                  className="text-coral mt-1 shrink-0"
                  strokeWidth={2.6}
                />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tip.improve && (
        <div className="rounded-[10px] bg-cream-deep/60 px-3 py-2.5 flex items-start gap-2">
          <Lightbulb
            size={13}
            className="text-coral shrink-0 mt-0.5"
            strokeWidth={2.4}
          />
          <p className="text-[12px] text-ink-700 leading-relaxed">{tip.improve}</p>
        </div>
      )}
    </div>
  );
}
