import { useCallback, useState } from "react";
import { Text, View, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Calendar, type DateData } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";

import mealsData from "@/data/meals.json";
import { CUSTOM_MEALS_STORAGE_KEY, LAST_ADDED_MEAL_STORAGE_KEY } from "@/constants/storage";
import { resolveMealImage } from "@/utils/resolve-meal-image";
import type { Meal } from "@/types/meal";

// Typing this assignment as Meal[] makes TypeScript check every entry in
// meals.json against the Meal shape (name/allergens/ingredients/description/link/image)
// at compile time — a structurally invalid meal fails the build, not runtime.
const bundledMeals: Meal[] = mealsData.meals;

const ACCENT_COLOR = "#007AFF";

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0"); //add 1 to month because js indexes months from 0
  const day = `${date.getDate()}`.padStart(2, "0"); //padStart to ensure day is always 2 digits
  return `${year}-${month}-${day}`;
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pendingDate, setPendingDate] = useState<Date>(getStartOfToday);//initialize pendingDate to the start of today
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [meals, setMeals] = useState<Meal[]>(bundledMeals);//initialize meals state with bundledMeals

  // Re-reads AsyncStorage every time this screen gains focus (not just once
  // on mount) so a meal added via the add-meal modal shows up in the
  // dropdown as soon as you navigate back to Planner, without needing to
  // restart the app — the tab screen itself stays mounted the whole time,
  useFocusEffect(
    useCallback(() => {//this prevents the useFocusEffect from being called multiple times when the component re-renders
      let isActive = true;

      (async () => {
        const storedValue = await AsyncStorage.getItem(CUSTOM_MEALS_STORAGE_KEY);//storedValue is a stringified JSON array of custom meals, or null if no custom meals have been added yet
        const customMeals: Meal[] = storedValue ? JSON.parse(storedValue) : [];
        const allMeals = [...bundledMeals, ...customMeals];
        if (!isActive) { //if the component is no longer active (unmounted), we don't want to update state
          return;
        }
        setMeals(allMeals);

    
        const lastAddedMealName = await AsyncStorage.getItem(LAST_ADDED_MEAL_STORAGE_KEY);//set in add-meal.tsx 
        if (lastAddedMealName && isActive) {
          const justAddedMeal = allMeals.find((meal) => meal.name === lastAddedMealName);
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

  return (
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
                name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
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
              <Text style={styles.mealDescription}>{selectedMeal.description}</Text>

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

            <Pressable style={styles.planMealButton}>
              <Text style={styles.planMealButtonText}>
                Plan maaltijd op {formatDate(selectedDate)}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.backButton} onPress={handleReset} hitSlop={8}>
              <SymbolView
                name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
                size={26}
                tintColor="black"
              />
            </Pressable>
            <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>

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
              <Text style={styles.dividerText}>-of-</Text>
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
            minDate={toDateKey(getStartOfToday())}//todatekey is used to format the date to the format that the calendar component expects
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
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
