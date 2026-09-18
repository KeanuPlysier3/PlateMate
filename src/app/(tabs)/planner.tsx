import { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import { Calendar, type DateData } from "react-native-calendars";

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
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    color: {ACCENT_COLOR},
    backgroundColor: "#1c1c1e",
  },
  confirmButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
