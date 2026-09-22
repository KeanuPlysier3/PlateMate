import { queryStatisticsForQuantity } from "@kingstinct/react-native-healthkit";

import { getStartOfDay } from "@/utils/date";

// Combines active (movement) + resting (basal) energy — the two burned-calorie
// types PlateMate requests read access to, see health-connection-status.ios.tsx.
// Returns null when HealthKit has no samples at all for that day (distinct
// from a real 0 kcal) — e.g. a day before the phone had any activity
// tracking, or before Health access was granted. Callers (History's chart)
// need that distinction to render "no data" rather than a misleading bar.
export async function getBurnedCaloriesForDate(date: Date): Promise<number | null> {
  const startOfDay = getStartOfDay(date);
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);
  const now = new Date();
  const endDate = startOfNextDay < now ? startOfNextDay : now; // never query into the future

  const filter = { date: { startDate: startOfDay, endDate } };

  const [active, resting] = await Promise.all([
    queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierActiveEnergyBurned",
      ["cumulativeSum"],
      { filter },
    ),
    queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierBasalEnergyBurned",
      ["cumulativeSum"],
      { filter },
    ),
  ]);

  if (active.sumQuantity === undefined && resting.sumQuantity === undefined) {
    return null;
  }

  return (active.sumQuantity?.quantity ?? 0) + (resting.sumQuantity?.quantity ?? 0);
}

export async function getTodayBurnedCalories(): Promise<number | null> {
  return getBurnedCaloriesForDate(new Date());
}
