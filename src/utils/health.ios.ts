import { queryStatisticsForQuantity } from "@kingstinct/react-native-healthkit";

import { getStartOfDay } from "@/utils/date";

export async function getBurnedCaloriesForDate(
  date: Date,
): Promise<number | null> {
  const startOfDay = getStartOfDay(date);
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);
  const now = new Date();
  const endDate = startOfNextDay < now ? startOfNextDay : now; // never query into the future

  const filter = { date: { startDate: startOfDay, endDate } };

  // Querying before the user has ever been asked for Health access throws a
  // native "authorization not determined" error (HKError code 5), not just
  // an empty result — treat that the same as "no data" rather than letting
  // it surface as an unhandled rejection.
  let active, resting;
  try {
    [active, resting] = await Promise.all([
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
  } catch {
    return null;
  }

  if (active.sumQuantity === undefined && resting.sumQuantity === undefined) {
    return null;
  }

  return (
    (active.sumQuantity?.quantity ?? 0) + (resting.sumQuantity?.quantity ?? 0)
  );
}

export async function getTodayBurnedCalories(): Promise<number | null> {
  return getBurnedCaloriesForDate(new Date());
}
