import type { WeightGoal } from "@/utils/calorie-tips";

export type DayStatus = "within" | "tooHigh" | "tooLow" | "noData";

//A buffer of kcal/day within which a day's netBalance is considered "within" the target for the weight goal.
const STATUS_TOLERANCE = 200;



export function getDayStatus(
  weightGoal: WeightGoal,
  calorieMargin: number,
  netBalance: number | null,
): DayStatus {
  if (netBalance === null) {
    return "noData";
  }

  const target =
    weightGoal === "lose" ? -calorieMargin : weightGoal === "gain" ? calorieMargin : 0; //set the target based on the weight goal: negative for losing, positive for gaining, zero for maintaining
  const deviation = netBalance - target; //how far of the you are from yr target. 

  if (Math.abs(deviation) <= STATUS_TOLERANCE) {
    return "within";
  }
  return deviation > 0 ? "tooHigh" : "tooLow";
}
