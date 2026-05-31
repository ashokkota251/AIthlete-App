import { Card, CardCoral, CardSection } from "@/components/ui/card";
import { Check, AlertTriangle, ArrowRight } from "lucide-react";
import type { AnalysisResult } from "@/lib/ai/analysis";

export function AnalysisView({
  initial,
  initialCount,
}: {
  initial: AnalysisResult;
  initialCount: number;
}) {
  const data = initial;
  const count = initialCount;

  return (
    <div className="space-y-5 pb-2 pt-2">
      <div className="flex items-center gap-2 text-[11px] text-muted nums">
        <span className="size-1 rounded-full bg-coral/60" aria-hidden />
        <span className="uppercase tracking-[0.14em] font-semibold">
          Generated · {count} sessions
        </span>
        {data.fallback && (
          <span className="ml-1 text-coral-700 uppercase tracking-[0.14em] font-semibold">
            · local mode
          </span>
        )}
      </div>

      {/* Summary — bold coral hero */}
      <CardCoral className="rise delay-2">
        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70 mb-3">
          Summary
        </div>
        <p className="text-[15px] leading-relaxed text-white font-medium">
          {data.summary}
        </p>
      </CardCoral>

      {/* Highlights */}
      <Card className="rise delay-3">
        <CardSection label="Highlights · the wins">
          <ul className="space-y-3 list-none">
            {data.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 size-6 rounded-full bg-coral-50 grid place-items-center">
                  <Check size={13} className="text-coral" strokeWidth={2.6} />
                </span>
                <span className="text-[14px] leading-relaxed text-ink-700">{h}</span>
              </li>
            ))}
          </ul>
        </CardSection>
      </Card>

      {/* Improvements */}
      <Card className="rise delay-4">
        <CardSection label="Where it's slipping">
          <ul className="space-y-3 list-none">
            {data.improvements.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 size-6 rounded-full bg-cream-deep grid place-items-center">
                  <AlertTriangle size={12} className="text-ink-700" strokeWidth={2.4} />
                </span>
                <span className="text-[14px] leading-relaxed text-ink-700">{h}</span>
              </li>
            ))}
          </ul>
        </CardSection>
      </Card>

      {/* Suggestions — numbered editorial style */}
      <section className="rise delay-5 space-y-2">
        <div className="eyebrow px-1">Do this next</div>
        <div className="space-y-2">
          {data.suggestions.map((s, i) => (
            <div key={i} className="card !p-4 flex items-start gap-4">
              <span className="idx text-[28px] leading-none nums shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] leading-relaxed text-ink-700 flex-1 pt-1">
                {s}
              </span>
              <ArrowRight size={14} className="text-ink-300 mt-2 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      <p className="rise delay-6 text-center text-[11px] text-ink-400 pt-2 leading-relaxed">
        AI guidance based on your last {count} activities · not medical advice
      </p>
    </div>
  );
}
