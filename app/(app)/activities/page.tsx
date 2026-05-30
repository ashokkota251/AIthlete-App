import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { ActivityCard } from "@/components/activity-card";
import { RefreshCcw, ListFilter } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const activities = await provider.getRecentActivities(
    session!.stravaAthleteId!,
    10,
  );

  return (
    <div className="space-y-5">
      <header className="rise">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow mb-1">Last {activities.length} sessions</div>
            <h1 className="font-display-wide text-[32px] leading-[1] text-ink-900">
              Recent<span className="text-coral">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost !px-3 !py-2" aria-label="Filter">
              <ListFilter size={14} />
              <span className="text-xs">Filter</span>
            </button>
            <Link
              href="/activities"
              className="btn-subtle btn-pill !px-3 !py-2 bg-coral-50 text-coral-700 border border-coral-100"
              aria-label="Refresh"
            >
              <RefreshCcw size={14} />
            </Link>
          </div>
        </div>
        <div className="rule-coral mt-4" />
      </header>

      <ul className="space-y-3 list-none">
        {activities.map((a, i) => (
          <li key={a.id}>
            <ActivityCard activity={a} index={i} />
          </li>
        ))}
      </ul>

      <p className="rise text-center text-[11px] text-ink-400 pt-2 pb-1">
        End of recent activity · pull-to-refresh coming soon
      </p>
    </div>
  );
}
