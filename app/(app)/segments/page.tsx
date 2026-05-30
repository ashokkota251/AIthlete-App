import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mountain, Star, Trophy } from "lucide-react";
import { formatKm, formatDuration, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

const CLIMB_LABEL: Record<number, string> = {
  0: "Flat",
  1: "Cat 4",
  2: "Cat 3",
  3: "Cat 2",
  4: "Cat 1",
  5: "HC",
};

export default async function SegmentsPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const segments = await provider
    .getStarredSegments(1, 30)
    .catch(() => []);

  return (
    <div className="space-y-5 pb-2">
      <header className="rise">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="size-9 rounded-pill border border-ink-100 bg-paper grid place-items-center text-ink-700 hover:border-ink-300 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
          </Link>
          <div className="flex-1 text-right">
            <div className="eyebrow mb-1">
              {segments.length} starred · benchmark efforts
            </div>
          </div>
        </div>
        <h1
          className="mt-2 text-ink-900 text-[32px] leading-[1]"
          style={{
            fontFamily: "var(--font-display)",
            fontVariationSettings: '"opsz" 96, "wdth" 88, "wght" 600',
            letterSpacing: "-0.03em",
          }}
        >
          Segments<span className="text-coral">.</span>
        </h1>
        <div className="rule-coral mt-4" />
      </header>

      {segments.length === 0 ? (
        <Card className="rise flex flex-col items-center text-center py-12 px-6 gap-3">
          <span className="size-12 rounded-2xl bg-coral-50 grid place-items-center text-coral">
            <Star size={18} strokeWidth={2} />
          </span>
          <div>
            <div
              className="text-ink-900 text-lg leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontVariationSettings: '"opsz" 64, "wdth" 92, "wght" 600',
                letterSpacing: "-0.02em",
              }}
            >
              No starred segments yet
            </div>
            <p className="mt-1 text-[12px] text-ink-500 leading-relaxed max-w-[34ch]">
              Star a segment on Strava (web or mobile) and it&apos;ll appear here
              as a benchmark you can chase.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3 list-none">
          {segments.map((s, i) => (
            <li
              key={s.id}
              className="rise"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <SegmentRow segment={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SegmentRow({
  segment,
}: {
  segment: Awaited<ReturnType<import("@/lib/strava/types").StravaProvider["getStarredSegments"]>>[number];
}) {
  const climbCat =
    segment.climbCategory != null ? CLIMB_LABEL[segment.climbCategory] ?? `Cat ${segment.climbCategory}` : null;

  return (
    <article className="card !p-4 flex items-center gap-3">
      <span className="shrink-0 size-11 rounded-2xl bg-coral-50 grid place-items-center text-coral">
        <Mountain size={18} strokeWidth={2.2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display-wide text-[15px] leading-tight text-ink-900 truncate">
            {segment.name}
          </h3>
          <span className="eyebrow shrink-0">{segment.activityType}</span>
        </div>
        <div className="mt-1 text-[11px] text-ink-500 nums flex items-center gap-1.5">
          <span>{formatKm(segment.distance, 2)}</span>
          {segment.averageGrade != null && (
            <>
              <span className="text-ink-300">·</span>
              <span>{segment.averageGrade.toFixed(1)}%</span>
            </>
          )}
          {climbCat && (
            <>
              <span className="text-ink-300">·</span>
              <span>{climbCat}</span>
            </>
          )}
          {segment.city && (
            <>
              <span className="text-ink-300">·</span>
              <span className="truncate">{segment.city}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        {segment.prTime ? (
          <>
            <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold text-coral leading-none">
              <Trophy size={10} strokeWidth={2.4} /> PR
            </div>
            <div className="mt-1 font-display-wide text-sm nums text-ink-900 leading-none">
              {formatDuration(segment.prTime)}
            </div>
            {segment.prDate && (
              <div className="mt-0.5 text-[10px] text-ink-400 nums">
                {formatDateShort(segment.prDate)}
              </div>
            )}
          </>
        ) : (
          <div className="text-[11px] text-ink-400">
            {segment.effortCount ? `${segment.effortCount} efforts` : "Never attempted"}
          </div>
        )}
      </div>
    </article>
  );
}
