"use client";

import { useState } from "react";
import { Check, AlertTriangle, Timer } from "lucide-react";
import { cn } from "@/lib/cn";
import { BODY_AREA_LABELS, STRETCHES_BY_ID } from "@/lib/recovery";

interface Props {
  id: string;
}

export function StretchCard({ id }: Props) {
  const stretch = STRETCHES_BY_ID[id];
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  if (!stretch) {
    return (
      <div className="md-coach-card bg-paper border border-line rounded-card p-3 text-[12px] text-muted">
        Stretch <code className="md-code">{id}</code> not found.
      </div>
    );
  }

  const minutes = (stretch.durationSec * stretch.sides) / 60;
  const durationLine =
    stretch.sides === 2
      ? `${stretch.durationSec}s × 2 sides`
      : `${stretch.durationSec}s hold`;

  return (
    <div
      className={cn(
        "md-coach-card relative rounded-[18px] border bg-paper transition-all",
        done ? "border-good/50 bg-emerald-50/40" : "border-line hover:border-coral-200",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3.5 py-3 flex items-center gap-3"
        aria-expanded={open}
      >
        <span
          className={cn(
            "size-9 rounded-xl grid place-items-center shrink-0 transition-colors",
            done ? "bg-good text-white" : "bg-coral-soft text-coral",
          )}
        >
          {done ? <Check size={16} strokeWidth={2.8} /> : <Timer size={15} strokeWidth={2.2} />}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "font-display font-bold text-[14px] leading-tight",
              done && "line-through text-muted",
            )}
          >
            {stretch.name}
          </div>
          <div className="mt-0.5 text-[11px] text-muted flex items-center gap-1.5 nums">
            <span className="font-semibold">{BODY_AREA_LABELS[stretch.targetArea]}</span>
            <span className="text-[#d8d0c8]">·</span>
            <span>{durationLine}</span>
            {minutes >= 1 && (
              <>
                <span className="text-[#d8d0c8]">·</span>
                <span>~{Math.round(minutes)} min</span>
              </>
            )}
          </div>
        </div>

        <span
          className={cn(
            "text-[18px] text-muted shrink-0 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 -mt-1 space-y-3">
          <p className="text-[12.5px] text-ink leading-relaxed">{stretch.description}</p>

          <ol className="md-coach-stretch-steps">
            {stretch.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {stretch.cautions && stretch.cautions.length > 0 && (
            <div className="rounded-[12px] bg-[#FFF4E6] border border-amber/30 px-3 py-2.5 flex gap-2 items-start">
              <AlertTriangle size={14} strokeWidth={2.4} className="text-amber shrink-0 mt-0.5" />
              <div className="text-[12px] text-[#8a6a40] leading-snug">
                {stretch.cautions.map((c, i) => (
                  <p key={i}>{c}</p>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDone((d) => !d);
            }}
            className={cn(
              "w-full rounded-pill py-2 text-[12.5px] font-display font-semibold transition-colors",
              done
                ? "bg-good text-white"
                : "bg-coral text-white hover:brightness-105",
            )}
          >
            {done ? "Done ✓" : "Mark as done"}
          </button>
        </div>
      )}
    </div>
  );
}
