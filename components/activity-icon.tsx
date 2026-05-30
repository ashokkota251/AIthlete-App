import type { ActivityType } from "@/lib/strava/types";
import { Bike, Footprints, Waves, Dumbbell, Mountain, Activity as ActIcon } from "lucide-react";

export function ActivityIcon({
  type,
  size = 18,
  className,
}: {
  type: ActivityType;
  size?: number;
  className?: string;
}) {
  const Icon = iconFor(type);
  return <Icon size={size} className={className} strokeWidth={2.2} />;
}

export function iconFor(type: ActivityType) {
  switch (type) {
    case "Run":
    case "Walk":
      return Footprints;
    case "Ride":
    case "VirtualRide":
      return Bike;
    case "Swim":
      return Waves;
    case "Workout":
    case "WeightTraining":
      return Dumbbell;
    case "Hike":
      return Mountain;
    default:
      return ActIcon;
  }
}

export function labelFor(type: ActivityType): string {
  switch (type) {
    case "Run":
      return "Run";
    case "Walk":
      return "Walk";
    case "Ride":
      return "Ride";
    case "VirtualRide":
      return "Indoor Ride";
    case "Swim":
      return "Swim";
    case "Workout":
      return "Workout";
    case "WeightTraining":
      return "Strength";
    case "Hike":
      return "Hike";
    default:
      return type;
  }
}
