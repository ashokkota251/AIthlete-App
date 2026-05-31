import { Sparkles } from "lucide-react";

export function AnalysisHeader() {
  return (
    <div className="space-y-1">
      <div className="eyebrow flex items-center gap-1.5">
        <Sparkles size={11} className="text-coral" />
        Weekly intelligence
      </div>
      <h1 className="font-display font-bold tracking-tight text-[32px] leading-[1] text-ink-900">
        Analysis<span className="text-coral">.</span>
      </h1>
      <div className="rule-coral mt-4" />
    </div>
  );
}
