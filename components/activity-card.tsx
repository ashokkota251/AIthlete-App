import type { Activity } from "@/lib/strava/types";
import {
  formatKm,
  formatDuration,
  formatActivitySpeed,
  formatRelative,
  formatTimeShort,
} from "@/lib/format";
import { ActivityIcon, labelFor } from "@/components/activity-icon";
import { Heart, Mountain } from "lucide-react";

export function ActivityCard({ activity, index = 0 }: { activity: Activity; index?: number }) {
  const isDistanceBased = activity.distance > 0;

  return (
    <article
      className="card !p-4 hover:shadow-elev transition-shadow rise"
      style={{ animationDelay: `${0.04 + index * 0.04}s` }}
    >
      <header className="flex items-start gap-3">
        <div
          className="shrink-0 size-11 rounded-2xl grid place-items-center"
          style={{ background: "linear-gradient(135deg, #FFF1E9 0%, #FFE0CE 100%)" }}
        >
          <ActivityIcon type={activity.type} size={20} className="text-coral" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display-wide text-[15px] leading-tight text-ink-900 truncate">
              {activity.name}
            </h3>
            <span className="eyebrow shrink-0">{labelFor(activity.type)}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-ink-400 nums flex items-center gap-1.5">
            <span>{formatRelative(activity.startDate)}</span>
            <span className="text-ink-300">·</span>
            <span>{formatTimeShort(activity.startDate)}</span>
          </div>
        </div>
      </header>

      <div className="mt-3 pt-3 border-t border-ink-100/80 grid grid-cols-3 gap-2 text-left">
        <Mini
          label={isDistanceBased ? "Distance" : "Duration"}
          value={isDistanceBased ? formatKm(activity.distance).replace(" km", "") : formatDuration(activity.movingTime)}
          unit={isDistanceBased ? "km" : ""}
          big
        />
        <Mini label="Time" value={formatDuration(activity.movingTime)} />
        <Mini
          label={activity.type === "Swim" ? "Pace" : activity.type === "Ride" ? "Speed" : "Pace"}
          value={formatActivitySpeed(activity)}
        />
      </div>

      {(activity.averageHeartrate || activity.totalElevationGain > 0) && (
        <div className="mt-2 pt-2 flex items-center gap-4 text-[11px] text-ink-500">
          {activity.averageHeartrate ? (
            <span className="flex items-center gap-1 nums">
              <Heart size={11} className="text-coral" />
              {Math.round(activity.averageHeartrate)} bpm
            </span>
          ) : null}
          {activity.totalElevationGain > 0 ? (
            <span className="flex items-center gap-1 nums">
              <Mountain size={11} className="text-coral" />
              {Math.round(activity.totalElevationGain)} m
            </span>
          ) : null}
        </div>
      )}

      {activity.description && (
        <p className="mt-2 text-[12px] text-ink-500 leading-relaxed italic">
          “{activity.description}”
        </p>
      )}
    </article>
  );
}

function Mini({
  label,
  value,
  unit,
  big = false,
}: {
  label: string;
  value: string;
  unit?: string;
  big?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] uppercase tracking-widest font-semibold text-ink-400">{label}</div>
      <div className={big ? "font-display-wide text-lg nums text-ink-900 leading-none flex items-baseline gap-0.5" : "text-[13px] nums text-ink-700 leading-none"}>
        <span>{value}</span>
        {unit && <span className="text-[10px] text-ink-400">{unit}</span>}
      </div>
    </div>
  );
}
