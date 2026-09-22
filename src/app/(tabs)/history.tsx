import { Text, View, StyleSheet } from "react-native";

import { COLORS } from "@/constants/theme";

export default function History() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cream,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.teal,
  },
});
