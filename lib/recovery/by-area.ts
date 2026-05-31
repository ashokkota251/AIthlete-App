import { STRETCHES } from "./stretches";
import type { BodyArea, RecoverySport, Stretch } from "./types";

const RUN_AREAS: BodyArea[] = ["calves", "hamstrings", "quads", "itBand", "hipFlexors", "glutes", "feet", "ankles"];
const RIDE_AREAS: BodyArea[] = ["lowerBack", "hipFlexors", "glutes", "neck", "quads", "hamstrings", "shoulders", "upperBack"];
const SWIM_AREAS: BodyArea[] = ["shoulders", "lats", "upperBack", "neck", "chest"];
const STRENGTH_AREAS: BodyArea[] = ["lowerBack", "glutes", "shoulders", "upperBack", "chest", "hamstrings"];

/** Areas to surface first on the body-check card, ordered by sport relevance. */
export function areasForSport(sport: RecoverySport): BodyArea[] {
  const primary =
    sport === "run"
      ? RUN_AREAS
      : sport === "ride"
        ? RIDE_AREAS
        : sport === "swim"
          ? SWIM_AREAS
          : sport === "strength"
            ? STRENGTH_AREAS
            : [];
  const all: BodyArea[] = [
    "calves",
    "quads",
    "hamstrings",
    "hipFlexors",
    "glutes",
    "lowerBack",
    "upperBack",
    "itBand",
    "shoulders",
    "neck",
    "ankles",
    "feet",
    "lats",
    "chest",
  ];
  const seen = new Set<BodyArea>();
  const out: BodyArea[] = [];
  for (const a of [...primary, ...all]) {
    if (!seen.has(a)) {
      seen.add(a);
      out.push(a);
    }
  }
  return out;
}

/**
 * Return stretches targeting the given area, sorted by:
 *   1. exact targetArea match
 *   2. secondary-area match
 *   3. sport relevance
 */
export function stretchesForArea(
  area: BodyArea,
  sport: RecoverySport = "any",
  limit = 6,
): Stretch[] {
  const scored = STRETCHES.map((s) => {
    let score = 0;
    if (s.targetArea === area) score += 10;
    if (s.secondaryAreas?.includes(area)) score += 4;
    if (s.sportRelevance.includes(sport)) score += 2;
    if (s.sportRelevance.includes("any")) score += 1;
    return { s, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
  return scored;
}

/** Map a free-text fragment from the user's message to a body area. */
const KEYWORD_TO_AREA: Array<{ rx: RegExp; area: BodyArea }> = [
  { rx: /\b(calf|calves)\b/i, area: "calves" },
  { rx: /\b(quad|quads|thigh\s*front|front\s*of\s*(?:my\s*)?thigh)\b/i, area: "quads" },
  { rx: /\b(hamstring|hamstrings|back\s*of\s*(?:my\s*)?thigh)\b/i, area: "hamstrings" },
  { rx: /\b(hip\s*flex|hip\s*flexors?)\b/i, area: "hipFlexors" },
  { rx: /\b(glute|glutes|butt|piriformis)\b/i, area: "glutes" },
  { rx: /\b(lower\s*back|lumbar|low\s*back)\b/i, area: "lowerBack" },
  { rx: /\b(upper\s*back|thoracic|mid-?back)\b/i, area: "upperBack" },
  { rx: /\b(it\s*band|iliotibial)\b/i, area: "itBand" },
  { rx: /\b(shoulder|shoulders|rotator\s*cuff|delts?)\b/i, area: "shoulders" },
  { rx: /\b(neck|trap|traps)\b/i, area: "neck" },
  { rx: /\b(ankle|ankles)\b/i, area: "ankles" },
  { rx: /\b(plantar|arch|sole|feet|foot)\b/i, area: "feet" },
  { rx: /\b(lat|lats|latissimus)\b/i, area: "lats" },
  { rx: /\b(chest|pec|pecs)\b/i, area: "chest" },
];

export function detectArea(text: string): BodyArea | null {
  for (const { rx, area } of KEYWORD_TO_AREA) {
    if (rx.test(text)) return area;
  }
  return null;
}

/** Map a Strava activity type to a RecoverySport family. */
export function sportForActivityType(type: string): RecoverySport {
  if (type === "Run" || type === "Walk" || type === "Hike") return "run";
  if (type === "Ride" || type === "VirtualRide") return "ride";
  if (type === "Swim") return "swim";
  if (type === "WeightTraining" || type === "Workout") return "strength";
  return "any";
}
