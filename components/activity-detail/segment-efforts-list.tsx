import { Card, CardSection } from "@/components/ui/card";
import type { SegmentEffortSummary } from "@/lib/strava/types";
import { formatDuration } from "@/lib/format";
import { Mountain, Trophy } from "lucide-react";

interface Props {
  efforts?: SegmentEffortSummary[];
}

export function SegmentEffortsList({ efforts }: Props) {
  if (!efforts || efforts.length === 0) return null;

  // Show the most meaningful — PR-ranked first, then KOM, then by length
  const sorted = [...efforts].sort((a, b) => {
    const aScore = (a.prRank ? 100 : 0) + (a.komRank ? 50 : 0) + a.distance / 1000;
    const bScore = (b.prRank ? 100 : 0) + (b.komRank ? 50 : 0) + b.distance / 1000;
    return bScore - aScore;
  });
  const shown = sorted.slice(0, 8);

  return (
    <Card>
      <CardSection
        label="Segment efforts"
        trailing={
          <span className="text-[11px] text-ink-400 nums">{efforts.length} on this activity</span>
        }
      >
        <ul className="space-y-2">
          {shown.map((effort) => (
            <li
              key={effort.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream-deep/40 border border-transparent hover:border-coral-100 transition-colors"
            >
              <span className="size-8 rounded-xl bg-coral-50 grid place-items-center text-coral shrink-0">
                <Mountain size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-ink-900 leading-tight truncate">
                  {effort.segment?.name ?? effort.name}
                </div>
                <div className="text-[10px] text-ink-400 nums mt-0.5 flex items-center gap-1.5">
                  <span>{(effort.distance / 1000).toFixed(2)} km</span>
                  {effort.segment?.climbCategory != null && effort.segment.climbCategory > 0 && (
                    <>
                      <span className="text-ink-300">·</span>
                      <span>Cat {effort.segment.climbCategory}</span>
                    </>
                  )}
                  {effort.segment?.averageGrade != null && (
                    <>
                      <span className="text-ink-300">·</span>
                      <span>{effort.segment.averageGrade.toFixed(1)}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                <span className="font-display font-bold tracking-tight text-sm nums text-ink-900 leading-none">
                  {formatDuration(effort.movingTime)}
                </span>
                {(effort.prRank || effort.komRank) && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-widest font-semibold text-coral">
                    <Trophy size={9} strokeWidth={2.4} />
                    {effort.komRank ? `KOM #${effort.komRank}` : `PR #${effort.prRank}`}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {efforts.length > shown.length && (
          <p className="mt-2 text-[10px] text-ink-400 text-center">
            +{efforts.length - shown.length} more efforts
          </p>
        )}
      </CardSection>
    </Card>
  );
}
