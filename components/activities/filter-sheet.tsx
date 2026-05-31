"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  type ActivityFilters,
  DEFAULT_FILTERS,
  TYPE_OPTIONS,
  PERIOD_OPTIONS,
  SORT_OPTIONS,
} from "./filter-types";

interface Props {
  open: boolean;
  onClose: () => void;
  filters: ActivityFilters;
  onApply: (next: ActivityFilters) => void;
  resultCount: number;
}

export function FilterSheet({ open, onClose, filters, onApply, resultCount }: Props) {
  // Track the prior `open` to detect transitions in-render — avoids a setState-in-effect.
  const [prevOpen, setPrevOpen] = useState(open);
  const [draft, setDraft] = useState<ActivityFilters>(filters);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setDraft(filters);
  }

  // Lock body scroll while open.
  useEffect(() => {
    if (open) {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-[150] transition-opacity",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <button
        onClick={onClose}
        aria-label="Close filters"
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter & sort activities"
        className={cn(
          "absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[var(--app-max)]",
          "bg-paper rounded-t-[28px] shadow-elev",
          "transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5">
          <span className="block w-10 h-1 rounded-full bg-ink-200" />
        </div>

        <header className="flex items-center justify-between px-5 pt-3 pb-1">
          <div>
            <div className="eyebrow">Refine</div>
            <h2 className="font-display text-2xl font-bold tracking-tight leading-none mt-1">
              Filter &amp; sort<span className="text-coral">.</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-9 rounded-full bg-ink-50 hover:bg-ink-100 text-ink-500 hover:text-ink-900 grid place-items-center transition-colors"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        <div className="px-5 py-4 space-y-5 max-h-[68dvh] overflow-y-auto scroll-hidden">
          <Group label="Activity type">
            <ChipRow
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={(v) => setDraft((d) => ({ ...d, type: v }))}
            />
          </Group>

          <Group label="Period">
            <ChipRow
              options={PERIOD_OPTIONS}
              value={draft.period}
              onChange={(v) => setDraft((d) => ({ ...d, period: v }))}
            />
          </Group>

          <Group label="Sort by">
            <ChipRow
              options={SORT_OPTIONS}
              value={draft.sort}
              onChange={(v) => setDraft((d) => ({ ...d, sort: v }))}
            />
          </Group>
        </div>

        {/* Footer actions */}
        <div className="px-5 pt-2 flex items-center gap-3">
          <button
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className="text-[12px] uppercase tracking-[0.18em] font-semibold text-ink-500 hover:text-ink-900 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <span>Apply</span>
            <span className="text-white/70 nums text-xs">· {resultCount} shown</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="eyebrow px-0.5">{label}</div>
      {children}
    </section>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3.5 py-2 rounded-pill text-sm font-medium transition-all",
              "border",
              active
                ? "bg-coral text-white border-coral shadow-[0_8px_18px_-8px_rgba(242,84,27,0.55)]"
                : "bg-paper text-ink-700 border-ink-100 hover:border-ink-300",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
