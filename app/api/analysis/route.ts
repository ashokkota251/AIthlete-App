import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateAnalysis } from "@/lib/ai/analysis";
import { resolveAthleteId } from "@/lib/athlete-id";

export async function POST() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const athleteId = resolveAthleteId(session.stravaAthleteId);
    const [activities, stats, zones] = await Promise.all([
      provider.getRecentActivities(athleteId, 10),
      provider.getAthleteStats(athleteId).catch(() => null),
      provider.getAthleteZones().catch(() => null),
    ]);
    const analysis = await generateAnalysis(activities, stats, zones);
    return NextResponse.json({ analysis, count: activities.length });
  } catch (err) {
    console.error("/api/analysis failed", err);
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 502 });
  }
}
