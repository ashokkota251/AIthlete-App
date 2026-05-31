import { CardCoral } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import type { AthleteStats } from "@/lib/strava/types";
import { formatKm } from "@/lib/format";
import { TrendingUp, Mountain } from "lucide-react";

const ANNUAL_GOAL_KM = 1500;

interface Props {
  stats: AthleteStats;
}

export function YearSoFarCard({ stats }: Props) {
  const ytdMeters =
    stats.ytdRideTotals.distance +
    stats.ytdRunTotals.distance +
    stats.ytdSwimTotals.distance;
  const ytdKm = ytdMeters / 1000;
  const ytdElev =
    stats.ytdRideTotals.elevationGain +
    stats.ytdRunTotals.elevationGain +
    stats.ytdSwimTotals.elevationGain;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysElapsed = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const daysInYear =
    (new Date(now.getFullYear(), 1, 29).getDate() === 29 ? 366 : 365);
  const yearProgress = daysElapsed / daysInYear;
  const expectedKm = ANNUAL_GOAL_KM * yearProgress;
  const aheadByKm = ytdKm - expectedKm;
  const goalPct = Math.min(1, ytdKm / ANNUAL_GOAL_KM);

  return (
    <CardCoral className="rise">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70">
            Year so far · {now.getFullYear()}
          </div>
          <div className="mt-1 flex items-baseline gap-2 nums">
            <span className="font-display font-bold tracking-tight text-[52px] leading-[0.95]">
              {ytdKm.toFixed(0)}
            </span>
            <span className="text-base text-white/80 font-medium">km</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-white/90">
            <TrendingUp size={13} />
            <span className="nums font-medium">
              {aheadByKm >= 0 ? "+" : ""}
              {aheadByKm.toFixed(0)} km
            </span>
            <span className="text-white/70">
              {aheadByKm >= 0 ? "ahead of pace" : "behind pace"}
            </span>
          </div>
        </div>

        <ProgressRing
          value={goalPct}
          size={86}
          strokeWidth={7}
          animateDelay={220}
          track="rgba(255,255,255,0.20)"
        >
          <div className="text-center">
            <div className="font-display font-bold tracking-tight text-xl text-white nums leading-none">
              {Math.round(goalPct * 100)}
              <span className="text-xs ml-px">%</span>
            </div>
            <div className="text-[9px] uppercase tracking-widest text-white/70 mt-1">
              {ANNUAL_GOAL_KM}km
            </div>
          </div>
        </ProgressRing>
      </div>

      {/* Sport split row */}
      <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-3">
        <SportTile
          label="Run"
          km={stats.ytdRunTotals.distance / 1000}
          count={stats.ytdRunTotals.count}
        />
        <SportTile
          label="Ride"
          km={stats.ytdRideTotals.distance / 1000}
          count={stats.ytdRideTotals.count}
        />
        <SportTile
          label="Swim"
          km={stats.ytdSwimTotals.distance / 1000}
          count={stats.ytdSwimTotals.count}
        />
      </div>

      {/* Lifetime + biggest */}
      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-white/85">
        <span className="flex items-center gap-1.5 nums">
          All-time · {formatKm(
            stats.allRideTotals.distance +
              stats.allRunTotals.distance +
              stats.allSwimTotals.distance,
          )}
        </span>
        <span className="flex items-center gap-1 nums">
          <Mountain size={11} />
          {(ytdElev / 1000).toFixed(1)}k m climbed
        </span>
      </div>
    </CardCoral>
  );
}

function SportTile({ label, km, count }: { label: string; km: number; count: number }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-widest text-white/70 font-semibold mb-1">
        {label}
      </div>
      <div className="flex items-baseline justify-center gap-0.5 nums">
        <span className="font-display font-bold tracking-tight text-base text-white leading-none">{km.toFixed(0)}</span>
        <span className="text-[10px] text-white/60">km</span>
      </div>
      <div className="text-[10px] text-white/60 nums mt-0.5">{count} sessions</div>
    </div>
  );
}
