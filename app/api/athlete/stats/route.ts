import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const stats = await provider.getAthleteStats(session.stravaAthleteId ?? "");
    return NextResponse.json({ stats });
  } catch (err) {
    console.error("/api/athlete/stats failed", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 502 });
  }
}
