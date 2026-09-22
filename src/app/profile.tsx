import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RadioGroup, {
  type RadioButtonProps,
} from "react-native-radio-buttons-group";

import {
  ALLERGIES_STORAGE_KEY,
  CALORIE_MARGIN_STORAGE_KEY,
  WEIGHT_GOAL_STORAGE_KEY,
} from "@/constants/storage";
import { COMMON_ALLERGENS, getAllergenLabel } from "@/constants/allergens";
import { COLORS } from "@/constants/theme";
import HealthConnectionStatus from "@/components/health-connection-status";

// containerStyle overrides the library's default marginHorizontal: 10 on
// each row, so the whole group sits flush against the left edge instead of
// with a small built-in indent.
const WEIGHT_GOAL_OPTIONS: RadioButtonProps[] = [
  {
    id: "lose",
    label: "Lose weight",
    value: "lose",
    containerStyle: { marginHorizontal: 0 },
  },
  {
    id: "maintain",
    label: "Maintain current weight",
    value: "maintain",
    containerStyle: { marginHorizontal: 0 },
  },
  {
    id: "gain",
    label: "Gain weight",
    value: "gain",
    containerStyle: { marginHorizontal: 0 },
  },
];

export default function Profile() {
  // Common tags and custom-typed ones both live in this one flat list —
  // there's no meaningful difference between them once they're allergies
  // the user has, so one persisted array covers both instead of tracking
  // them as two separate pieces of state.
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState("");
  const [selectedWeightGoalId, setSelectedWeightGoalId] = useState("maintain");
  const [calorieMargin, setCalorieMargin] = useState("0");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const storedAllergies = await AsyncStorage.getItem(
          ALLERGIES_STORAGE_KEY,
        );
        const storedWeightGoal = await AsyncStorage.getItem(
          WEIGHT_GOAL_STORAGE_KEY,
        );
        const storedCalorieMargin = await AsyncStorage.getItem(
          CALORIE_MARGIN_STORAGE_KEY,
        );

        if (!isActive) {
          return;
        }
        setAllergies(storedAllergies ? JSON.parse(storedAllergies) : []);
        setSelectedWeightGoalId(storedWeightGoal ?? "maintain");
        setCalorieMargin(storedCalorieMargin ?? "0");
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const persistAllergies = async (updated: string[]) => {
    setAllergies(updated);
    await AsyncStorage.setItem(ALLERGIES_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleAllergen = (allergen: string) => {
    const updated = allergies.includes(allergen)
      ? allergies.filter((item) => item !== allergen)
      : [...allergies, allergen];
    persistAllergies(updated);
  };

  const handleAddCustomAllergen = () => {
    const trimmed = customAllergen.trim();
    if (trimmed !== "" && !allergies.includes(trimmed)) {
      persistAllergies([...allergies, trimmed]);
    }
    setCustomAllergen("");
  };

  const handleRemoveCustomAllergen = (allergen: string) => {
    persistAllergies(allergies.filter((item) => item !== allergen));
  };

  // react-native-radio-buttons-group's onPress hands back just the tapped
  // id (RadioGroup is a controlled component — the selected item is driven
  // by the separate `selectedId` prop, not baked into radioButtons itself).
  const handleSelectWeightGoal = (id: string) => {
    setSelectedWeightGoalId(id);
    AsyncStorage.setItem(WEIGHT_GOAL_STORAGE_KEY, id);

    // Selecting "keep current weight" forces the margin back to 0 and locks
    // the field — a margin only means something when you're actively trying
    // to lose or gain, per the request.
    if (id === "maintain") {
      setCalorieMargin("0");
      AsyncStorage.setItem(CALORIE_MARGIN_STORAGE_KEY, "0");
    }
  };

  const isMarginActive = selectedWeightGoalId !== "maintain";

  const handleChangeCalorieMargin = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "").replace(/^0+/, ""); //remove any non-digit characters and leading zeros
    setCalorieMargin(sanitized);
    AsyncStorage.setItem(CALORIE_MARGIN_STORAGE_KEY, sanitized);
  };

  const handleResetStorage = () => {
    Alert.alert(
      "Clear storage",
      "Are you sure you want to clear all locally stored data (your own recipes, planned meals)? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("Done", "All locally stored data has been cleared.");
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.sectionLabel}>Allergies</Text>
      <View style={styles.tagRow}>
        {COMMON_ALLERGENS.map((allergen) => {
          const isSelected = allergies.includes(allergen);
          return (
            <Pressable
              key={allergen}
              style={[styles.tag, isSelected && styles.tagSelected]}
              onPress={() => toggleAllergen(allergen)}
            >
              <Text
                style={[styles.tagText, isSelected && styles.tagTextSelected]}
              >
                {getAllergenLabel(allergen)}
              </Text>
            </Pressable>
          );
        })}
        {allergies
          .filter((allergen) => !COMMON_ALLERGENS.includes(allergen)) //filter out any custom allergens that are already in the common list, so we don't duplicate them
          .map((allergen) => (
            <View
              key={allergen}
              style={[styles.tag, styles.tagSelected, styles.customTag]}
            >
              <Text style={[styles.tagText, styles.tagTextSelected]}>
                {allergen}
              </Text>
              <Pressable
                onPress={() => handleRemoveCustomAllergen(allergen)}
                hitSlop={8}
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close", web: "close" }}
                  size={14}
                  tintColor="#fff"
                />
              </Pressable>
            </View>
          ))}
      </View>
      <View style={styles.addAllergenRow}>
        <TextInput
          style={styles.addAllergenInput}
          placeholder="Add another allergy"
          value={customAllergen}
          onChangeText={setCustomAllergen}
          onSubmitEditing={handleAddCustomAllergen}
        />
        <Pressable
          style={styles.addAllergenButton}
          onPress={handleAddCustomAllergen}
        >
          <Text style={styles.addAllergenButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Goal</Text>
      <RadioGroup
        radioButtons={WEIGHT_GOAL_OPTIONS}
        onPress={handleSelectWeightGoal}
        selectedId={selectedWeightGoalId}
        layout="column"
        containerStyle={styles.radioGroupContainer}
      />

      <Text style={styles.sectionLabel}>Calorie margin (kcal per day)</Text>
      <TextInput
        style={[styles.input, !isMarginActive && styles.inputDisabled]}
        placeholder="E.g. 500"
        keyboardType="numeric"
        value={calorieMargin}
        onChangeText={handleChangeCalorieMargin}
        editable={isMarginActive}
      />

      <Text style={styles.sectionLabel}>Apple Health</Text>
      <HealthConnectionStatus />

      {/* Debug tool: wipes AsyncStorage entirely (customMeals, plannedMeals,
          lastAddedMealName). Useful whenever the Meal shape changes and
          previously-saved data no longer matches it (e.g. missing calories
          on meals saved before that field existed). */}
      <Pressable style={styles.resetButton} onPress={handleResetStorage}>
        <Text style={styles.resetButtonText}>Clear stored data (debug)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.teal,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 4,
    color: COLORS.teal,
  },
  radioGroupContainer: {
    alignItems: "flex-start",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tagSelected: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.teal,
  },
  tagTextSelected: {
    color: "#fff",
  },
  customTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addAllergenRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  addAllergenInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addAllergenButton: {
    width: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  addAllergenButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.teal,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: "#f2f2f5",
    color: "#aaa",
  },
  resetButton: {
    marginTop: 32,
    alignSelf: "center",
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
