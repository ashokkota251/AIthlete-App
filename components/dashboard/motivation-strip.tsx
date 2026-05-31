import type { Activity } from "@/lib/strava/types";

interface Props {
  activities: Activity[];
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function computeStreak(activities: Activity[], now: Date = new Date()): number {
  if (activities.length === 0) return 0;
  const days = new Set(activities.map((a) => isoDay(new Date(a.startDate))));
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  // Allow today to not have one yet — start counting from yesterday if today's empty.
  if (!days.has(isoDay(today))) {
    today.setDate(today.getDate() - 1);
  }
  while (days.has(isoDay(today))) {
    streak++;
    today.setDate(today.getDate() - 1);
  }
  return streak;
}

export function MotivationStrip({ activities }: Props) {
  // Compute "now" once at module scope per render — this component is server-rendered
  // so the value is stable for the entire request lifecycle.
  const now = new Date();
  const streak = computeStreak(activities, now);
  const eightWeeksAgo = now.getTime() - 56 * 24 * 3600 * 1000;
  const prsInWindow = activities
    .filter((a) => new Date(a.startDate).getTime() >= eightWeeksAgo)
    .reduce((sum, a) => sum + (a.prCount ?? 0), 0);

  // Most recent activity with PRs
  const topPr = activities.find((a) => (a.prCount ?? 0) > 0);
  const topPrText = topPr
    ? `${topPr.prCount} PR${topPr.prCount === 1 ? "" : "s"} on ${shortDayName(topPr.startDate)}'s ${topPr.name}.`
    : "Chase a starred segment to break one.";

  return (
    <div className="grid grid-cols-2 gap-3.5 reveal delay-5">
      <div className="card !p-[18px]">
        <div className="eyebrow flex items-center gap-1 text-[12px]">
          <span aria-hidden>🔥</span> Streak
        </div>
        <div className="mt-2 font-display font-extrabold text-[30px] leading-none nums">
          {streak}
          <span className="text-[14px] font-semibold text-muted ml-1.5">days</span>
        </div>
        <p className="mt-2 text-[13px] text-muted leading-[1.4]">
          One light day keeps it alive.
        </p>
      </div>

      <div className="card !p-[18px]">
        <div className="eyebrow">Recent PRs</div>
        <div className="mt-2 font-display font-extrabold text-[30px] leading-none nums">
          {prsInWindow}
          <span className="text-[14px] font-semibold text-muted ml-1.5">/ 8wk</span>
        </div>
        <p className="mt-2 text-[13px] text-muted leading-[1.4]">{topPrText}</p>
      </div>
    </div>
  );
}

function shortDayName(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}
