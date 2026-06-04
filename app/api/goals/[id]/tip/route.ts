import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateGoalTip } from "@/lib/ai/goal-tip";
import { resolveAthleteId } from "@/lib/athlete-id";
import { getGoal } from "@/lib/db/goals";
import { readTipForToday, writeTipForToday } from "@/lib/db/tip-cache";
import {
  computeTrainingStats,
  latestActivityId,
} from "@/lib/goals/progress";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = resolveAthleteId(session?.stravaAthleteId);
  if (!session?.accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const goal = await getGoal(userId, id);
    if (!goal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const provider = getStravaProvider({ accessToken: session.accessToken });
    const activities = await provider.getRecentActivities(userId, 60);
    const stats = computeTrainingStats(goal, activities);
    const latest = latestActivityId(activities);

    // Freshness check: if today's cached tip was generated against the same
    // most-recent activity we just fetched, return it. Any new activity since
    // then invalidates the cache and forces regeneration.
    const cached = await readTipForToday(userId, id);
    if (cached && cached.lastActivityId === latest) {
      return NextResponse.json({
        tip: cached.tip,
        stats,
        cached: true,
      });
    }

    const result = await generateGoalTip(goal, activities);
    await writeTipForToday(userId, id, result.tip, latest);
    return NextResponse.json({
      tip: result.tip,
      stats: result.stats,
      cached: false,
    });
  } catch (err) {
    console.error("/api/goals/[id]/tip failed", err);
    return NextResponse.json({ error: "Failed to generate tip" }, { status: 502 });
  }
}
