import type { ActivityType } from "@/lib/strava/types";
import {
  Bike,
  Footprints,
  Waves,
  Dumbbell,
  Mountain,
  Activity as ActIcon,
} from "lucide-react";

const ICON_MAP: Record<ActivityType, typeof Bike> = {
  Run: Footprints,
  Walk: Footprints,
  Ride: Bike,
  VirtualRide: Bike,
  Swim: Waves,
  Workout: Dumbbell,
  WeightTraining: Dumbbell,
  Hike: Mountain,
};

const LABEL_MAP: Record<ActivityType, string> = {
  Run: "Run",
  Walk: "Walk",
  Ride: "Ride",
  VirtualRide: "Indoor Ride",
  Swim: "Swim",
  Workout: "Workout",
  WeightTraining: "Strength",
  Hike: "Hike",
};

export function ActivityIcon({
  type,
  size = 18,
  className,
}: {
  type: ActivityType;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[type] ?? ActIcon;
  return <Icon size={size} className={className} strokeWidth={2.2} />;
}

export function iconFor(type: ActivityType) {
  return ICON_MAP[type] ?? ActIcon;
}

export function labelFor(type: ActivityType): string {
  return LABEL_MAP[type] ?? type;
}
