import { Sparkles } from "lucide-react";
import { AnalysisRegenerateButton } from "./analysis-regenerate-button";

export function AnalysisHeader() {
  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow flex items-center gap-1.5">
            <Sparkles size={11} className="text-coral" />
            Weekly intelligence
          </div>
          <h1 className="mt-1 font-display font-bold tracking-tight text-[32px] leading-[1] text-ink-900">
            Analysis<span className="text-coral">.</span>
          </h1>
        </div>
        <AnalysisRegenerateButton />
      </div>
      <div className="rule-coral mt-4" />
    </div>
  );
}
