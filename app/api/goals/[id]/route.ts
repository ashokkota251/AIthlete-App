import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveAthleteId } from "@/lib/athlete-id";
import { deleteGoalRow, getGoal, upsertGoal } from "@/lib/db/goals";

const updateSchema = z.object({
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = resolveAthleteId(session?.stravaAthleteId);
  if (!session?.accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    const existing = await getGoal(userId, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const merged = { id, ...body };
    await upsertGoal(userId, merged);
    return NextResponse.json({ goal: merged });
  } catch (err) {
    console.error("/api/goals/[id] PUT failed", err);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 502 });
  }
}

export async function DELETE(
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
    await deleteGoalRow(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("/api/goals/[id] DELETE failed", err);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 502 });
  }
}
