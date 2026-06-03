"use client";

import { useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { ANALYSIS_REGENERATE_EVENT } from "./analysis-client";

/**
 * Coral icon-only pill matching the activities-list refresh button.
 * Dispatches a window event consumed by <AnalysisClient />, which bypasses
 * the localStorage cache and re-fetches /api/analysis.
 */
export function AnalysisRegenerateButton() {
  const [pending, start] = useTransition();
  const [spinKey, setSpinKey] = useState(0);

  function regenerate() {
    if (pending) return;
    setSpinKey((k) => k + 1);
    start(async () => {
      window.dispatchEvent(new CustomEvent(ANALYSIS_REGENERATE_EVENT));
      // Hold the spinner for at least one cycle so the press feels real.
      await new Promise((r) => setTimeout(r, 800));
    });
  }

  return (
    <button
      type="button"
      onClick={regenerate}
      disabled={pending}
      aria-label="Regenerate analysis"
      className={cn(
        "size-9 grid place-items-center rounded-pill border transition-all shrink-0",
        pending
          ? "bg-coral text-white border-coral shadow-[0_6px_16px_-6px_rgba(242,84,27,0.55)]"
          : "bg-coral-50 text-coral-700 border-coral-100 hover:bg-coral-100",
      )}
    >
      <RefreshCcw
        key={spinKey}
        size={14}
        strokeWidth={2.4}
        className={cn("transition-transform", pending && "animate-spin")}
      />
    </button>
  );
}
