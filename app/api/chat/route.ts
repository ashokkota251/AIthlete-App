import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { ANTHROPIC_MODEL, getAnthropic, hasAI } from "@/lib/ai/client";
import { buildCoachSystemPrompt } from "@/lib/ai/prompts";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const provider = getStravaProvider({ accessToken: session.accessToken });
  const activities = await provider.getRecentActivities(
    session.stravaAthleteId ?? "",
    10,
  );

  if (!hasAI()) {
    return NextResponse.json({
      message: localFallbackReply(body.messages[body.messages.length - 1].content, activities.length),
      fallback: true,
    });
  }

  const ai = getAnthropic()!;
  const system = buildCoachSystemPrompt(activities);

  try {
    const response = await ai.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
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
      message: localFallbackReply(body.messages[body.messages.length - 1].content, activities.length),
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
