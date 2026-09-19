import { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Calendar, type DateData } from "react-native-calendars";
import { Dropdown } from "react-native-element-dropdown";

import mealsData from "@/data/meals.json";
import type { Meal } from "@/types/meal";

// Typing this assignment as Meal[] makes TypeScript check every entry in
// meals.json against the Meal shape (name/allergens/ingredients/description/link/image)
// at compile time — a structurally invalid meal fails the build, not runtime.
const meals: Meal[] = mealsData.meals;

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

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pendingDate, setPendingDate] = useState<Date>(getStartOfToday);//initialize pendingDate to the start of today
  const [selectedMealName, setSelectedMealName] = useState<string>(meals[0].name);

  const handleDayPress = (day: DateData) => {
    setPendingDate(new Date(day.year, day.month - 1, day.day)); //js indexes months from 0, so we need to subtract 1 from the month value
  };

  const handleReset = () => {
    setSelectedDate(null);
    setPendingDate(getStartOfToday());
  };

  return (
    <View
      style={[
        styles.container,
        selectedDate ? styles.containerSelected : styles.containerPicking,
      ]}
    >
      {selectedDate ? (
        <>
          <Pressable style={styles.backButton} onPress={handleReset} hitSlop={8}>
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
              size={26}
              tintColor="black"
            />
          </Pressable>
          <Text style={styles.selectedDate}>
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
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
            
            onChange={(meal) => setSelectedMealName(meal.name)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
