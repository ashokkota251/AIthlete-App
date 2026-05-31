import type { SplitRow } from "@/lib/metrics/types";
import { cn } from "@/lib/cn";

interface Props {
  splits: SplitRow[];
  hasPower: boolean;
  delay?: number;
}

export function SplitsDetailTable({ splits, hasPower, delay = 5 }: Props) {
  if (splits.length === 0) return null;

  const fastestIdx = splits.reduce(
    (best, s, i) => (s.speedKmh > splits[best].speedKmh ? i : best),
    0,
  );

  return (
    <div className={`card reveal delay-${delay}`}>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[9.5px] uppercase tracking-[0.05em] text-muted font-semibold">
            <th className="pb-2 text-left font-semibold">Km</th>
            <th className="pb-2 text-right font-semibold">Speed</th>
            {hasPower && <th className="pb-2 text-right font-semibold">Power</th>}
            <th className="pb-2 text-right font-semibold">HR</th>
            <th className="pb-2 text-right font-semibold">Climb</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((s, i) => {
            const isFast = i === fastestIdx;
            return (
              <tr key={s.index} className="nums">
                <td className={cn("py-2 border-t border-line text-left font-semibold", isFast && "text-coral")}>
                  {s.label}
                </td>
                <td className={cn("py-2 border-t border-line text-right font-semibold", isFast && "text-coral")}>
                  {s.speedKmh.toFixed(1)}
                </td>
                {hasPower && (
                  <td className={cn("py-2 border-t border-line text-right font-semibold", isFast && "text-coral")}>
                    {s.avgPower ?? "—"}
                  </td>
                )}
                <td className={cn("py-2 border-t border-line text-right font-semibold", isFast && "text-coral")}>
                  {s.avgHr ?? "—"}
                </td>
                <td className={cn("py-2 border-t border-line text-right font-semibold", isFast && "text-coral")}>
                  +{s.climbM ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
