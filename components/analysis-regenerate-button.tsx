"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Coral icon-only pill matching the activities-list refresh button.
 * Re-runs the analysis server-side via router.refresh, so the streamed
 * <AnalysisBlock> re-renders with a freshly generated narration.
 */
export function AnalysisRegenerateButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [spinKey, setSpinKey] = useState(0);

  function regenerate() {
    if (pending) return;
    setSpinKey((k) => k + 1);
    start(async () => {
      // Force the server route to re-run (busts the React cache for this RSC tree).
      router.refresh();
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
