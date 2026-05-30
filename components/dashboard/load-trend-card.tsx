import { Card, CardSection } from "@/components/ui/card";
import type { Activity } from "@/lib/strava/types";
import { acuteChronicRatio, weeklyLoad } from "@/lib/training";
import { cn } from "@/lib/cn";

interface Props {
  activities: Activity[];
}

const BAND_COPY: Record<
  ReturnType<typeof acuteChronicRatio>["band"],
  { label: string; color: string; bg: string; text: string }
> = {
  detrained: {
    label: "Detrained",
    color: "#7C7F8E",
    bg: "bg-ink-100",
    text: "text-ink-700",
  },
  sweet: {
    label: "Sweet spot",
    color: "#16A34A",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  build: {
    label: "Building",
    color: "#F2541B",
    bg: "bg-coral-50",
    text: "text-coral-700",
  },
  overload: {
    label: "Overload",
    color: "#B23006",
    bg: "bg-coral-100",
    text: "text-coral-700",
  },
};

const BAND_GUIDANCE: Record<ReturnType<typeof acuteChronicRatio>["band"], string> = {
  detrained: "Volume has dropped — ramp gradually next week.",
  sweet: "Acute load is matching your chronic baseline. Adapt and repeat.",
  build: "Healthy build — keep proportionate recovery between hard days.",
  overload: "Acute spike. Schedule a recovery day before the next quality session.",
};

export function LoadTrendCard({ activities }: Props) {
  const weeks = weeklyLoad(activities, 8);
  const acr = acuteChronicRatio(activities);
  const maxLoad = Math.max(1, ...weeks.map((w) => w.load));
  const band = BAND_COPY[acr.band];

  return (
    <Card className="rise">
      <CardSection
        label="Training load · 8 weeks"
        trailing={
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-1 rounded-pill",
              band.bg,
              band.text,
            )}
          >
            ACR {acr.ratio.toFixed(2)} · {band.label}
          </span>
        }
      >
        <div className="flex items-end gap-1.5 h-[88px] mt-1">
          {weeks.map((w, i) => {
            const isCurrent = i === weeks.length - 1;
            const h = (w.load / maxLoad) * 80 + 4;
            return (
              <div key={w.weekEnd} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-md transition-all",
                    isCurrent ? "bg-coral" : "bg-coral-200",
                  )}
                  style={{ height: `${h}px` }}
                  title={`Week ending ${new Date(w.weekEnd).toLocaleDateString()} · load ${w.load}`}
                />
                <span className="text-[9px] text-ink-400 nums">
                  {i === weeks.length - 1 ? "now" : `−${weeks.length - 1 - i}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-ink-100/80 flex items-start gap-2">
          <span
            className="mt-1 size-2 rounded-full shrink-0"
            style={{ background: band.color }}
          />
          <p className="text-[12px] text-ink-500 leading-relaxed">
            {BAND_GUIDANCE[acr.band]}
          </p>
        </div>
      </CardSection>
    </Card>
  );
}
