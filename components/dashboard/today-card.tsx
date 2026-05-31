import { CircleDot } from "lucide-react";
import type { ComputedMetrics } from "@/lib/metrics/types";

interface Props {
  /** if present, lets us speak in concrete terms — overload, sweet, etc. */
  acrRatio?: number;
  band?: "detrained" | "sweet" | "build" | "overload";
  readiness: "low" | "moderate" | "high";
  metrics?: ComputedMetrics | null;
}

interface Recommendation {
  title: string;
  sub: string;
  reasonStart: string;
  reasonBold: string;
  reasonEnd: string;
}

function pick(props: Props): Recommendation {
  const { band, acrRatio, readiness } = props;

  if (band === "overload" || readiness === "low") {
    const overPct = acrRatio ? `${Math.round((acrRatio - 1) * 100)}%` : "above";
    return {
      title: "Recovery day",
      sub: "Easy 30–40 min spin, or rest.",
      reasonStart: "You're carrying fatigue — load is ",
      reasonBold: `${overPct} above`,
      reasonEnd: " your 4-week normal. Keep it light today and tomorrow.",
    };
  }

  if (band === "build") {
    return {
      title: "Steady aerobic day",
      sub: "60–75 min Zone 2 — conversational pace only.",
      reasonStart: "Building load — adding aerobic volume now ",
      reasonBold: "without spiking ATL",
      reasonEnd: " consolidates fitness gains.",
    };
  }

  if (band === "detrained") {
    return {
      title: "Re-entry day",
      sub: "Easy 40–50 min · build the rhythm back.",
      reasonStart: "Your acute load is ",
      reasonBold: "below baseline",
      reasonEnd: ". Rebuild gradually — no spike sessions yet.",
    };
  }

  // sweet / unknown
  return {
    title: "Quality day",
    sub: "Tempo or threshold block · 60 min.",
    reasonStart: "Form is in the sweet spot — ",
    reasonBold: "fitness adapting",
    reasonEnd: " under matched stress. Now's the moment to push.",
  };
}

export function TodayCard(props: Props) {
  const rec = pick(props);

  return (
    <div className="card reveal delay-2">
      <div className="eyebrow">Today</div>

      <div className="mt-3 flex items-center gap-3">
        <div className="size-[42px] rounded-[13px] bg-coral-soft grid place-items-center shrink-0">
          <CircleDot size={20} className="text-coral" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[17px] leading-tight">{rec.title}</div>
          <div className="mt-0.5 text-[13px] text-muted leading-[1.4]">{rec.sub}</div>
        </div>
      </div>

      <p
        className="mt-3 text-[12.5px] text-ink-700 bg-coral-soft/60 rounded-[12px] px-3 py-2.5 leading-[1.5]"
      >
        {rec.reasonStart}
        <b className="text-coral font-bold">{rec.reasonBold}</b>
        {rec.reasonEnd}
      </p>
    </div>
  );
}
