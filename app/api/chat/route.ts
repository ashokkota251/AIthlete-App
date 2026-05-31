import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { ANTHROPIC_MODEL, getAnthropic, hasAI } from "@/lib/ai/client";
import { buildCoachSystemPrompt } from "@/lib/ai/prompts";
import {
  RED_FLAG_RESPONSE,
  STRETCHES,
  detectArea,
  hasRedFlag,
  sportForActivityType,
  stretchesForArea,
} from "@/lib/recovery";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const PAIN_KEYWORDS = [
  "pain", "hurt", "hurts", "tight", "tightness", "sore", "soreness",
  "ache", "aches", "aching", "stiff", "stiffness", "cramp", "knot",
  "discomfort", "twinge",
];

function isRecoveryQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return PAIN_KEYWORDS.some((k) => lower.includes(k));
}

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

  const lastUserMsg = body.messages[body.messages.length - 1].content;

  // Red-flag bypass — never invoke the AI on severe-symptom keywords.
  if (hasRedFlag(lastUserMsg)) {
    return NextResponse.json({ message: RED_FLAG_RESPONSE, redFlag: true });
  }

  const provider = getStravaProvider({ accessToken: session.accessToken });
  const athleteId = session.stravaAthleteId ?? "";

  const [activities, stats, zones] = await Promise.all([
    provider.getRecentActivities(athleteId, 10),
    provider.getAthleteStats(athleteId).catch(() => null),
    provider.getAthleteZones().catch(() => null),
  ]);

  // Recovery-mode detection — if the user mentions pain/tightness, load
  // the relevant stretch catalogue subset for the AI to pick from.
  const recoveryMode = isRecoveryQuestion(lastUserMsg);
  let stretchCatalogue: unknown[] | undefined;
  if (recoveryMode) {
    const area = detectArea(lastUserMsg);
    const sport = activities[0] ? sportForActivityType(activities[0].type) : "any";
    const picks = area
      ? stretchesForArea(area, sport, 8)
      : // No specific body part mentioned — give the AI a sport-appropriate sample.
        STRETCHES.filter((s) => s.sportRelevance.includes(sport) || s.sportRelevance.includes("any")).slice(0, 10);

    // Slim each catalogue entry to only the fields the AI needs to pick.
    stretchCatalogue = picks.map((s) => ({
      id: s.id,
      name: s.name,
      target: s.targetArea,
      secondary: s.secondaryAreas,
      durationSec: s.durationSec,
      sides: s.sides,
      description: s.description,
      sports: s.sportRelevance,
    }));
  }

  if (!hasAI()) {
    return NextResponse.json({
      message: localFallbackReply(lastUserMsg, activities.length),
      fallback: true,
    });
  }

  const ai = getAnthropic()!;
  const system = buildCoachSystemPrompt(
    { activities, stats, zones },
    recoveryMode ? { recoveryMode: true, stretchCatalogue } : undefined,
  );

  try {
    const response = await ai.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      system,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    return NextResponse.json({ message: text });
  } catch (err) {
    console.error("/api/chat failed", err);
    return NextResponse.json({
      message: localFallbackReply(lastUserMsg, activities.length),
      fallback: true,
    });
  }
}

function localFallbackReply(userText: string, activityCount: number): string {
  const t = userText.toLowerCase().trim();

  const offTopicKeywords = [
    "code", "javascript", "python", "weather", "news", "politics",
    "stock", "math", "recipe", "movie", "history",
  ];
  if (offTopicKeywords.some((k) => t.includes(k))) {
    return "I'm built to focus on your training — let's keep the conversation on workouts, pacing, recovery, or your plan. What about your training would you like to dig into?";
  }

  // Recovery-question fallback when no API key is available — pick a few stretches deterministically.
  if (PAIN_KEYWORDS.some((k) => t.includes(k))) {
    const area = detectArea(t);
    const picks = area ? stretchesForArea(area, "any", 3) : STRETCHES.slice(0, 3);
    const tokens = picks.map((s) => `[STRETCH: ${s.id}]`).join("\n");
    return [
      "### Why it's tight",
      "Normal post-activity tightness in that area. Targeted mobility will help it settle.",
      "",
      "### Try these",
      tokens,
      "",
      "### When to see someone",
      "If it persists past **48 hours**, sharpens, or radiates, see a sports physio.",
    ].join("\n");
  }

  if (t.includes("rest") || t.includes("tired") || t.includes("recover")) {
    return `Looking at your last ${activityCount} sessions, a true easy day looks well-earned. Either a 20–30 min recovery jog at conversational pace, or a full rest day — both work. Sleep wins the next workout.`;
  }
  if (t.includes("plan") || t.includes("week")) {
    return "Here's a starting frame for next week: 2 easy aerobic runs, 1 quality session (tempo or intervals), 1 long run, 1 strength session, and 1–2 full rest days. Tell me your goal race or target and I'll tighten it up.";
  }
  if (t.includes("pace") || t.includes("tempo") || t.includes("threshold")) {
    return "For a tempo session, target a sustainable effort — 'comfortably hard,' usually 25–35s/km slower than your 10K pace. Twenty minutes is a good starting block; build to two ×15 min as fitness comes in.";
  }
  return "Tell me a bit more — are you asking about a specific session, the overall week, or recovery? I can use your last 10 activities to ground the answer.";
}
