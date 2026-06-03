import { Target } from "lucide-react";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { resolveAthleteId } from "@/lib/athlete-id";
import { GoalsClient } from "@/components/goals/goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const session = await auth();
  const athleteId = resolveAthleteId(session?.stravaAthleteId);
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  // 50 covers typical goal windows; client computes progress for each goal locally.
  const activities = await provider.getRecentActivities(athleteId, 50).catch(() => []);

  return (
    <div className="space-y-3 pb-2">
      <header className="rise">
        <div className="eyebrow flex items-center gap-1.5">
          <Target size={11} className="text-coral" />
          What you&rsquo;re chasing
        </div>
        <h1 className="mt-1 font-display font-bold tracking-tight text-[32px] leading-[1] text-ink-900">
          Goals<span className="text-coral">.</span>
        </h1>
        <div className="rule-coral mt-4" />
      </header>

      <GoalsClient athleteId={athleteId} activities={activities} />
    </div>
  );
}
