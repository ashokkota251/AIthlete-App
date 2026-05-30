import { Card, CardSection } from "@/components/ui/card";
import type { Activity, AthleteZones } from "@/lib/strava/types";
import {
  hrZones,
  timeInZoneFromAverages,
  zoneCoachingPrompt,
} from "@/lib/training";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  activities: Activity[];
  zones: AthleteZones | null;
}

// Cool → warm gradient: Z1 muted, Z5 deep coral.
const ZONE_COLORS = ["#A6A8B4", "#7C7F8E", "#FFA876", "#F2541B", "#B23006"];

export function ZonesCard({ activities, zones }: Props) {
  const bins = hrZones(zones);
  if (!bins) {
    return (
      <Card className="rise">
        <CardSection label="Intensity · last 7 days">
          <p className="text-[12px] text-ink-400 leading-relaxed py-3">
            HR zones aren&apos;t set on your Strava profile yet. Add them at
            Strava → Settings → My Performance to unlock zone-based coaching.
          </p>
        </CardSection>
      </Card>
    );
  }

  const dist = timeInZoneFromAverages(activities, bins, 7);
  const totalSec = dist.reduce((s, d) => s + d.seconds, 0);
  const prompt = zoneCoachingPrompt(dist);

  return (
    <Card className="rise">
      <CardSection
        label="Intensity · last 7 days"
        trailing={
          <span className="text-[11px] text-ink-400 nums">
            {totalSec > 0 ? formatDuration(totalSec) : "no HR data"}
          </span>
        }
      >
        {/* Stacked bar */}
        <div
          className="h-7 rounded-full overflow-hidden flex bg-ink-50"
          role="img"
          aria-label="Time in heart-rate zone breakdown"
        >
          {dist.map((d, i) => {
            const w = (d.share * 100).toFixed(2);
            if (d.share === 0) return null;
            return (
              <div
                key={d.zone.label}
                style={{ width: `${w}%`, background: ZONE_COLORS[i] }}
                title={`${d.zone.label} ${d.zone.description} · ${formatDuration(d.seconds)} (${Math.round(d.share * 100)}%)`}
              />
            );
          })}
        </div>

        {/* Zone legend with bpm ranges */}
        <ul className="mt-3 grid grid-cols-5 gap-1.5">
          {dist.map((d, i) => (
            <li key={d.zone.label} className="text-center">
              <div
                className="mx-auto size-2 rounded-full mb-1"
                style={{ background: ZONE_COLORS[i] }}
              />
              <div className="text-[10px] uppercase tracking-widest font-semibold text-ink-700 leading-none">
                {d.zone.label}
              </div>
              <div className="text-[9px] text-ink-400 nums mt-0.5">
                {d.zone.min}–{d.zone.max < 220 ? d.zone.max : "+"}
              </div>
              <div className="text-[10px] text-ink-700 font-medium nums mt-0.5">
                {Math.round(d.share * 100)}%
              </div>
            </li>
          ))}
        </ul>

        {/* Coaching prompt */}
        {prompt && (
          <div
            className={cn(
              "mt-4 pt-3 border-t flex items-start gap-2",
              prompt.tone === "warn"
                ? "border-coral-100"
                : prompt.tone === "ok"
                  ? "border-emerald-100"
                  : "border-ink-100",
            )}
          >
            <span
              className={cn(
                "mt-1 size-2 rounded-full shrink-0",
                prompt.tone === "warn"
                  ? "bg-coral animate-pulseDot"
                  : prompt.tone === "ok"
                    ? "bg-emerald-500"
                    : "bg-ink-400",
              )}
            />
            <p className="text-[12px] text-ink-700 leading-relaxed">{prompt.text}</p>
          </div>
        )}
      </CardSection>
    </Card>
  );
}
