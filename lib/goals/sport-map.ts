import type { ActivityType } from "@/lib/strava/types";
import type { GoalSport } from "./types";

/** Map any Strava activity type to its goal-sport family. */
export function familyForActivityType(t: ActivityType): GoalSport {
  if (t === "VirtualRide") return "Ride";
  return t as GoalSport;
}

export function activityMatchesGoalSport(
  t: ActivityType,
  sport: GoalSport,
): boolean {
  return familyForActivityType(t) === sport;
}

export const GOAL_SPORTS: GoalSport[] = [
  "Ride",
  "Run",
  "Swim",
  "Workout",
  "WeightTraining",
  "Hike",
  "Walk",
];

export const SPORT_LABEL: Record<GoalSport, string> = {
  Ride: "Cycling",
  Run: "Running",
  Swim: "Swimming",
  Workout: "Workout",
  WeightTraining: "Strength",
  Hike: "Hiking",
  Walk: "Walking",
};
