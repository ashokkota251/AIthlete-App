import type { SplitRow } from "@/lib/metrics/types";
import { cn } from "@/lib/cn";

interface Props {
  splits: SplitRow[];
  delay?: number;
  /** show "Pace" or "Speed" column header */
  pace?: boolean;
}

function paceStr(secPerKm?: number) {
  if (!secPerKm) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SplitsTable({ splits, delay = 6, pace = true }: Props) {
  if (splits.length === 0) return null;

  // Fastest by speed.
  const fastestIdx = splits.reduce(
    (best, s, i) => (s.speedKmh > splits[best].speedKmh ? i : best),
    0,
  );

  const maxSpeed = Math.max(...splits.map((s) => s.speedKmh));

  return (
    <div className={`card reveal delay-${delay}`}>
      <div className="eyebrow mb-2">Splits</div>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[9.5px] uppercase tracking-[0.06em] text-muted font-semibold">
            <th className="pb-2 text-left font-semibold">Km</th>
            <th className="pb-2 text-right font-semibold">{pace ? "Pace" : "Speed"}</th>
            <th className="pb-2 text-right font-semibold">HR</th>
            <th className="pb-2 text-right font-semibold"> </th>
          </tr>
        </thead>
        <tbody>
          {splits.map((s, i) => {
            const isFast = i === fastestIdx;
            const w = Math.round((s.speedKmh / maxSpeed) * 100);
            return (
              <tr key={s.index} className="nums">
                <td className={cn("py-2 border-t border-line text-left font-semibold", isFast && "text-coral")}>
                  {s.label}
                </td>
                <td className={cn("py-2 border-t border-line text-right font-semibold", isFast && "text-coral")}>
                  {pace ? paceStr(s.paceSecPerKm) : s.speedKmh.toFixed(1)}
                </td>
                <td className={cn("py-2 border-t border-line text-right font-semibold", isFast && "text-coral")}>
                  {s.avgHr ?? "—"}
                </td>
                <td className="py-2 border-t border-line text-right">
                  <span
                    className="inline-block h-1.5 rounded-[3px] align-middle"
                    style={{
                      width: `${Math.max(40, w)}%`,
                      maxWidth: 80,
                      background: isFast ? "var(--coral)" : "var(--coral-soft)",
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
