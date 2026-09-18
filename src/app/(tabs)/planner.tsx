import { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleValueChange = (
    _event: DateTimePickerChangeEvent,
    date: Date,
  ) => {
    setSelectedDate(date);
  };

  return (
    <View style={styles.container}>
      {selectedDate ? (
        <>
          <Text style={styles.selectedDate}>
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Pressable
            style={styles.resetButton}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={styles.resetButtonText}>Kies opnieuw</Text>
          </Pressable>
        </>
      ) : (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="inline"
          minimumDate={new Date()}
          onValueChange={handleValueChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  selectedDate: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#1c1c1e",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
