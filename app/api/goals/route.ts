import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveAthleteId } from "@/lib/athlete-id";
import { listGoals, upsertGoal } from "@/lib/db/goals";
import type { Goal } from "@/lib/goals/types";

const goalCreateSchema = z.object({
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
});

export async function GET() {
  const session = await auth();
  const userId = resolveAthleteId(session?.stravaAthleteId);
  if (!session?.accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const goals = await listGoals(userId);
    return NextResponse.json({ goals });
  } catch (err) {
    console.error("/api/goals GET failed", err);
    return NextResponse.json({ error: "Failed to list goals" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = resolveAthleteId(session?.stravaAthleteId);
  if (!session?.accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let goal: Goal;
  try {
    goal = goalCreateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    await upsertGoal(userId, goal);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (err) {
    console.error("/api/goals POST failed", err);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 502 });
  }
}
