import { StyleSheet, Text } from "react-native";

// Apple Health / HealthKit is iOS-only — this is the fallback rendered on
// Android and web, matching the platform-split pattern already used for
// MealImageField (native photo picking vs. a web-only notice).
export default function HealthConnectionStatus() {
  return (
    <Text style={styles.unavailableText}>
      Apple Health is only available on iOS.
    </Text>
  );
}

const styles = StyleSheet.create({
  unavailableText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
});
