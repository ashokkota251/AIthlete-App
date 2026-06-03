import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildDebrief } from "@/lib/debrief-service";
import { resolveAthleteId } from "@/lib/athlete-id";
import {
  readDebriefEntry,
  writeDebriefNarration,
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
    if (cached?.debrief) {
      return NextResponse.json({ narration: cached.debrief, cached: true });
    }

    const debrief = await buildDebrief(session.accessToken, userId, id);
    await writeDebriefNarration(userId, id, debrief.narration);
    return NextResponse.json({ ...debrief, cached: false });
  } catch (err) {
    console.error("/api/activities/[id]/debrief failed", err);
    return NextResponse.json({ error: "Failed to build debrief" }, { status: 502 });
  }
}
