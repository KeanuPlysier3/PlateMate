import { Alert, Pressable, Text, View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Profile() {
  const handleResetStorage = () => {
    Alert.alert(
      "Opslag wissen",
      "Weet je zeker dat je alle lokaal opgeslagen data (eigen recepten, geplande maaltijden) wilt wissen? Dit kan niet ongedaan worden gemaakt.",
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Wissen",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("Klaar", "Alle lokaal opgeslagen data is gewist.");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profiel</Text>

      {/* Debug tool: wipes AsyncStorage entirely (customMeals, plannedMeals,
          lastAddedMealName). Useful whenever the Meal shape changes and
          previously-saved data no longer matches it (e.g. missing calories
          on meals saved before that field existed). */}
      <Pressable style={styles.resetButton} onPress={handleResetStorage}>
        <Text style={styles.resetButtonText}>Wis opgeslagen data (debug)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c0392b",
  },
  resetButtonText: {
    color: "#c0392b",
    fontSize: 16,
    fontWeight: "600",
  },
});
