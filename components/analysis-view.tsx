"use client";

import { useState, useTransition } from "react";
import { Card, CardCoral, CardSection } from "@/components/ui/card";
import { RefreshCw, Sparkles, Check, AlertTriangle, ArrowRight } from "lucide-react";
import type { AnalysisResult } from "@/lib/ai/analysis";

export function AnalysisView({
  initial,
  initialCount,
}: {
  initial: AnalysisResult;
  initialCount: number;
}) {
  const [data, setData] = useState<AnalysisResult>(initial);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  function regenerate() {
    start(async () => {
      const res = await fetch("/api/analysis", { method: "POST" });
      if (!res.ok) return;
      const json = (await res.json()) as { analysis: AnalysisResult; count: number };
      setData(json.analysis);
      setCount(json.count);
      setUpdatedAt(new Date());
    });
  }

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <header className="rise flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1 flex items-center gap-1.5">
            <Sparkles size={11} className="text-coral" />
            Generated · {count} sessions
            {data.fallback && (
              <span className="ml-2 text-coral-700">· local mode</span>
            )}
          </div>
          <h1 className="font-display font-bold tracking-tight text-[32px] leading-[1] text-ink-900">
            Analysis<span className="text-coral">.</span>
          </h1>
        </div>
        <button
          onClick={regenerate}
          disabled={pending}
          className="btn-ghost !px-3 !py-2 text-xs"
        >
          <RefreshCw size={13} className={pending ? "animate-spin" : ""} />
          <span>{pending ? "Generating" : "Regenerate"}</span>
        </button>
      </header>

      <div className="rule-coral rise delay-1" />

      {/* Summary — bold coral hero */}
      <CardCoral className="rise delay-2">
        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70 mb-3">
          Summary
        </div>
        <p className="text-[15px] leading-relaxed text-white font-medium">
          {data.summary}
        </p>
        {updatedAt && (
          <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-white/70 nums">
            Updated {updatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
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
