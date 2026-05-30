import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const activities = await provider.getRecentActivities(
      session.stravaAthleteId ?? "",
      parsed.data.limit,
    );
    return NextResponse.json({ activities });
  } catch (err) {
    console.error("/api/activities failed", err);
    return NextResponse.json({ error: "Failed to load activities" }, { status: 502 });
  }
}
