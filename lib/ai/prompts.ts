import type { Activity } from "@/lib/strava/types";

/** Shape we slim the activities down to before injecting into prompts. */
export interface PromptActivity {
  name: string;
  type: string;
  date: string;
  distance_km: number;
  moving_minutes: number;
  pace_per_km?: string;
  speed_kmh?: number;
  avg_hr?: number;
  elev_m: number;
}

export function summariseActivities(activities: Activity[]): PromptActivity[] {
  return activities.map((a) => {
    const distance_km = +(a.distance / 1000).toFixed(2);
    const moving_minutes = +(a.movingTime / 60).toFixed(1);
    const out: PromptActivity = {
      name: a.name,
      type: a.type,
      date: a.startDate,
      distance_km,
      moving_minutes,
      elev_m: Math.round(a.totalElevationGain),
    };
    if (a.averageSpeed) {
      if (a.type === "Ride" || a.type === "VirtualRide") {
        out.speed_kmh = +(a.averageSpeed * 3.6).toFixed(1);
      } else if (a.distance > 0) {
        const secs = 1000 / a.averageSpeed;
        const m = Math.floor(secs / 60);
        const s = Math.round(secs % 60);
        out.pace_per_km = `${m}:${String(s).padStart(2, "0")}`;
      }
    }
    if (a.averageHeartrate) out.avg_hr = Math.round(a.averageHeartrate);
    return out;
  });
}

export const COACH_SYSTEM_PROMPT = `You are AIthlete Coach, an AI training assistant inside a fitness app.

You ONLY help with: the user's workouts, activities, training plans, pacing,
recovery, performance strategy, race preparation, and general training nutrition.
Base your answers on the user's recent activity data provided below.

If the user asks about anything outside training and fitness (general knowledge,
coding, news, personal advice unrelated to training, current events, math, etc.),
politely decline in one sentence and steer them back to their training. Do not
answer the off-topic question, do not roleplay around it, do not give partial
information about it.

Be concise (typically 2-4 sentences), specific, and encouraging. Reference the
user's actual numbers (distances, paces, heart rate, frequency) when relevant.
Do not invent data that is not in the provided activities. If asked about
something the activity data doesn't cover, say so plainly.

You are not a doctor — for pain, injury, or medical concerns, recommend seeing
a professional.`;

export function buildCoachSystemPrompt(activities: Activity[]): string {
  const slim = summariseActivities(activities.slice(0, 10));
  return `${COACH_SYSTEM_PROMPT}\n\nUSER'S RECENT ACTIVITIES (JSON):\n${JSON.stringify(slim, null, 2)}`;
}

export const ANALYSIS_INSTRUCTION = `Analyze these activities and respond with ONLY valid JSON, no markdown, no prose, no code fences. Use this schema exactly:

{
  "summary": string,                 // 2-3 sentence overview of the block
  "highlights": string[],            // 3 short bullets — the best things / wins
  "improvements": string[],          // 2 short bullets — what's slipping or risky
  "suggestions": string[]            // 2-3 concrete next steps for next week
}

Reference real numbers from the data (km, pace, HR). Keep each bullet to one sentence. Be encouraging but specific.`;

export function buildAnalysisMessages(activities: Activity[]): {
  system: string;
  user: string;
} {
  const slim = summariseActivities(activities.slice(0, 10));
  return {
    system:
      "You are AIthlete's analysis engine. You return strict JSON with no surrounding text and never include markdown.",
    user: `${ANALYSIS_INSTRUCTION}\n\nUSER'S RECENT ACTIVITIES (JSON):\n${JSON.stringify(slim, null, 2)}`,
  };
}
