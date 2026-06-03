import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { generateGoalTip } from "@/lib/ai/goal-tip";
import { resolveAthleteId } from "@/lib/athlete-id";

const bodySchema = z.object({
  goal: z.object({
    id: z.string().min(1),
    sport: z.enum([
      "Ride",
      "Run",
      "Swim",
      "Workout",
      "WeightTraining",
      "Hike",
      "Walk",
    ]),
    metric: z.enum(["distance", "time"]),
    eventTarget: z.number().positive(),
    eventDate: z.string().min(10),
    title: z.string(),
    createdAt: z.number(),
    archivedAt: z.number().optional(),
  }),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const provider = getStravaProvider({ accessToken: session.accessToken });
    const athleteId = resolveAthleteId(session.stravaAthleteId);
    // 60 activities covers the 60-day readiness lookback at typical training density.
    const activities = await provider.getRecentActivities(athleteId, 60);
    const result = await generateGoalTip(body.goal, activities);
    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/goals/[id]/tip failed", err);
    return NextResponse.json({ error: "Failed to generate tip" }, { status: 502 });
  }
}
