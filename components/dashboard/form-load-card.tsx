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

  const thisWeek = weeks[weeks.length - 1]?.load ?? 0;
  const lastWeek = weeks[weeks.length - 2]?.load ?? 0;
  const delta = thisWeek - lastWeek;
  const deltaPct = lastWeek > 0 ? Math.round((delta / lastWeek) * 100) : null;
  const fourWkAvg = Math.round(
    weeks.slice(-4).reduce((s, w) => s + w.load, 0) / 4,
  );

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

      {/* numeric ledger — this week / vs last / 4-wk avg */}
      <div className="mt-3.5 grid grid-cols-3 gap-3 border-y border-line py-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] font-semibold text-ink-400">
            This week
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 nums leading-none">
            <span className="font-display font-bold text-[22px] text-ink-900">
              {thisWeek}
            </span>
            <span className="text-[10px] font-semibold text-ink-400">TSS</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] font-semibold text-ink-400">
            vs last
          </div>
          <div
            className={cn(
              "mt-0.5 flex items-baseline gap-1 nums leading-none font-display font-bold text-[18px]",
              delta > 0
                ? "text-coral"
                : delta < 0
                  ? "text-good"
                  : "text-ink-700",
            )}
          >
            <span>
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
            {deltaPct !== null && (
              <span className="text-[10px] font-semibold text-ink-400">
                {deltaPct > 0 ? "+" : ""}
                {deltaPct}%
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] font-semibold text-ink-400">
            4-wk avg
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 nums leading-none">
            <span className="font-display font-bold text-[22px] text-ink-700">
              {fourWkAvg}
            </span>
            <span className="text-[10px] font-semibold text-ink-400">TSS</span>
          </div>
        </div>
      </div>

      {/* 8-week bars with current-bar value pinned above */}
      <div className="mt-4 relative flex items-end gap-[7px] h-[88px] px-[2px]">
        {weeks.map((w, i) => {
          const isCurrent = i === weeks.length - 1;
          const h = (w.load / max) * 100;
          return (
            <div
              key={w.weekEnd}
              className="flex-1 relative h-full flex items-end"
              title={`Week ending ${new Date(w.weekEnd).toLocaleDateString()} · ${w.load} TSS`}
            >
              {isCurrent && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-0.5 nums font-display font-bold text-[10px] text-coral whitespace-nowrap">
                  {w.load}
                </span>
              )}
              <div
                className={cn(
                  "w-full rounded-t-[6px] rounded-b-[3px] transition-all",
                  isCurrent ? "bg-coral" : "bg-[#FAD9C9]",
                )}
                style={{ height: `${Math.max(h, 8)}%` }}
              />
            </div>
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
