import { queryStatisticsForQuantity } from "@kingstinct/react-native-healthkit";

import { getStartOfToday } from "@/utils/date";

// Combines active (movement) + resting (basal) energy — the two burned-calorie
// types PlateMate requests read access to, see health-connection-status.ios.tsx.
export async function getTodayBurnedCalories(): Promise<number | null> {
  const filter = {
    date: { startDate: getStartOfToday(), endDate: new Date() }, //endDate is now
  };

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

  return (active.sumQuantity?.quantity ?? 0) + (resting.sumQuantity?.quantity ?? 0);
}
