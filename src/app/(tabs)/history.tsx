import { useCallback, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart } from "react-native-gifted-charts";

import {
  CALORIE_MARGIN_STORAGE_KEY,
  PLANNED_MEALS_STORAGE_KEY,
  WEIGHT_GOAL_STORAGE_KEY,
} from "@/constants/storage";
import { COLORS } from "@/constants/theme";
import type { WeightGoal } from "@/utils/calorie-tips";
import { getStartOfToday, toDateKey } from "@/utils/date";
import { getBurnedCaloriesForDate } from "@/utils/health";
import { getDayStatus, type DayStatus } from "@/utils/history-data";
import type { PlannedMeals } from "@/types/planned-meal";

const HISTORY_DAYS_COUNT = 7; // the 6 days before today + today

// Oldest first — matches the wireframe's left-to-right chronological bars.
const getHistoryDates = (): Date[] => {
  const today = getStartOfToday();
  const dates: Date[] = [];
  for (let i = HISTORY_DAYS_COUNT - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates;
};

interface HistoryDay {
  date: Date;
  netBalance: number | null; // plannedIntake − burnedCalories
  status: DayStatus;
}

const STATUS_COLORS: Record<DayStatus, string> = {
  within: "#2e7d32", // same green as "Access requested" on health-connection-status
  tooHigh: "#c0392b", // same red as profile.tsx's destructive reset button
  tooLow: COLORS.orange,
  noData: COLORS.textMuted,
};

const STATUS_LABELS: Record<DayStatus, string> = {
  within: "Within goal",
  tooHigh: "Too high",
  tooLow: "Too low",
  noData: "No data",
};

export default function History() {
  const [historyDays, setHistoryDays] = useState<HistoryDay[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const [storedPlannedMeals, storedGoal, storedMargin] = await Promise.all([
          AsyncStorage.getItem(PLANNED_MEALS_STORAGE_KEY),
          AsyncStorage.getItem(WEIGHT_GOAL_STORAGE_KEY),
          AsyncStorage.getItem(CALORIE_MARGIN_STORAGE_KEY),
        ]);
        const plannedMeals: PlannedMeals = storedPlannedMeals
          ? JSON.parse(storedPlannedMeals)
          : {};
        const weightGoal: WeightGoal = (storedGoal as WeightGoal) ?? "maintain"; //trust that the stored value is a valid WeightGoal, default to "maintain" if not found.
        const calorieMargin = storedMargin ? Number(storedMargin) : 0;//store the calorie margin as a number, default to 0 if not found.

        const dates = getHistoryDates();
        const burnedCaloriesByDate = await Promise.all(
          dates.map((date) => getBurnedCaloriesForDate(date)),
        );

        if (!isActive) {
          return;
        }

        const days: HistoryDay[] = dates.map((date, index) => {
          const plannedIntake = plannedMeals[toDateKey(date)]?.calories ?? 0;
          const burnedCalories = burnedCaloriesByDate[index];
          const netBalance =
            burnedCalories !== null ? plannedIntake - burnedCalories : null;
          return {
            date,
            netBalance,
            status: getDayStatus(weightGoal, calorieMargin, netBalance),
          };
        });
        setHistoryDays(days);
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const barData = historyDays.map((day) => ({
    value: day.netBalance !== null ? Math.round(day.netBalance) : 0,
    frontColor: STATUS_COLORS[day.status],
    label: day.date.toLocaleDateString(undefined, { weekday: "short" }),
  }));

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.chartLabel}>Net balance per day (kcal)</Text>

      <View style={styles.chartCard}>
        <BarChart
          data={barData}
          height={80}
          barWidth={28}
          spacing={10}
          initialSpacing={10}
      
          noOfSections={4}
          noOfSectionsBelowXAxis={4}
          xAxisThickness={1}
          xAxisColor={COLORS.textMuted}
          yAxisThickness={1}
          yAxisTextStyle={styles.chartAxisLabel}
          rulesColor="#e5e0d3"
          xAxisLabelTextStyle={styles.chartAxisLabel}
        />
      </View>

      <Text style={styles.sectionTitle}>Daily overview</Text>

      {historyDays.map((day) => (
        <View key={toDateKey(day.date)} style={styles.dayRow}>
          <Text style={styles.dayRowDate}>
            {day.date.toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Text>

          <Text style={styles.dayRowValue}>
            {day.netBalance !== null
              ? `${day.netBalance >= 0 ? "+" : ""}${Math.round(day.netBalance)} kcal`
              : "–"}
          </Text>

          <View style={styles.dayRowStatus}>
            <View
              style={[styles.statusDot, { backgroundColor: STATUS_COLORS[day.status] }]}
            />
            <Text style={styles.dayRowStatusText}>{STATUS_LABELS[day.status]}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.teal,
  },
  chartLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 4,
  },
  chartAxisLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    color: COLORS.teal,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dayRowDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  dayRowValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  dayRowStatus: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayRowStatusText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
