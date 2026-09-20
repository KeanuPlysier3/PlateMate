import { useCallback, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { PLANNED_MEALS_STORAGE_KEY } from "@/constants/storage";
import { getStartOfToday, toDateKey, formatDate } from "@/utils/date";
import type { PlannedMeals } from "@/types/planned-meal";

const UPCOMING_DAYS_COUNT = 7; // today + the next 6

const getUpcomingDates = (): Date[] => {
  const start = getStartOfToday();
  const dates: Date[] = [];
  for (let i = 0; i < UPCOMING_DAYS_COUNT; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);//we set the date by looking at the current date of date and addiing i to.
    dates.push(date);
  }
  return dates;
};

export default function Home() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeals>({});

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

  const [today, ...upcomingDays] = getUpcomingDates();
  const todayMeal = plannedMeals[toDateKey(today)];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <View style={styles.focusCard}>
        <Text style={styles.focusLabel}>Vandaag</Text>
        <Text style={styles.focusDate}>{formatDate(today)}</Text>
        <Text style={styles.focusMealName}>
          {todayMeal ? todayMeal.name : "Nog geen maaltijd gepland"}
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
              tintColor="#1c1c1e"
            />
            <Text style={styles.statValue}>
              {todayMeal ? `${todayMeal.calories} kcal` : "–"}
            </Text>
            <Text style={styles.statLabel}>Geplande inname</Text>
          </View>

          <View style={styles.statTile}>
            <SymbolView
              name={{
                ios: "flame.fill",
                android: "local_fire_department",
                web: "local_fire_department",
              }}
              size={22}
              tintColor="#1c1c1e"
            />
            {/* Empty until Apple Health integration exists */}
            <Text style={styles.statValue}>–</Text>
            <Text style={styles.statLabel}>Live verbranding</Text>
          </View>

          <View style={styles.statTile}>
            <SymbolView
              name={{
                ios: "target",
                android: "track_changes",
                web: "track_changes",
              }}
              size={22}
              tintColor="#1c1c1e"
            />
            {/* Empty until Apple Health integration exists */}
            <Text style={styles.statValue}>–</Text>
            <Text style={styles.statLabel}>Verschil</Text>
          </View>
        </View>

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
            Probeer vandaag iets actiever te zijn om je calorieën in balans te
            houden.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>coming days</Text>

      {upcomingDays.map((date) => {
        const meal = plannedMeals[toDateKey(date)];
        return (
          <View key={toDateKey(date)} style={styles.dayCard}>
            <Text style={styles.dayCardDate}>{formatDate(date)}</Text>
            {meal ? (
              <Text style={styles.dayCardMeal}>
                {meal.name} · {meal.calories} kcal
              </Text>
            ) : (
              <Text style={styles.dayCardMealEmpty}>Plan maaltijd</Text>
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
  backgroundColor: "#fff",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f7",
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
    color: "#888",
  },
  focusDate: {
    fontSize: 24,
    fontWeight: "700",
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
    color: "#888",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  dayCard: {
    ...cardShadow,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    gap: 4,
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
