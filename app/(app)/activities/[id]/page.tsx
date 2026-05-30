import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { Card, CardCoral } from "@/components/ui/card";
import { MapPolyline } from "@/components/activity-detail/map-polyline";
import { HrElevationChart } from "@/components/activity-detail/hr-elevation-chart";
import { LapsTable } from "@/components/activity-detail/laps-table";
import { SegmentEffortsList } from "@/components/activity-detail/segment-efforts-list";
import { ActivityIcon, labelFor } from "@/components/activity-icon";
import { sportFamily } from "@/lib/training";
import {
  formatKm,
  formatDuration,
  formatActivitySpeed,
  formatDateShort,
  formatTimeShort,
} from "@/lib/format";
import {
  ArrowLeft,
  Flame,
  Heart,
  Mountain,
  Trophy,
  Wind,
  Zap,
  Cpu,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });

  let activity;
  try {
    activity = await provider.getActivity(id);
  } catch {
    notFound();
  }

  // Fetch streams in parallel only if there's a polyline (i.e. real outdoor activity).
  const streamsPromise = activity.polyline
    ? provider
        .getActivityStreams(id, ["distance", "altitude", "heartrate"])
        .catch(() => null)
    : Promise.resolve(null);
  const streams = await streamsPromise;

  const family = sportFamily(activity.type);
  const sport = family === "run" || family === "ride" || family === "swim" ? family : "other";
  const isDistanceBased = activity.distance > 0;
  const heroPace = formatActivitySpeed(activity);
  const date = new Date(activity.startDate);

  return (
    <div className="space-y-5 pb-2">
      {/* Header with back arrow */}
      <header className="rise flex items-center justify-between gap-3">
        <Link
          href="/activities"
          className="size-9 rounded-pill border border-ink-100 bg-paper grid place-items-center text-ink-700 hover:border-ink-300 transition-colors"
          aria-label="Back to activities"
        >
          <ArrowLeft size={15} strokeWidth={2.2} />
        </Link>
        <div className="flex-1 min-w-0 text-right">
          <div className="eyebrow flex items-center gap-1.5 justify-end">
            <ActivityIcon type={activity.type} size={11} className="text-coral" />
            {labelFor(activity.type)} · {formatDateShort(activity.startDate)} ·{" "}
            {formatTimeShort(activity.startDate)}
          </div>
        </div>
      </header>

      {/* Hero — title + macro stats */}
      <CardCoral className="rise delay-1">
        <h1
          className="text-white text-[26px] leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontVariationSettings: '"opsz" 96, "wdth" 90, "wght" 600',
            letterSpacing: "-0.02em",
          }}
        >
          {activity.name}
        </h1>
        {activity.description && (
          <p className="mt-2 text-[12px] italic text-white/85 leading-relaxed">
            {activity.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
          <HeroStat
            label={isDistanceBased ? "Distance" : "Duration"}
            value={
              isDistanceBased
                ? formatKm(activity.distance, 2).replace(" km", "")
                : formatDuration(activity.movingTime)
            }
            unit={isDistanceBased ? "km" : ""}
            big
          />
          <HeroStat label="Time" value={formatDuration(activity.movingTime)} />
          <HeroStat label={sport === "ride" ? "Speed" : "Pace"} value={heroPace} />
        </div>

        <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-4 gap-2 text-center text-white/90 text-[11px]">
          {activity.averageHeartrate && (
            <DenseStat icon={<Heart size={11} />} value={Math.round(activity.averageHeartrate).toString()} unit="bpm" />
          )}
          {activity.totalElevationGain > 0 && (
            <DenseStat icon={<Mountain size={11} />} value={`${Math.round(activity.totalElevationGain)}`} unit="m" />
          )}
          {activity.calories != null && activity.calories > 0 && (
            <DenseStat icon={<Flame size={11} />} value={Math.round(activity.calories).toString()} unit="cal" />
          )}
          {activity.sufferScore != null && (
            <DenseStat icon={<Wind size={11} />} value={activity.sufferScore.toString()} unit="suffer" />
          )}
          {activity.averageWatts != null && (
            <DenseStat icon={<Zap size={11} />} value={Math.round(activity.averageWatts).toString()} unit="w avg" />
          )}
          {activity.deviceName && (
            <DenseStat icon={<Cpu size={11} />} value={activity.deviceName.split(" ")[0]} unit="device" />
          )}
        </div>

        {activity.prCount != null && activity.prCount > 0 && (
          <div className="mt-3 pt-3 border-t border-white/15 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-white">
            <Trophy size={11} strokeWidth={2.4} />
            {activity.prCount} PR{activity.prCount === 1 ? "" : "s"} earned
          </div>
        )}
      </CardCoral>

      {/* Map */}
      <div className="rise delay-2">
        <MapPolyline polyline={activity.polyline ?? activity.summaryPolyline} />
      </div>

      {/* HR + Elevation chart */}
      {streams &&
        (() => {
          const distance = streams.distance?.data as number[] | undefined;
          const altitude = streams.altitude?.data as number[] | undefined;
          const heartrate = streams.heartrate?.data as number[] | undefined;
          if (!distance) return null;
          return (
            <div className="rise delay-3">
              <HrElevationChart
                distance={distance}
                altitude={altitude}
                heartrate={heartrate}
              />
            </div>
          );
        })()}

      {/* Laps */}
      <div className="rise delay-4">
        <LapsTable laps={activity.laps} sport={sport} />
      </div>

      {/* Segment efforts */}
      <div className="rise delay-5">
        <SegmentEffortsList efforts={activity.segmentEfforts} />
      </div>

      <p className="rise delay-6 text-center text-[11px] text-ink-400 pt-2 pb-1">
        Powered by Strava · {date.getFullYear()}
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
  unit,
  big,
}: {
  label: string;
  value: string;
  unit?: string;
  big?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-widest font-semibold text-white/70">{label}</div>
      <div
        className={
          "mt-1 flex items-baseline justify-center gap-0.5 nums " +
          (big ? "font-display-compressed text-3xl leading-none" : "font-display-wide text-base leading-none")
        }
      >
        <span className="text-white">{value}</span>
        {unit && <span className="text-[11px] text-white/70">{unit}</span>}
      </div>
    </div>
  );
}

function DenseStat({
  icon,
  value,
  unit,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="opacity-80">{icon}</span>
      <span className="nums font-medium text-white text-[12px] leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-widest text-white/65">{unit}</span>
    </div>
  );
}
