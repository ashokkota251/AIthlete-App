import type { Activity } from "@/lib/strava/types";
import { weeklyLoad, acuteChronicRatio } from "@/lib/training";
import { cn } from "@/lib/cn";

interface Props {
  activities: Activity[];
}

const BAND_CHIP = {
  detrained: { text: "Detrained", bg: "bg-ink-50", color: "text-ink-700" },
  sweet: { text: "Sweet spot", bg: "bg-emerald-50", color: "text-good" },
  build: { text: "Building", bg: "bg-coral-50", color: "text-coral-700" },
  overload: { text: "Overload", bg: "bg-[#FDEDE9]", color: "text-red" },
} as const;

export function FormLoadCard({ activities }: Props) {
  const weeks = weeklyLoad(activities, 8);
  const acr = acuteChronicRatio(activities);
  const chip = BAND_CHIP[acr.band];
  const max = Math.max(1, ...weeks.map((w) => w.load));

  const verdictText =
    acr.band === "overload"
      ? "Acute spike — bank two easy days, then quality Thursday."
      : acr.band === "build"
        ? "Healthy build — earn the next jump with a rest day mid-week."
        : acr.band === "sweet"
          ? "Form is locked in — match this rhythm next week."
          : "Volume below baseline — rebuild gradually, no spike weeks.";

  const dotColor =
    acr.band === "overload" || acr.band === "build" ? "bg-red" : "bg-good";

  return (
    <div className="card reveal delay-3">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Form &amp; load · 8 weeks</div>
        <span
          className={cn(
            "font-display font-bold text-[11px] tracking-[0.03em] px-2.5 py-1 rounded-pill nums",
            chip.bg,
            chip.color,
          )}
        >
          ACR {acr.ratio.toFixed(2)} · {chip.text}
        </span>
      </div>

      {/* 8-week bars */}
      <div className="mt-4 flex items-end gap-[7px] h-[78px] px-[2px]">
        {weeks.map((w, i) => {
          const isCurrent = i === weeks.length - 1;
          const h = (w.load / max) * 100;
          return (
            <div
              key={w.weekEnd}
              className={cn(
                "flex-1 rounded-t-[6px] rounded-b-[3px] transition-all",
                isCurrent ? "bg-coral" : "bg-[#FAD9C9]",
              )}
              style={{ height: `${Math.max(h, 8)}%` }}
              title={`Week ending ${new Date(w.weekEnd).toLocaleDateString()} · ${w.load} TSS`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[#c3b8b0] mt-[2px] px-[2px]">
        <span>8 wks ago</span>
        <span>now</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-ink leading-snug">
        <span className={cn("size-2.5 rounded-full shrink-0 animate-pulseDot", dotColor)} />
        {verdictText}
      </div>
    </div>
  );
}
