export type BodyArea =
  | "calves"
  | "quads"
  | "hamstrings"
  | "hipFlexors"
  | "glutes"
  | "lowerBack"
  | "upperBack"
  | "itBand"
  | "shoulders"
  | "neck"
  | "ankles"
  | "feet"
  | "lats"
  | "chest";

export type RecoverySport = "run" | "ride" | "swim" | "strength" | "any";

export type Difficulty = "easy" | "moderate";

export interface Stretch {
  id: string;
  name: string;
  targetArea: BodyArea;
  secondaryAreas?: BodyArea[];
  /** seconds — hold per side */
  durationSec: number;
  /** 1 = symmetric / single hold; 2 = unilateral, do both sides */
  sides: 1 | 2;
  difficulty: Difficulty;
  /** one-line summary shown under the stretch name */
  description: string;
  steps: string[];
  cautions?: string[];
  sportRelevance: RecoverySport[];
}

export const BODY_AREA_LABELS: Record<BodyArea, string> = {
  calves: "Calves",
  quads: "Quads",
  hamstrings: "Hamstrings",
  hipFlexors: "Hip flexors",
  glutes: "Glutes",
  lowerBack: "Lower back",
  upperBack: "Upper back",
  itBand: "IT band",
  shoulders: "Shoulders",
  neck: "Neck",
  ankles: "Ankles",
  feet: "Feet",
  lats: "Lats",
  chest: "Chest",
};
