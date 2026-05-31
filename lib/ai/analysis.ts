import type { Activity, AthleteStats, AthleteZones } from "@/lib/strava/types";
import { chat, hasAI } from "./client";
import { buildAnalysisMessages, summariseActivities } from "./prompts";
import {
  acuteChronicRatio,
  hrZones,
  sportDistribution,
  timeInZoneFromAverages,
} from "@/lib/training";

export interface AnalysisResult {
  summary: string;
  highlights: string[];
  improvements: string[];
  suggestions: string[];
  /** true => generated locally without AI (no API key) */
  fallback?: boolean;
}

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

export async function generateAnalysis(
  activities: Activity[],
  stats?: AthleteStats | null,
  zones?: AthleteZones | null,
): Promise<AnalysisResult> {
  if (!hasAI()) return fallbackAnalysis(activities, stats, zones);

  const { system, user } = buildAnalysisMessages({ activities, stats, zones });
  const text = await chat({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 1024,
    format: "json",
  });
  if (text) {
    const parsed = parseAnalysis(text);
    if (parsed) return parsed;
  }
  return fallbackAnalysis(activities, stats, zones);
}

export function fallbackAnalysis(
  activities: Activity[],
  stats?: AthleteStats | null,
  zones?: AthleteZones | null,
): AnalysisResult {
  const slim = summariseActivities(activities);
  const runs = slim.filter((a) => a.type === "Run");
  const rides = slim.filter((a) => a.type === "Ride" || a.type === "VirtualRide");
  const swims = slim.filter((a) => a.type === "Swim");
  const strength = slim.filter((a) => a.type === "WeightTraining" || a.type === "Workout");

  const totalKm = slim.reduce((s, a) => s + a.distance_km, 0);
  const longest = slim.reduce<typeof slim[number] | null>(
    (best, a) => (!best || a.distance_km > best.distance_km ? a : best),
    null,
  );
  const totalHours = +(slim.reduce((s, a) => s + a.moving_minutes, 0) / 60).toFixed(1);
  const acr = acuteChronicRatio(activities);

  const highlights: string[] = [];
  if (longest && longest.distance_km > 15)
    highlights.push(`Longest session was ${longest.distance_km} km — solid endurance work.`);
  if (runs.length >= 4)
    highlights.push(`${runs.length} runs in this block — consistent run frequency.`);
  if (strength.length >= 1)
    highlights.push(`You logged ${strength.length} strength session${strength.length > 1 ? "s" : ""} — keep that going.`);
  if (rides.length >= 1)
    highlights.push(`${rides.length} ride${rides.length > 1 ? "s" : ""} added meaningful aerobic volume.`);
  if (stats && stats.ytdRunTotals.distance > 0) {
    highlights.push(`YTD run total: ${(stats.ytdRunTotals.distance / 1000).toFixed(0)} km across ${stats.ytdRunTotals.count} sessions.`);
  }
  while (highlights.length < 3) highlights.push("Stayed active and showed up — that's the first win.");

  const improvements: string[] = [];
  if (acr.band === "overload") {
    improvements.push(`Acute load is ${acr.ratio.toFixed(2)}× your 28-day baseline — schedule a recovery day before more quality.`);
  }
  if (acr.band === "detrained") {
    improvements.push("Volume has dropped — rebuild gradually, no spike weeks.");
  }
  const bins = hrZones(zones ?? null);
  if (bins) {
    const tiz = timeInZoneFromAverages(activities, bins, 7);
    const tempo = tiz[2]?.share ?? 0;
    if (tempo > 0.4) {
      improvements.push(`${Math.round(tempo * 100)}% of last week sat in Z3 — back off the middle and split into easy + hard.`);
    }
  }
  if (swims.length === 0 && !improvements.find((i) => i.includes("Z3"))) {
    improvements.push("No swim/cross-training this block — consider a low-impact session.");
  }
  if (improvements.length === 0) {
    improvements.push("Watch the day-to-day balance — back-to-back hard days are starting to show up.");
  }

  const balance = sportDistribution(activities, 31);
  const dominant = balance[0];
  const suggestions: string[] = [
    "Hold one true easy run at conversational pace (HR < 140) to consolidate aerobic base.",
    "Add a short tempo session mid-week — 20-minute block at threshold effort.",
    "Schedule one full rest day; recovery is where the adaptation lands.",
  ];
  if (dominant && dominant.share > 0.8) {
    suggestions[2] = `Your training is ${Math.round(dominant.share * 100)}% ${dominant.family} this month — add one cross-training session for balance.`;
  }

  return {
    summary: `You covered ${totalKm.toFixed(1)} km across ${slim.length} sessions (${totalHours} h moving). ACR ${acr.ratio.toFixed(2)} — ${acr.band === "sweet" ? "in the sweet spot" : acr.band}. ${stats ? `YTD total: ${((stats.ytdRunTotals.distance + stats.ytdRideTotals.distance + stats.ytdSwimTotals.distance) / 1000).toFixed(0)} km.` : ""}`,
    highlights: highlights.slice(0, 3),
    improvements: improvements.slice(0, 2),
    suggestions,
    fallback: true,
  };
}
