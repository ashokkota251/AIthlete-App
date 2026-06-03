import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildDeepDive } from "@/lib/debrief-service";
import { resolveAthleteId } from "@/lib/athlete-id";
import {
  readDebriefEntry,
  writeDebriefPlan,
} from "@/lib/db/debrief-cache";

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
    const cached = await readDebriefEntry(userId, id);
    if (cached?.plan) {
      return NextResponse.json({ deep: cached.plan, cached: true });
    }

    const result = await buildDeepDive(session.accessToken, userId, id);
    await writeDebriefPlan(userId, id, result.deep);
    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    console.error("/api/activities/[id]/plan failed", err);
    return NextResponse.json({ error: "Failed to build plan" }, { status: 502 });
  }
}
