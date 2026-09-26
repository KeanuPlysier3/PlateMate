import type { WeightGoal } from "@/utils/calorie-tips";

export type DayStatus = "within" | "tooHigh" | "tooLow" | "noData";

// Buffer (kcal/day) within which netBalance still counts as "within" the target.
const STATUS_TOLERANCE = 200;

export function getDayStatus(
  weightGoal: WeightGoal,
  calorieMargin: number,
  netBalance: number | null,
): DayStatus {
  if (netBalance === null) {
    return "noData";
  }

  // target sign flips with weightGoal; deviation = how far off netBalance is from it
  const target =
    weightGoal === "lose"
      ? -calorieMargin
      : weightGoal === "gain"
        ? calorieMargin
        : 0;
  const deviation = netBalance - target;

  if (Math.abs(deviation) <= STATUS_TOLERANCE) {
    return "within";
  }
  return deviation > 0 ? "tooHigh" : "tooLow";
}
