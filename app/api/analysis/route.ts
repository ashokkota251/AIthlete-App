import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateAnalysis } from "@/lib/ai/analysis";

export async function POST() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const activities = await provider.getRecentActivities(
      session.stravaAthleteId ?? "",
      10,
    );
    const analysis = await generateAnalysis(activities);
    return NextResponse.json({ analysis, count: activities.length });
  } catch (err) {
    console.error("/api/analysis failed", err);
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 502 });
  }
}
