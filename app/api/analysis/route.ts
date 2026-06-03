import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateAnalysis } from "@/lib/ai/analysis";
import { resolveAthleteId } from "@/lib/athlete-id";
import {
  readAnalysisForToday,
  writeAnalysisForToday,
} from "@/lib/db/analysis-cache";

export async function POST(req: Request) {
  const session = await auth();
  const userId = resolveAthleteId(session?.stravaAthleteId);
  if (!session?.accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // `?fresh=1` bypasses cache (regenerate button uses this).
  const url = new URL(req.url);
  const fresh = url.searchParams.get("fresh") === "1";

  try {
    if (!fresh) {
      const cached = await readAnalysisForToday(userId);
      if (cached) {
        return NextResponse.json({
          analysis: cached.data,
          count: cached.count,
          cached: true,
        });
      }
    }

    const provider = getStravaProvider({ accessToken: session.accessToken });
    const [activities, stats, zones] = await Promise.all([
      provider.getRecentActivities(userId, 10),
      provider.getAthleteStats(userId).catch(() => null),
      provider.getAthleteZones().catch(() => null),
    ]);
    const analysis = await generateAnalysis(activities, stats, zones);
    await writeAnalysisForToday(userId, activities.length, analysis);
    return NextResponse.json({ analysis, count: activities.length, cached: false });
  } catch (err) {
    console.error("/api/analysis failed", err);
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 502 });
  }
}
