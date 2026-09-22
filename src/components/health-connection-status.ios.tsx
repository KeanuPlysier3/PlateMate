import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import {
  AuthorizationRequestStatus,
  isHealthDataAvailable,
  useHealthkitAuthorization,
} from "@kingstinct/react-native-healthkit";

// Only burned-calorie data is needed — active + resting (basal) energy —

const READ_TYPES = [
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBasalEnergyBurned",
] as const;

export default function HealthConnectionStatus() {
  const [status, requestAuthorization] = useHealthkitAuthorization({ //destructure the return value of useHealthkitAuthorization to get status and requestAuthorization
    toRead: READ_TYPES,
  });

  const [isRequesting, setIsRequesting] = useState(false);

  if (!isHealthDataAvailable()) {
    return (
      <Text style={styles.unavailableText}>
        Apple Health isn't available on this dvice.
      </Text>
    );
  }

  // Apple's HealthKit deliberately never reveals whether a *read* permission
  // has been granted or denied, so we can't show a "connected" state.
  const hasBeenRequested = status === AuthorizationRequestStatus.unnecessary;//if the status is unnecessary, the user already requested,so we can consider it as "has been requested"

  const handlePress = async () => {
    if (isRequesting) {
      return;
    }

    if (hasBeenRequested) {
      Alert.alert(
        "Manage Health Access",
        'Open the Health app, tap your profile picture (top right), then "Apps", then "PlateMate" to change what data it can read.',
      );
      return;
    }

    setIsRequesting(true);
    try {
      await requestAuthorization();//request access to the specified health data types.
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Pressable
      style={styles.row}
      onPress={handlePress}
      disabled={isRequesting}
    >
      <SymbolView
        name={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
        size={22}
        tintColor={hasBeenRequested ? "#44bc4a" : "#888"}
      />
      <View style={styles.textColumn}>
        <Text style={styles.statusTitle}>Apple Health</Text>
        <Text style={styles.statusSubtitle}>
          {hasBeenRequested
            ? "Access requested,tap for how to manage"
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
