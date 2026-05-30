import { Card, CardSection } from "@/components/ui/card";
import type { LapInfo } from "@/lib/strava/types";
import { formatDuration, formatPace, formatSpeed } from "@/lib/format";

interface Props {
  laps?: LapInfo[];
  sport: "run" | "ride" | "swim" | "other";
}

export function LapsTable({ laps, sport }: Props) {
  if (!laps || laps.length === 0) return null;

  const fastestIdx = laps.reduce(
    (best, l, i) => (l.movingTime < (laps[best]?.movingTime ?? Infinity) ? i : best),
    0,
  );

  const isPace = sport === "run" || sport === "swim";

  return (
    <Card>
      <CardSection
        label="Laps"
        trailing={
          <span className="text-[11px] text-ink-400 nums">{laps.length} laps</span>
        }
      >
        <ol className="space-y-1.5">
          {laps.map((lap, i) => {
            const isFastest = i === fastestIdx;
            return (
              <li
                key={lap.id}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2 " +
                  (isFastest
                    ? "bg-coral-50 border border-coral-100"
                    : "bg-cream-deep/40 border border-transparent")
                }
              >
                <span className="font-display-compressed text-base nums w-6 text-ink-400">
                  {String(lap.lapIndex).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-ink-900 font-medium leading-tight truncate">
                    {lap.name}
                  </div>
                  <div className="text-[10px] text-ink-400 nums mt-0.5">
                    {(lap.distance / 1000).toFixed(2)} km
                    {lap.totalElevationGain > 0 && (
                      <span> · +{Math.round(lap.totalElevationGain)} m</span>
                    )}
                    {lap.averageHeartrate && (
                      <span> · {Math.round(lap.averageHeartrate)} bpm</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={
                      "font-display-wide text-sm nums leading-none " +
                      (isFastest ? "text-coral" : "text-ink-900")
                    }
                  >
                    {formatDuration(lap.movingTime)}
                  </div>
                  <div className="text-[10px] text-ink-400 nums mt-0.5">
                    {lap.averageSpeed
                      ? isPace
                        ? formatPace(lap.averageSpeed)
                        : formatSpeed(lap.averageSpeed)
                      : "—"}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardSection>
    </Card>
  );
}
