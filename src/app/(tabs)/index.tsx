import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  CALORIE_MARGIN_STORAGE_KEY,
  PLANNED_MEALS_STORAGE_KEY,
  WEIGHT_GOAL_STORAGE_KEY,
} from "@/constants/storage";
import { COLORS } from "@/constants/theme";
import { getCalorieTip, type WeightGoal } from "@/utils/calorie-tips";
import { getStartOfToday, toDateKey, formatDate } from "@/utils/date";
import { getTodayBurnedCalories } from "@/utils/health";
import { resolveMealImage } from "@/utils/resolve-meal-image";
import type { PlannedMeals } from "@/types/planned-meal";

const UPCOMING_DAYS_COUNT = 7; // today + the next 6

const getUpcomingDates = (): Date[] => {
  const start = getStartOfToday();
  const dates: Date[] = [];
  for (let i = 0; i < UPCOMING_DAYS_COUNT; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i); //we set the date by looking at the current date of date and addiing i to.
    dates.push(date);
  }
  return dates;
};

export default function Home() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeals>({});
  const [burnedCalories, setBurnedCalories] = useState<number | null>(null);
  const [weightGoal, setWeightGoal] = useState<WeightGoal>("maintain");
  const [calorieMargin, setCalorieMargin] = useState(0);

  // Re-reads on every focus (not just on mount) so a meal planned on the
  // Planner tab shows up here as soon as you switch back to Home — same
  // pattern as planner.tsx's own focus effect for customMeals.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const storedValue = await AsyncStorage.getItem(
          PLANNED_MEALS_STORAGE_KEY,
        );
        const parsed: PlannedMeals = storedValue ? JSON.parse(storedValue) : {};
        if (isActive) {
          setPlannedMeals(parsed);
        }
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleDeletePlannedMeal = async (dateKey: string) => {
    const updated = { ...plannedMeals };
    delete updated[dateKey];
    setPlannedMeals(updated);
    await AsyncStorage.setItem(PLANNED_MEALS_STORAGE_KEY, JSON.stringify(updated));
  };


  // Re-reads the goal/margin set on Profile every time this screen gains
  // focus, same reasoning as plannedMeals above.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const [storedGoal, storedMargin] = await Promise.all([
          AsyncStorage.getItem(WEIGHT_GOAL_STORAGE_KEY),
          AsyncStorage.getItem(CALORIE_MARGIN_STORAGE_KEY),
        ]);
        if (isActive) {
          setWeightGoal((storedGoal as WeightGoal) ?? "maintain");
          setCalorieMargin(storedMargin ? Number(storedMargin) : 0);
        }
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  // burned-calorie total changes constantly while the app is in the
  // background, so re-capture it on every focus too.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const total = await getTodayBurnedCalories();
        if (isActive) {
          setBurnedCalories(total);
        }
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const [today, ...upcomingDays] = getUpcomingDates();
  const todayMeal = plannedMeals[toDateKey(today)];
  const plannedIntake = todayMeal?.calories ?? 0;
  const currentDifference =
    burnedCalories !== null ? burnedCalories - plannedIntake : null;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <View style={styles.focusCard}>
        <Text style={styles.focusLabel}>Today</Text>
        <Text style={styles.focusDate}>{formatDate(today)}</Text>

        {todayMeal && (
          <Image
            source={resolveMealImage(todayMeal.image)}
            style={styles.focusMealImage}
          />
        )}

        <Text style={styles.focusMealName}>
          {todayMeal ? todayMeal.name : "No meal planned yet"}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <SymbolView
              name={{
                ios: "fork.knife",
                android: "restaurant",
                web: "restaurant",
              }}
              size={22}
              tintColor={COLORS.teal}
            />
            <Text style={styles.statValue}>
              {todayMeal ? `${todayMeal.calories} kcal` : "–"}
            </Text>
            <Text style={styles.statLabel}>Planned intake</Text>
          </View>

          <View style={styles.statTile}>
            <SymbolView
              name={{
                ios: "flame.fill",
                android: "local_fire_department",
                web: "local_fire_department",
              }}
              size={22}
              tintColor={COLORS.orange}
            />
            <Text style={styles.statValue}>
              {burnedCalories !== null ? `${Math.round(burnedCalories)} kcal` : "–"}
            </Text>
            <Text style={styles.statLabel}>Live burn</Text>
          </View>

          <View style={styles.statTile}>
            <SymbolView
              name={{
                ios: "target",
                android: "track_changes",
                web: "track_changes",
              }}
              size={22}
              tintColor={COLORS.teal}
            />
            <Text style={styles.statValue}>
              {currentDifference !== null
                ? `${Math.round(Math.abs(currentDifference))} kcal`
                : "–"}
            </Text>
            <Text style={styles.statLabel}>Difference</Text>
          </View>
        </View>

        {todayMeal ? (
          <View style={styles.tipBox}>
            <SymbolView
              name={{
                ios: "lightbulb.fill",
                android: "lightbulb",
                web: "lightbulb",
              }}
              size={18}
              tintColor="#8a6d00"
            />
            <Text style={styles.tipText}>
              {currentDifference !== null
                ? getCalorieTip(
                    weightGoal,
                    calorieMargin,
                    burnedCalories ?? 0,
                    plannedIntake,
                  )
                : "Connect Apple Health to get a personalized tip here."}
            </Text>
          </View>
        ) : (
          <Link
            href={{ pathname: "/planner", params: { date: toDateKey(today) } }}
            asChild
          >
            <Pressable style={styles.planTodayButton}>
              <Text style={styles.planTodayButtonText}>Plan meal</Text>
            </Pressable>
          </Link>
        )}
      </View>

      <Text style={styles.sectionTitle}>Upcoming days</Text>

      {upcomingDays.map((date) => {
        const meal = plannedMeals[toDateKey(date)];
        return (
          <View key={toDateKey(date)} style={styles.dayCard}>
            <View style={styles.dayCardInfo}>
              <Text style={styles.dayCardDate}>{formatDate(date)}</Text>
              {meal ? (
                <Text style={styles.dayCardMeal}>
                  {meal.name} · {meal.calories} kcal
                </Text>
              ) : (
                <Text style={styles.dayCardMealEmpty}>Plan meal</Text>
              )}
            </View>

            {meal ? (
              <Pressable
                onPress={() => handleDeletePlannedMeal(toDateKey(date))}
                hitSlop={8}
              >
                <SymbolView
                  name={{ ios: "trash", android: "delete", web: "delete" }}
                  size={22}
                  tintColor={COLORS.textMuted}
                />
              </Pressable>
            ) : (
              <Link
                href={{ pathname: "/planner", params: { date: toDateKey(date) } }}
                asChild
              >
                <Pressable style={styles.dayCardAddButton} hitSlop={8}>
                  <SymbolView
                    name={{ ios: "plus", android: "add", web: "add" }}
                    size={22}
                    tintColor={COLORS.white}
                  />
                </Pressable>
              </Link>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// Shared "card" look — white background + a subtle shadow. iOS/Android need
// different props for this (shadow* vs elevation), so both are set on every
// card-styled element rather than relying on just one or the other.
const cardShadow = {
  backgroundColor: COLORS.white,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    padding: 24,
    gap: 16,
  },
  focusCard: {
    ...cardShadow,
    width: "100%",
    padding: 20,
    borderRadius: 16,
    gap: 4,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.orange,
  },
  focusDate: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.teal,
  },
  focusMealImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginTop: 8,
  },
  focusMealName: {
    fontSize: 16,
    color: "#444",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statTile: {
    ...cardShadow,
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  tipBox: {
    ...cardShadow,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#6b5900",
  },
  planTodayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
  },
  planTodayButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    color: COLORS.teal,
  },
  dayCard: {
    ...cardShadow,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dayCardInfo: {
    flex: 1,
    gap: 4,
  },
  dayCardAddButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardDate: {
    fontSize: 15,
    fontWeight: "600",
  },
  dayCardMeal: {
    fontSize: 14,
    color: "#444",
  },
  dayCardMealEmpty: {
    fontSize: 14,
    color: "#aaa",
    fontStyle: "italic",
  },
});
