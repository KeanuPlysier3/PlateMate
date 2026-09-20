import { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Calendar, type DateData } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import mealsData from "@/data/meals.json";
import {
  CUSTOM_MEALS_STORAGE_KEY,
  LAST_ADDED_MEAL_STORAGE_KEY,
  PLANNED_MEALS_STORAGE_KEY,
} from "@/constants/storage";
import { resolveMealImage } from "@/utils/resolve-meal-image";
import { toDateKey, getStartOfToday, formatDate } from "@/utils/date";
import type { Meal } from "@/types/meal";
import type { PlannedMeals } from "@/types/planned-meal";

// Typing this assignment as Meal[] makes TypeScript check every entry in
// meals.json against the Meal shape (name/allergens/ingredients/description/link/image)
// at compile time — a structurally invalid meal fails the build, not runtime.
const bundledMeals: Meal[] = mealsData.meals;

const ACCENT_COLOR = "#007AFF";

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pendingDate, setPendingDate] = useState<Date>(getStartOfToday); //initialize pendingDate to the start of today
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [meals, setMeals] = useState<Meal[]>(bundledMeals); //initialize meals state with bundledMeals
  const [isPlanningMeal, setIsPlanningMeal] = useState(false);
  const [showPlannedToast, setShowPlannedToast] = useState(false);
  const insets = useSafeAreaInsets();

  // Auto-dismiss the "planned" toast after 3 seconds. Re-runs whenever
  // showPlannedToast changes, so planning a second meal while the first
  // toast is still visible restarts the 3-second window instead of the two
  // timers fighting each other.
  useEffect(() => {
    if (!showPlannedToast) {
      return;
    }
    const timeoutId = setTimeout(() => setShowPlannedToast(false), 3000);//dismiss after 3 seconds
    return () => clearTimeout(timeoutId);
  }, [showPlannedToast]);

  // Re-reads AsyncStorage every time this screen gains focus (not just once
  // on mount) so a meal added via the add-meal modal shows up in the
  // dropdown as soon as you navigate back to Planner, without needing to
  // restart the app — the tab screen itself stays mounted the whole time,
  useFocusEffect(
    useCallback(() => {
      //this prevents the useFocusEffect from being called multiple times when the component re-renders
      let isActive = true;

      (async () => {
        const storedValue = await AsyncStorage.getItem(
          CUSTOM_MEALS_STORAGE_KEY,
        ); //storedValue is a stringified JSON array of custom meals, or null if no custom meals have been added yet
        const customMeals: Meal[] = storedValue ? JSON.parse(storedValue) : [];
        const allMeals = [...bundledMeals, ...customMeals];
        if (!isActive) {
          //if the component is no longer active (unmounted), we don't want to update state
          return;
        }
        setMeals(allMeals);

        const lastAddedMealName = await AsyncStorage.getItem(
          LAST_ADDED_MEAL_STORAGE_KEY,
        ); //set in add-meal.tsx
        if (lastAddedMealName && isActive) {
          const justAddedMeal = allMeals.find(
            (meal) => meal.name === lastAddedMealName,
          );
          if (justAddedMeal) {
            setSelectedMeal(justAddedMeal);
          }
          await AsyncStorage.removeItem(LAST_ADDED_MEAL_STORAGE_KEY);
        }
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleDayPress = (day: DateData) => {
    setPendingDate(new Date(day.year, day.month - 1, day.day)); //js indexes months from 0, so we need to subtract 1 from the month value
  };

  const handleReset = () => {
    setSelectedDate(null);
    setPendingDate(getStartOfToday());
    setSelectedMeal(null);
  };

  const handlePlanMeal = async () => {
    if (!selectedDate || !selectedMeal || isPlanningMeal) {
      return;
    }

    setIsPlanningMeal(true);
    try {
      const storedValue = await AsyncStorage.getItem(PLANNED_MEALS_STORAGE_KEY);
      const plannedMeals: PlannedMeals = storedValue
        ? JSON.parse(storedValue)
        : {};
      plannedMeals[toDateKey(selectedDate)] = selectedMeal; //overwrites any meal already planned for this date, by design — one meal per date
      await AsyncStorage.setItem(
        PLANNED_MEALS_STORAGE_KEY,
        JSON.stringify(plannedMeals),
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPlannedToast(true);
      handleReset();
    } finally {
      setIsPlanningMeal(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          selectedDate ? styles.containerSelected : styles.containerPicking,
        ]}
      >
        {selectedDate ? (
          selectedMeal ? (
            <>
              <Pressable
                style={styles.backButton}
                onPress={() => setSelectedMeal(null)}
                hitSlop={8}
              >
                <SymbolView
                  name={{
                    ios: "chevron.left",
                    android: "arrow_back",
                    web: "arrow_back",
                  }}
                  size={26}
                  tintColor="black"
                />
              </Pressable>

              <View style={styles.mealOverview}>
                <Image
                  source={resolveMealImage(selectedMeal.image)}
                  style={styles.mealImage}
                />
                <Text style={styles.mealName}>{selectedMeal.name}</Text>
                <Text style={styles.mealDescription}>
                  {selectedMeal.description}
                </Text>

                <Text style={styles.mealSectionLabel}>Ingrediënten</Text>
                <Text style={styles.mealSectionText}>
                  {selectedMeal.ingredients.join(", ")}
                </Text>

                <Text style={styles.mealSectionLabel}>Allergenen</Text>
                <Text style={styles.mealSectionText}>
                  {selectedMeal.allergens.length > 0
                    ? selectedMeal.allergens.join(", ")
                    : "Geen bekende allergenen"}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.planMealButton,
                  isPlanningMeal && styles.planMealButtonDisabled,
                ]}
                onPress={handlePlanMeal}
                disabled={isPlanningMeal}
              >
                <Text style={styles.planMealButtonText}>
                  {isPlanningMeal
                    ? "Bezig met plannen..."
                    : `Plan on ${formatDate(selectedDate)}`}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={styles.backButton}
                onPress={handleReset}
                hitSlop={8}
              >
                <SymbolView
                  name={{
                    ios: "chevron.left",
                    android: "arrow_back",
                    web: "arrow_back",
                  }}
                  size={26}
                  tintColor="black"
                />
              </Pressable>
              <Text style={styles.selectedDate}>
                {formatDate(selectedDate)}
              </Text>

              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownText}
                selectedTextStyle={styles.dropdownText}
                itemTextStyle={styles.dropdownText}
                data={meals}
                labelField="name"
                valueField="name"
                placeholder="Meals"
                onChange={(meal) => setSelectedMeal(meal)}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>of</Text>
                <View style={styles.dividerLine} />
              </View>

              <Link href="/add-meal" asChild>
                <Pressable style={styles.addMealButton}>
                  <Text style={styles.addMealButtonText}>+ Nieuw Recept</Text>
                </Pressable>
              </Link>
            </>
          )
        ) : (
          <>
            <Calendar
              style={styles.calendar}
              minDate={toDateKey(getStartOfToday())} //todatekey is used to format the date to the format that the calendar component expects
              markedDates={{
                [toDateKey(pendingDate)]: {
                  selected: true,
                  selectedColor: ACCENT_COLOR,
                },
              }}
              theme={{
                todayTextColor: ACCENT_COLOR,
                arrowColor: ACCENT_COLOR,
                selectedDayBackgroundColor: ACCENT_COLOR,
                weekVerticalMargin: 0,
              }}
              onDayPress={handleDayPress}
            />
            <Pressable
              style={styles.confirmButton}
              onPress={() => setSelectedDate(pendingDate)}
            >
              <Text style={styles.confirmButtonText}>Bevestigen</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {showPlannedToast && (
        <View
          style={[styles.toast, { bottom: 80 + insets.bottom }]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>Maaltijd gepland!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  toast: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#1c1c1e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  toastText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  containerPicking: {
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  containerSelected: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  calendar: {
    width: "100%",
    borderRadius: 12,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  selectedDate: {
    fontSize: 28,
    fontWeight: "700",
  },
  dropdown: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdownContainer: {
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
  },
  mealOverview: {
    width: "100%",
    gap: 8,
  },
  mealImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 22,
    fontWeight: "700",
  },
  mealDescription: {
    fontSize: 15,
    color: "#444",
  },
  mealSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  mealSectionText: {
    fontSize: 15,
    color: "#444",
  },
  planMealButton: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#1c1c1e",
    alignItems: "center",
  },
  planMealButtonDisabled: {
    backgroundColor: "#aaa",
  },
  planMealButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ccc",
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  addMealButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1c1c1e",
    alignItems: "center",
  },
  addMealButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#1c1c1e",
  },
  confirmButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
