import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildDebrief } from "@/lib/debrief-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const debrief = await buildDebrief({
      accessToken: session.accessToken,
      athleteId: session.stravaAthleteId ?? "",
      activityId: id,
    });
    return NextResponse.json(debrief);
  } catch (err) {
    console.error("/api/activities/[id]/debrief failed", err);
    return NextResponse.json({ error: "Failed to build debrief" }, { status: 502 });
  }
}
