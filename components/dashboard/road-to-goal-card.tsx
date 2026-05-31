import { TrendingUp, TrendingDown } from "lucide-react";
import type { AthleteStats } from "@/lib/strava/types";

interface Props {
  stats: AthleteStats | null;
  /** annual distance goal in km. Default 1500 — make this configurable later. */
  annualGoalKm?: number;
}

export function RoadToGoalCard({ stats, annualGoalKm = 1500 }: Props) {
  const ytdMeters =
    (stats?.ytdRideTotals.distance ?? 0) +
    (stats?.ytdRunTotals.distance ?? 0) +
    (stats?.ytdSwimTotals.distance ?? 0);
  const ytdKm = ytdMeters / 1000;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysElapsed = (now.getTime() - startOfYear.getTime()) / 86400000;
  const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
  const daysInYear = isLeap ? 366 : 365;
  const yearProgress = daysElapsed / daysInYear;
  const expectedKm = annualGoalKm * yearProgress;
  const deltaKm = Math.round(ytdKm - expectedKm);
  const pct = Math.max(0, Math.min(1, ytdKm / annualGoalKm));
  const readyPct = Math.round(pct * 100);
  const weeksRemaining = Math.max(0, Math.ceil((daysInYear - daysElapsed) / 7));

  // SVG ring
  const r = 31;
  const c = 2 * Math.PI * r;
  const dashoff = c * (1 - pct);

  const ahead = deltaKm >= 0;

  return (
    <div className="card reveal delay-4">
      <div className="eyebrow">Road to your goal</div>

      <div className="mt-3.5 flex items-center gap-4">
        <svg width="74" height="74" viewBox="0 0 74 74" className="shrink-0">
          <circle cx="37" cy="37" r={r} fill="none" stroke="#F1E7E0" strokeWidth="8" />
          <circle
            cx="37"
            cy="37"
            r={r}
            fill="none"
            stroke="#F2541B"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c.toFixed(0)}
            strokeDashoffset={dashoff.toFixed(0)}
            transform="rotate(-90 37 37)"
            style={{
              animation: `ringFill 1.1s cubic-bezier(0.4,0,0.2,1) 0.3s both`,
              ["--ring-target" as never]: dashoff.toFixed(0),
            }}
          />
          <text
            x="37"
            y="36"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontWeight="700"
            fontSize="16"
            fill="#1B1620"
          >
            {readyPct}%
          </text>
          <text
            x="37"
            y="48"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontWeight="600"
            fontSize="8"
            fill="#9C948D"
          >
            READY
          </text>
        </svg>

        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[13px] text-coral leading-none">
            {weeksRemaining} weeks left this season
          </div>
          <div className="mt-2 font-display font-extrabold text-[30px] leading-none nums">
            {Math.round(ytdKm)}
            <span className="text-[15px] font-semibold text-muted ml-1.5">km this year</span>
          </div>
          <div
            className={`mt-1.5 text-[12.5px] font-bold flex items-center gap-1.5 ${ahead ? "text-good" : "text-amber"}`}
          >
            {ahead ? <TrendingUp size={13} strokeWidth={3} /> : <TrendingDown size={13} strokeWidth={3} />}
            <span className="nums">
              {ahead ? "+" : ""}{deltaKm} km {ahead ? "ahead of" : "behind"} base plan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
