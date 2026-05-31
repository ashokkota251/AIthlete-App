import Link from "next/link";
import { ArrowRight, Check, AlertTriangle, Flame } from "lucide-react";
import type { ComputedMetrics, DebriefNarration, SessionType } from "@/lib/metrics/types";
import { formatDuration, formatRelative } from "@/lib/format";

interface Props {
  activityId: string;
  activityName: string;
  startDate: string;
  prCount?: number;
  metrics: ComputedMetrics;
  narration: DebriefNarration;
}

const SENTIMENT_CHIP = {
  nailed_it: { label: "Nailed it", Icon: Check },
  solid: { label: "Solid", Icon: Check },
  off_target: { label: "Off target", Icon: AlertTriangle },
  red_flag: { label: "Red flag", Icon: AlertTriangle },
} as const;

const SESSION_LABEL: Record<SessionType, string> = {
  recovery: "Recovery",
  endurance: "Endurance",
  tempo: "Tempo",
  threshold: "Threshold",
  intervals: "Intervals",
  long: "Long ride",
  race: "Race effort",
};

export function LatestDebriefHero({
  activityId,
  activityName,
  startDate,
  prCount,
  metrics,
  narration,
}: Props) {
  const chip = SENTIMENT_CHIP[narration.sentiment];

  return (
    <Link
      href={`/activities/${activityId}`}
      className="card-coral block reveal relative active:scale-[0.985] transition-transform"
      style={{ animationDelay: "0.06s" }}
    >
      <div className="eyebrow !text-white/80">
        Latest debrief · {formatRelative(startDate)}
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <h2 className="font-display text-[26px] font-bold leading-[1] tracking-tight max-w-[18ch] truncate">
          {activityName}
        </h2>
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/22 backdrop-blur-sm px-3 py-1 text-[11px] font-display font-bold text-white">
          <chip.Icon size={12} strokeWidth={3} />
          <span>{chip.label}</span>
        </span>
      </div>

      <p className="mt-2 text-[13.5px] leading-[1.55] text-white/92 max-w-[30ch]">
        {narration.wentWell[0] ?? `${SESSION_LABEL[metrics.sessionType]} session logged.`}{" "}
        {narration.toWatch[0] ? "Tap for the debrief." : "Open the debrief →"}
      </p>

      <div className="mt-3.5 flex items-center gap-2 text-[12px] font-semibold text-white/85">
        <span className="nums">{metrics.distanceKm.toFixed(1)} km</span>
        <Dot />
        <span className="nums">{formatDuration(metrics.movingSec)}</span>
        {prCount != null && prCount > 0 && (
          <>
            <Dot />
            <span className="flex items-center gap-1 nums">
              <Flame size={11} className="text-white" />
              {prCount} PR{prCount === 1 ? "" : "s"}
            </span>
          </>
        )}
      </div>

      <span
        aria-hidden
        className="absolute right-4 bottom-4 size-10 rounded-full bg-white grid place-items-center text-coral"
      >
        <ArrowRight size={18} strokeWidth={2.4} />
      </span>
    </Link>
  );
}

function Dot() {
  return <span className="size-1 rounded-full bg-white/60" />;
}
