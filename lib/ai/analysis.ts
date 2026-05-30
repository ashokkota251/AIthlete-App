import type { Activity } from "@/lib/strava/types";
import { ANTHROPIC_MODEL, getAnthropic } from "./client";
import { buildAnalysisMessages, summariseActivities } from "./prompts";

export interface AnalysisResult {
  summary: string;
  highlights: string[];
  improvements: string[];
  suggestions: string[];
  /** true => generated locally without AI (no API key) */
  fallback?: boolean;
}

/** Strip code fences if the model included them anyway. */
function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function parseAnalysis(text: string): AnalysisResult | null {
  try {
    const stripped = stripFences(text);
    const parsed = JSON.parse(stripped);
    if (
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.highlights) &&
      Array.isArray(parsed.improvements) &&
      Array.isArray(parsed.suggestions)
    ) {
      return {
        summary: parsed.summary,
        highlights: parsed.highlights.map(String).slice(0, 5),
        improvements: parsed.improvements.map(String).slice(0, 5),
        suggestions: parsed.suggestions.map(String).slice(0, 5),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateAnalysis(activities: Activity[]): Promise<AnalysisResult> {
  const ai = getAnthropic();

  if (!ai) {
    return fallbackAnalysis(activities);
  }

  const { system, user } = buildAnalysisMessages(activities);
  try {
    const response = await ai.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    const parsed = parseAnalysis(text);
    if (parsed) return parsed;
    return fallbackAnalysis(activities);
  } catch (err) {
    console.error("AI analysis failed; falling back.", err);
    return fallbackAnalysis(activities);
  }
}

/** Deterministic fallback so the UI still has something real to render without an API key. */
export function fallbackAnalysis(activities: Activity[]): AnalysisResult {
  const slim = summariseActivities(activities);
  const runs = slim.filter((a) => a.type === "Run");
  const rides = slim.filter((a) => a.type === "Ride" || a.type === "VirtualRide");
  const swims = slim.filter((a) => a.type === "Swim");
  const strength = slim.filter((a) => a.type === "WeightTraining" || a.type === "Workout");

  const totalKm = slim.reduce((s, a) => s + a.distance_km, 0);
  const longest = slim.reduce<typeof slim[number] | null>((best, a) =>
    !best || a.distance_km > best.distance_km ? a : best, null,
  );
  const totalHours = +(slim.reduce((s, a) => s + a.moving_minutes, 0) / 60).toFixed(1);

  const highlights: string[] = [];
  if (longest && longest.distance_km > 15) highlights.push(`Longest session was ${longest.distance_km} km — solid endurance work.`);
  if (runs.length >= 4) highlights.push(`${runs.length} runs in this block — consistent run frequency.`);
  if (strength.length >= 1) highlights.push(`You logged ${strength.length} strength session${strength.length > 1 ? "s" : ""} — keep that going.`);
  if (rides.length >= 1) highlights.push(`${rides.length} ride${rides.length > 1 ? "s" : ""} added meaningful aerobic volume.`);
  while (highlights.length < 3) highlights.push("Stayed active and showed up — that's the first win.");

  const improvements: string[] = [];
  const recoveryRuns = runs.filter((r) => r.avg_hr && r.avg_hr < 140).length;
  if (runs.length > 0 && recoveryRuns / runs.length < 0.3) {
    improvements.push("Low share of true easy runs — most sessions sit above easy HR.");
  }
  if (swims.length === 0) {
    improvements.push("No swim/cross-training this block — consider a low-impact session.");
  }
  if (improvements.length === 0) {
    improvements.push("Watch the day-to-day balance — back-to-back hard days are starting to show up.");
  }

  const suggestions: string[] = [
    "Hold one true easy run at conversational pace (HR < 140) to consolidate aerobic base.",
    "Add a short tempo session mid-week — 20-minute block at threshold effort.",
    "Schedule one full rest day; recovery is where the adaptation lands.",
  ];

  return {
    summary: `You covered ${totalKm.toFixed(1)} km across ${slim.length} sessions (${totalHours} h of moving time). The block leans on endurance running with supporting strength and aerobic cross-training — strong volume foundation.`,
    highlights: highlights.slice(0, 3),
    improvements: improvements.slice(0, 2),
    suggestions,
    fallback: true,
  };
}
