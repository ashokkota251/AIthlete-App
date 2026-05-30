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
    const zones = await provider.getAthleteZones();
    return NextResponse.json({ zones });
  } catch (err) {
    console.error("/api/athlete/zones failed", err);
    return NextResponse.json({ error: "Failed to load zones" }, { status: 502 });
  }
}
