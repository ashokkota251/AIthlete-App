import type { ComputedMetrics } from "@/lib/metrics/types";
import { cn } from "@/lib/cn";

interface Props {
  metrics: ComputedMetrics;
  hrStream?: number[];
  delay?: number;
}

const ZONE_COLORS = ["#FDD9C6", "#FBB78C", "#F2541B", "#D8431F", "#A32D1B"] as const;
const ZONE_NAMES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;

export function HrCard({ metrics, hrStream, delay = 3 }: Props) {
  const tiz = metrics.timeInZoneSec ?? [];
  const totalTiz = tiz.reduce((s, v) => s + v, 0);

  const drift = metrics.cardiacDriftPct;
  const recovery = metrics.recoveryHr1min;

  const insightTone: "green" | "amber" | "red" =
    drift != null && Math.abs(drift) < 5 ? "green" : drift != null && Math.abs(drift) > 8 ? "red" : "amber";

  const insightText = (() => {
    if (recovery != null && drift != null) {
      return `Recovery HR dropped <b>${recovery} bpm in the first minute</b> — that's a well-conditioned heart. Drift ${drift.toFixed(1)}% — ${Math.abs(drift) < 5 ? "you held form to the end." : "fatigue showed up late."}`;
    }
    if (drift != null) {
      return `Cardiac drift was <b>${drift.toFixed(1)}%</b> — ${Math.abs(drift) < 5 ? "aerobic control held." : "you slowed against rising HR late."}`;
    }
    if (recovery != null) {
      return `Heart rate dropped <b>${recovery} bpm</b> in the first minute after stopping — a sign of strong aerobic conditioning.`;
    }
    return "Wear a chest strap on your next ride to unlock drift, recovery HR, and time-in-zone coaching.";
  })();

  return (
    <div className={`card reveal delay-${delay}`}>
      <div className="flex gap-5 mb-3">
        <Meta value={metrics.avgHr ? String(metrics.avgHr) : "—"} label="avg bpm" />
        <Meta value={metrics.maxHr ? String(metrics.maxHr) : "—"} label="max bpm" />
        <Meta value={drift != null ? `${drift.toFixed(1)}%` : "—"} label="drift" />
        <Meta value={recovery != null ? `−${recovery}` : "—"} label="recov · 1min" />
      </div>

      <HrChart hrStream={hrStream} />

      <div className="mt-3 space-y-2">
        {[4, 3, 2, 1, 0].map((zi) => {
          const sec = tiz[zi] ?? 0;
          const min = Math.round(sec / 60);
          const share = totalTiz > 0 ? sec / totalTiz : 0;
          return (
            <div key={zi} className="flex items-center gap-2.5">
              <span className="font-display font-bold text-[12px] w-7 shrink-0">{ZONE_NAMES[zi]}</span>
              <div className="flex-1 h-[14px] rounded-[7px] bg-[#F4ECE6] overflow-hidden">
                <div
                  className="h-full rounded-[7px] transition-all"
                  style={{
                    width: `${Math.max(2, share * 100).toFixed(1)}%`,
                    background: ZONE_COLORS[zi],
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#7a726b] w-14 text-right nums">
                {min} min
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 items-start text-[12.5px] leading-[1.5]">
        <span
          className={cn(
            "size-2.5 rounded-full shrink-0 mt-1",
            insightTone === "green" && "bg-good",
            insightTone === "amber" && "bg-amber",
            insightTone === "red" && "bg-red",
          )}
        />
        <p
          className="text-ink-700"
          dangerouslySetInnerHTML={{ __html: insightText.replace(/<b>(.*?)<\/b>/g, "<b class='font-bold text-ink'>$1</b>") }}
        />
      </div>
    </div>
  );
}

function Meta({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display font-bold text-[18px] leading-none nums">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.06em] text-muted font-semibold">
        {label}
      </div>
    </div>
  );
}

/** HR overlay on 5 colored zone bands. */
function HrChart({ hrStream }: { hrStream?: number[] }) {
  if (!hrStream || hrStream.length < 10) {
    // No stream — render an empty band frame so the layout still reads.
    return <Bands />;
  }

  // Downsample to ~160 points for a smooth, lightweight polyline.
  const target = 160;
  const stride = Math.max(1, Math.floor(hrStream.length / target));
  const points: number[] = [];
  for (let i = 0; i < hrStream.length; i += stride) points.push(hrStream[i]);
  if (points[points.length - 1] !== hrStream[hrStream.length - 1]) {
    points.push(hrStream[hrStream.length - 1]);
  }

  const min = Math.min(...points.filter((v) => v > 0));
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  const w = 320;
  const h = 120;
  const dx = w / Math.max(1, points.length - 1);
  const path = points
    .map((v, i) => {
      const x = i * dx;
      // Higher HR = lower y. Pad 6px top/bottom.
      const y = 6 + (1 - (v - min) / range) * (h - 12);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="relative">
      <Bands />
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-[120px]"
      >
        <path
          d={path}
          fill="none"
          stroke="#F2541B"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Bands() {
  return (
    <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="w-full h-[120px] block">
      <rect x="0" y="0" width="320" height="22" fill="#A32D1B" opacity=".10" />
      <rect x="0" y="22" width="320" height="22" fill="#D8431F" opacity=".10" />
      <rect x="0" y="44" width="320" height="28" fill="#F2541B" opacity=".10" />
      <rect x="0" y="72" width="320" height="26" fill="#FBB78C" opacity=".22" />
      <rect x="0" y="98" width="320" height="22" fill="#FDD9C6" opacity=".35" />
    </svg>
  );
}
