import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateGoalTip } from "@/lib/ai/goal-tip";
import { resolveAthleteId } from "@/lib/athlete-id";
import { getGoal } from "@/lib/db/goals";
import { readTipForToday, writeTipForToday } from "@/lib/db/tip-cache";
import { computeGoalReadiness } from "@/lib/goals/progress";

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

    // Fetch activities once — needed for readiness either way.
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const activities = await provider.getRecentActivities(userId, 60);
    const readiness = computeGoalReadiness(goal, activities);

    // Cache check: if today's tip exists, return it without an AI call.
    const cached = await readTipForToday(userId, id);
    if (cached) {
      return NextResponse.json({ tip: cached, readiness, cached: true });
    }

    const result = await generateGoalTip(goal, activities);
    await writeTipForToday(userId, id, result.tip);
    return NextResponse.json({ tip: result.tip, readiness: result.readiness, cached: false });
  } catch (err) {
    console.error("/api/goals/[id]/tip failed", err);
    return NextResponse.json({ error: "Failed to generate tip" }, { status: 502 });
  }
}
