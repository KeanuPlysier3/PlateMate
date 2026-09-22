export type WeightGoal = "lose" | "maintain" | "gain";

// "Difference" here means burned − planned intake: positive is a deficit
// (burning more than eaten), negative is a surplus (eating more than burned).
// calorieMargin is always a non-negative number of kcal/day — its meaning
// (target deficit vs. target surplus) flips depending on weightGoal, same
// convention as profile.tsx's storage of it.
export function getCalorieTip(
  weightGoal: WeightGoal,
  calorieMargin: number,
  burnedCalories: number,
  plannedIntake: number,
): string {
  const currentDifference = burnedCalories - plannedIntake;

  if (weightGoal === "lose") {
    const remaining = calorieMargin - currentDifference;
    if (remaining <= 0) {
      return "You've hit your calorie deficit goal for today nice work!";
    }
    return `You need a ${Math.max(0, Math.round(remaining))} kcal bigger deficit today to hit your goal eat a bit less or move a bit more.`;
  }

  if (weightGoal === "gain") {
    const targetDifference = -calorieMargin;
    const remaining = targetDifference - currentDifference;
    if (remaining >= 0) {
      return "You've hit your calorie surplus goal for today nice work!";
    }
    return `You need ${Math.max(0, Math.round(-remaining))} kcal more today to hit your surplus goal try eating a bit more.`;
  }

  // maintain
  const offBalance = Math.abs(currentDifference);
  if (offBalance <= 100) {
    return "You're keeping your calories nicely balanced today.";
  }
  return currentDifference > 0
    ? `You're burning ${Math.round(offBalance)} kcal more than you've eaten consider eating a bit more to stay balanced.`
    : `You've eaten ${Math.round(offBalance)} kcal more than you've burned consider a bit more activity to stay balanced.`;
}
