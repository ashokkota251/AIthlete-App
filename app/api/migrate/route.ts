import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveAthleteId } from "@/lib/athlete-id";
import { insertGoalIfAbsent } from "@/lib/db/goals";
import { insertTipIfAbsent } from "@/lib/db/tip-cache";
import { insertAnalysisIfAbsent } from "@/lib/db/analysis-cache";
import { insertDebriefIfAbsent } from "@/lib/db/debrief-cache";

const goalSchema = z.object({
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

const tipEntrySchema = z.object({
  goalId: z.string().min(1),
  tipDate: z.string().min(10),
  tip: z.object({
    headline: z.string(),
    sentiment: z.enum(["ready", "building", "behind", "at_risk"]),
    status: z.string(),
    actions: z.array(z.string()),
    improve: z.string(),
  }),
});

const analysisEntrySchema = z.object({
  date: z.string().min(10),
  count: z.number(),
  data: z.object({
    summary: z.string(),
    highlights: z.array(z.string()),
    improvements: z.array(z.string()),
    suggestions: z.array(z.string()),
    fallback: z.boolean().optional(),
  }),
});

const debriefEntrySchema = z.object({
  activityId: z.string().min(1),
  savedAt: z.number().optional(),
  debrief: z
    .object({
      verdict: z.string(),
      sentiment: z.enum(["nailed_it", "solid", "off_target", "red_flag"]),
      wentWell: z.array(z.string()),
      toWatch: z.array(z.string()),
      loadImpact: z.string(),
      nextAction: z.string(),
    })
    .optional(),
  plan: z
    .object({
      restActions: z.array(z.string()),
      nextRide: z.object({
        title: z.string(),
        when: z.string(),
        durationMin: z.number(),
        intensity: z.string(),
        targetHr: z.string(),
        why: z.string(),
      }),
    })
    .optional(),
});

const bodySchema = z.object({
  goals: z.array(goalSchema).optional(),
  tips: z.array(tipEntrySchema).optional(),
  analysis: z.array(analysisEntrySchema).optional(),
  debrief: z.array(debriefEntrySchema).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = resolveAthleteId(session?.stravaAthleteId);
  if (!session?.accessToken || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    console.error("/api/migrate body parse failed", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const counts = { goals: 0, tips: 0, analysis: 0, debrief: 0 };
  try {
    for (const g of body.goals ?? []) {
      await insertGoalIfAbsent(userId, g);
      counts.goals++;
    }
    for (const t of body.tips ?? []) {
      await insertTipIfAbsent(userId, t.goalId, t.tipDate, t.tip);
      counts.tips++;
    }
    for (const a of body.analysis ?? []) {
      await insertAnalysisIfAbsent(userId, a.date, a.count, a.data);
      counts.analysis++;
    }
    for (const d of body.debrief ?? []) {
      await insertDebriefIfAbsent(userId, d.activityId, {
        debrief: d.debrief,
        plan: d.plan,
        savedAt: d.savedAt,
      });
      counts.debrief++;
    }
    return NextResponse.json({ migrated: counts });
  } catch (err) {
    console.error("/api/migrate failed", err);
    return NextResponse.json({ error: "Migration failed" }, { status: 502 });
  }
}
