import { Card, CardSection } from "@/components/ui/card";
import type { Activity } from "@/lib/strava/types";
import { Trophy, Sparkles } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { ActivityIcon } from "@/components/activity-icon";

interface Props {
  activities: Activity[];
}

interface WeeklyPRs {
  weekIso: string;
  count: number;
}

export function PrTimelineCard({ activities }: Props) {
  const totalPRs = activities.reduce((s, a) => s + (a.prCount ?? 0), 0);
  const recentWithPRs = activities
    .filter((a) => (a.prCount ?? 0) > 0)
    .slice(0, 3);

  // Group PRs by week (Monday-anchored), last 8 weeks.
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const dow = (now.getDay() + 6) % 7;
  startOfThisWeek.setDate(now.getDate() - dow);

  const buckets: WeeklyPRs[] = [];
  for (let i = 7; i >= 0; i--) {
    const wkStart = new Date(startOfThisWeek);
    wkStart.setDate(wkStart.getDate() - i * 7);
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkEnd.getDate() + 7);
    let count = 0;
    for (const a of activities) {
      const t = new Date(a.startDate).getTime();
      if (t >= wkStart.getTime() && t < wkEnd.getTime()) {
        count += a.prCount ?? 0;
      }
    }
    buckets.push({ weekIso: wkStart.toISOString(), count });
  }
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card className="rise">
      <CardSection
        label="Personal records · 8 weeks"
        trailing={
          <span className="text-[11px] text-ink-400 nums">
            {totalPRs} PRs in window
          </span>
        }
      >
        {/* Sparkline-ish bar row */}
        <div className="flex items-end gap-1 h-[44px] mt-1">
          {buckets.map((b, i) => {
            const isCurrent = i === buckets.length - 1;
            const h = (b.count / maxCount) * 36 + 4;
            return (
              <div
                key={b.weekIso}
                title={`Week of ${new Date(b.weekIso).toLocaleDateString()} · ${b.count} PR${b.count === 1 ? "" : "s"}`}
                className="flex-1 flex flex-col items-center gap-0.5"
              >
                <div
                  className={
                    isCurrent
                      ? "w-full rounded-md bg-coral"
                      : b.count === 0
                        ? "w-full rounded-md bg-ink-100"
                        : "w-full rounded-md bg-coral-200"
                  }
                  style={{ height: `${h}px` }}
                />
                {b.count > 0 && (
                  <span className="text-[9px] font-semibold text-ink-700 nums leading-none">
                    {b.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {recentWithPRs.length > 0 ? (
          <ul className="mt-4 pt-3 border-t border-ink-100/80 space-y-2">
            {recentWithPRs.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 text-[12px]"
              >
                <span className="size-7 rounded-xl bg-coral-50 grid place-items-center text-coral shrink-0">
                  <Trophy size={13} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <ActivityIcon type={a.type} size={11} className="text-ink-400" />
                    <span className="font-medium text-ink-900 truncate">{a.name}</span>
                  </div>
                  <div className="text-[10px] text-ink-400 nums">
                    {formatRelative(a.startDate)}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-coral nums shrink-0">
                  {a.prCount} PR{a.prCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 pt-3 border-t border-ink-100/80 flex items-center gap-2 text-[12px] text-ink-500">
            <Sparkles size={12} className="text-coral/60" />
            No PRs in this window — a fresh segment effort could change that.
          </div>
        )}
      </CardSection>
    </Card>
  );
}
