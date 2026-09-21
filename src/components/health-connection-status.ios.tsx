import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import {
  AuthorizationRequestStatus,
  isHealthDataAvailable,
  useHealthkitAuthorization,
} from "@kingstinct/react-native-healthkit";

// Only burned-calorie data is needed — active + resting (basal) energy —
// matching Home's "Live burn" stat tile (Entry 32/33), which is still a
// static placeholder until this data actually gets read somewhere.
const READ_TYPES = [
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBasalEnergyBurned",
] as const;

export default function HealthConnectionStatus() {
  const [status, requestAuthorization] = useHealthkitAuthorization({
    toRead: READ_TYPES,
  });
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isHealthDataAvailable()) {
    return (
      <Text style={styles.unavailableText}>
        Apple Health isn't available on this device.
      </Text>
    );
  }

  // Apple's HealthKit deliberately never reveals whether a *read* permission
  // was actually granted or denied — a privacy design in HealthKit itself,
  // not a limitation of this library. AuthorizationRequestStatus only ever
  // tells us whether the system considers this "already requested," not the
  // outcome, so "unnecessary" (meaning: already asked) is shown as "Access
  // requested," never as a potentially-false "Connected."
  const hasBeenRequested = status === AuthorizationRequestStatus.unnecessary;

  const handlePress = async () => {
    if (hasBeenRequested || isRequesting) {
      return;
    }
    setIsRequesting(true);
    try {
      await requestAuthorization();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Pressable
      style={styles.row}
      onPress={handlePress}
      disabled={hasBeenRequested || isRequesting}
    >
      <SymbolView
        name={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
        size={22}
        tintColor={hasBeenRequested ? "#2e7d32" : "#888"}
      />
      <View style={styles.textColumn}>
        <Text style={styles.statusTitle}>Apple Health</Text>
        <Text style={styles.statusSubtitle}>
          {hasBeenRequested
            ? "Access requested"
            : isRequesting
              ? "Requesting..."
              : "Tap to connect"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textColumn: {
    gap: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#888",
  },
  unavailableText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
});
