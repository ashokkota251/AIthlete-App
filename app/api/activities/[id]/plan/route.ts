import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildDeepDive } from "@/lib/debrief-service";
import { resolveAthleteId } from "@/lib/athlete-id";

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
    const deep = await buildDeepDive(
      session.accessToken,
      resolveAthleteId(session.stravaAthleteId),
      id,
    );
    return NextResponse.json(deep);
  } catch (err) {
    console.error("/api/activities/[id]/plan failed", err);
    return NextResponse.json({ error: "Failed to build plan" }, { status: 502 });
  }
}
