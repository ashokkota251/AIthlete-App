import { Card, CardSection } from "@/components/ui/card";
import { sportDistribution, SPORT_COLORS, SPORT_LABELS } from "@/lib/training";
import type { Activity } from "@/lib/strava/types";
import { formatDuration } from "@/lib/format";

interface Props {
  activities: Activity[];
}

const SIZE = 124;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function SportBalanceDonut({ activities }: Props) {
  const dist = sportDistribution(activities, 31);
  const totalSec = dist.reduce((s, d) => s + d.seconds, 0);
  const empty = totalSec === 0;

  // Compute stroke segments (start offset, length).
  let cursor = 0;
  const segments = dist.map((d) => {
    const length = d.share * CIRC;
    const offset = cursor;
    cursor += length;
    return { ...d, offset, length };
  });

  const dominant = segments[0];

  return (
    <Card className="rise">
      <CardSection
        label="Sport balance · last 31 days"
        trailing={
          empty ? null : (
            <span className="text-[11px] text-ink-400 nums">
              {formatDuration(totalSec)} total
            </span>
          )
        }
      >
        {empty ? (
          <p className="text-[12px] text-ink-400 text-center py-6">
            No activities in the last 31 days.
          </p>
        ) : (
          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
              <svg width={SIZE} height={SIZE} className="-rotate-90">
                {/* Track */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(20,16,8,0.05)"
                  strokeWidth={STROKE}
                />
                {segments.map((seg) => (
                  <circle
                    key={seg.family}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={SPORT_COLORS[seg.family]}
                    strokeWidth={STROKE}
                    strokeDasharray={`${seg.length} ${CIRC - seg.length}`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="butt"
                  />
                ))}
              </svg>
              {dominant && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-[9px] uppercase tracking-widest font-semibold text-ink-400 leading-none">
                      Most
                    </div>
                    <div
                      className="font-display-wide text-xl mt-1 leading-none"
                      style={{ color: SPORT_COLORS[dominant.family] }}
                    >
                      {SPORT_LABELS[dominant.family]}
                    </div>
                    <div className="text-[10px] text-ink-400 nums mt-1">
                      {Math.round(dominant.share * 100)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <ul className="flex-1 space-y-1.5">
              {segments.map((seg) => (
                <li key={seg.family} className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 rounded-sm shrink-0"
                    style={{ background: SPORT_COLORS[seg.family] }}
                  />
                  <span className="text-[12px] text-ink-700 font-medium flex-1">
                    {SPORT_LABELS[seg.family]}
                  </span>
                  <span className="text-[11px] text-ink-400 nums">
                    {Math.round(seg.share * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardSection>
    </Card>
  );
}
