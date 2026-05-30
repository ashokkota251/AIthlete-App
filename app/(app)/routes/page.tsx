import Link from "next/link";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { Card } from "@/components/ui/card";
import { RouteMiniMap } from "@/components/route-mini-map";
import { ArrowLeft, Bike, Footprints, Download, Mountain, Map } from "lucide-react";
import { formatKm, formatDuration, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RoutesPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const routes = await provider
    .getAthleteRoutes(session!.stravaAthleteId!, 1, 30)
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
            <div className="eyebrow mb-1">{routes.length} saved · plan your next ride</div>
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
          Routes<span className="text-coral">.</span>
        </h1>
        <div className="rule-coral mt-4" />
      </header>

      {routes.length === 0 ? (
        <Card className="rise flex flex-col items-center text-center py-12 px-6 gap-3">
          <span className="size-12 rounded-2xl bg-coral-50 grid place-items-center text-coral">
            <Map size={18} strokeWidth={2} />
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
              No saved routes yet
            </div>
            <p className="mt-1 text-[12px] text-ink-500 leading-relaxed max-w-[34ch]">
              Build a route at <span className="font-semibold">strava.com/routes</span> and it&apos;ll show up here, ready to export as GPX for your watch or head unit.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3 list-none">
          {routes.map((route, i) => (
            <li
              key={route.idStr}
              className="rise"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <article className="card !p-3 flex items-center gap-3">
                <RouteMiniMap polyline={route.summaryPolyline} size={84} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="size-5 rounded-md bg-coral-50 grid place-items-center text-coral shrink-0">
                      {route.type === "Run" ? (
                        <Footprints size={11} strokeWidth={2.4} />
                      ) : (
                        <Bike size={11} strokeWidth={2.4} />
                      )}
                    </span>
                    <h3 className="font-display-wide text-[14px] leading-tight text-ink-900 truncate flex-1">
                      {route.name}
                    </h3>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-500 nums flex items-center gap-1.5">
                    <span>{formatKm(route.distance, 1)}</span>
                    {route.elevationGain > 0 && (
                      <>
                        <span className="text-ink-300">·</span>
                        <span className="flex items-center gap-0.5">
                          <Mountain size={10} className="text-coral" />
                          {Math.round(route.elevationGain)}m
                        </span>
                      </>
                    )}
                    {route.estimatedMovingTime != null && route.estimatedMovingTime > 0 && (
                      <>
                        <span className="text-ink-300">·</span>
                        <span>~{formatDuration(route.estimatedMovingTime)}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <a
                      href={`/api/routes/${route.id}/gpx`}
                      download={`${route.name.replace(/[^a-z0-9-_ ]/gi, "_")}.gpx`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-coral-50 text-coral-700 border border-coral-100 text-[11px] font-medium hover:bg-coral-100 transition-colors"
                    >
                      <Download size={11} strokeWidth={2.4} />
                      Export GPX
                    </a>
                  </div>
                </div>

                <div className="text-right text-[10px] text-ink-400 nums self-start shrink-0">
                  {formatDateShort(route.createdAt)}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
