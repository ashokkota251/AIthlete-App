import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { ActivitiesList } from "@/components/activities/activities-list";

export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 10;

export default async function ActivitiesPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const activities = await provider.getRecentActivities(
    session!.stravaAthleteId!,
    INITIAL_LIMIT,
    1,
  );

  return (
    <ActivitiesList
      initial={activities}
      initialHasMore={activities.length === INITIAL_LIMIT}
    />
  );
}
