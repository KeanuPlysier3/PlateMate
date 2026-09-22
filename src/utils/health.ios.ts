import { queryStatisticsForQuantity } from "@kingstinct/react-native-healthkit";

import { getStartOfDay } from "@/utils/date";

export async function getBurnedCaloriesForDate(date: Date): Promise<number | null> {
  const startOfDay = getStartOfDay(date);
  const startOfNextDay = new Date(startOfDay);//copy the startOfDay so we can modify it by adding 1 day
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);//set the date to midnight of the next day
  const endDate = startOfNextDay < now ? startOfNextDay : now; // never query into the future

  const filter = { date: { startDate: startOfDay, endDate } };

  const [active, resting] = await Promise.all([//wait for both queries to finish before continuing
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

  if (active.sumQuantity === undefined && resting.sumQuantity === undefined) {//if both queries return undefined, return null
    return null;
  }

  return (active.sumQuantity?.quantity ?? 0) + (resting.sumQuantity?.quantity ?? 0);
}

export async function getTodayBurnedCalories(): Promise<number | null> {
  return getBurnedCaloriesForDate(new Date());
}
