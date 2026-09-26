import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { SymbolView } from "expo-symbols";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COMMON_ALLERGENS } from "@/constants/allergens";
import { COLORS } from "@/constants/theme";
import { useAppState } from "@/hooks/use-appState";
import { getAllergenLabel } from "@/utils/allergens";
import type { WeightGoal } from "@/utils/calorie-tips";
import HealthConnectionStatus from "@/components/health-connection-status";

const WEIGHT_GOAL_OPTIONS: { id: WeightGoal; label: string }[] = [
  { id: "lose", label: "Lose" },
  { id: "maintain", label: "Maintain" },
  { id: "gain", label: "Gain" },
];

const GOAL_HELPER_TEXT: Record<WeightGoal, string> = {
  lose: "Eat a little below what you burn each day.",
  maintain: "Eat about the same as what you burn each day.",
  gain: "Eat a little above what you burn each day.",
};

type Pace = "gentle" | "moderate" | "custom";

// Fixed presets, same values regardless of lose vs. gain — only the sign
// (deficit vs. surplus) differs, handled entirely in how they're displayed.
const GENTLE_MARGIN = 250;
const MODERATE_MARGIN = 500;

const getPaceForMargin = (margin: number): Pace => {
  if (margin === GENTLE_MARGIN) return "gentle";
  if (margin === MODERATE_MARGIN) return "moderate";
  return "custom";
};

export default function Profile() {
  // Common tags and custom-typed ones both live in this one flat list —
  // there's no meaningful difference between them once they're allergies
  // the user has, so one persisted array covers both instead of tracking
  // them as two separate pieces of state.
  const allergies = useAppState((state) => state.allergies);
  const setAllergies = useAppState((state) => state.setAllergies);
  const weightGoal = useAppState((state) => state.weightGoal);
  const setWeightGoal = useAppState((state) => state.setWeightGoal);
  const calorieMargin = useAppState((state) => state.calorieMargin);
  const setCalorieMargin = useAppState((state) => state.setCalorieMargin);
  const resetAppState = useAppState((state) => state.resetAppState);
  const [customAllergen, setCustomAllergen] = useState("");

  const [selectedPace, setSelectedPace] = useState<Pace>(() =>
    calorieMargin === 0 ? "gentle" : getPaceForMargin(calorieMargin),
  );

  const [customMarginText, setCustomMarginText] = useState(() =>
    getPaceForMargin(calorieMargin) === "custom"
      ? String(calorieMargin)
      : "300",
  );

  const toggleAllergen = (allergen: string) => {
    const updated = allergies.includes(allergen)
      ? allergies.filter((item) => item !== allergen)
      : [...allergies, allergen];
    setAllergies(updated);
  };

  const handleAddCustomAllergen = () => {
    const trimmed = customAllergen.trim();
    if (trimmed !== "" && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
    }
    setCustomAllergen("");
  };

  const handleRemoveCustomAllergen = (allergen: string) => {
    setAllergies(allergies.filter((item) => item !== allergen));
  };

  const applyPace = (pace: Pace) => {
    if (pace === "gentle") {
      setCalorieMargin(GENTLE_MARGIN);
    } else if (pace === "moderate") {
      setCalorieMargin(MODERATE_MARGIN);
    } else {
      setCalorieMargin(Number(customMarginText) || 0);
    }
  };

  const handleSelectWeightGoal = (id: WeightGoal) => {
    setWeightGoal(id);

    if (id === "maintain") {
      setCalorieMargin(0);
    } else {
      applyPace(selectedPace);
    }
  };

  const handleSelectPace = (pace: Pace) => {
    setSelectedPace(pace);
    applyPace(pace);
  };

  const handleChangeCustomMargin = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "").replace(/^0+/, "");
    setCustomMarginText(sanitized);
    setCalorieMargin(Number(sanitized)); //Number("") is 0, so an emptied field correctly resolves to 0
  };

  const handleShowMarginInfo = () => {
    Alert.alert(
      weightGoal === "gain"
        ? "What's a daily surplus?"
        : "What's a daily deficit?",
      weightGoal === "gain"
        ? "This is how many calories above your maintenance level (what your body burns in a day) you aim to eat, to gain weight at a steady pace. A smaller surplus gains weight more slowly but is easier to sustain."
        : "This is how many calories below your maintenance level (what your body burns in a day) you aim to eat, to lose weight at a steady pace. A smaller deficit loses weight more slowly but is easier to sustain.",
    );
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
            resetAppState(); //AsyncStorage.clear() wipes the persisted copy, but the store's in-memory state needs its own reset too
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
          .filter((allergen) => !COMMON_ALLERGENS.includes(allergen)) // avoid duplicating common allergens
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

      <Text style={styles.sectionLabel}>Your goal</Text>
      <View style={styles.segmentedControl}>
        {WEIGHT_GOAL_OPTIONS.map((option) => {
          const isSelected = weightGoal === option.id;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.segmentedOption,
                isSelected && styles.segmentedOptionSelected,
              ]}
              onPress={() => handleSelectWeightGoal(option.id)}
            >
              <Text
                style={[
                  styles.segmentedOptionText,
                  isSelected && styles.segmentedOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.goalHelperText}>{GOAL_HELPER_TEXT[weightGoal]}</Text>

      {weightGoal !== "maintain" && (
        <>
          <Text style={styles.sectionLabel}>Pace</Text>

          {(["gentle", "moderate"] as const).map((pace) => {
            const margin = pace === "gentle" ? GENTLE_MARGIN : MODERATE_MARGIN;
            const weeklyKg = pace === "gentle" ? "0.25" : "0.45";
            const sign = weightGoal === "gain" ? "+" : "-";
            const isSelected = selectedPace === pace;
            return (
              <Pressable
                key={pace}
                style={[styles.paceCard, isSelected && styles.paceCardSelected]}
                onPress={() => handleSelectPace(pace)}
              >
                <View
                  style={[
                    styles.paceRadioOuter,
                    isSelected && styles.paceRadioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.paceRadioInner} />}
                </View>
                <View style={styles.paceCardText}>
                  <Text style={styles.paceCardTitle}>
                    {pace === "gentle" ? "Gentle" : "Moderate"}
                  </Text>
                  <Text style={styles.paceCardSubtitle}>
                    {sign}
                    {margin} kcal/day · ≈ {weeklyKg} kg/week
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <Pressable
            style={[
              styles.paceCard,
              selectedPace === "custom" && styles.paceCardSelected,
            ]}
            onPress={() => handleSelectPace("custom")}
          >
            <View
              style={[
                styles.paceRadioOuter,
                selectedPace === "custom" && styles.paceRadioOuterSelected,
              ]}
            >
              {selectedPace === "custom" && (
                <View style={styles.paceRadioInner} />
              )}
            </View>
            <View style={styles.paceCardText}>
              <Text style={styles.paceCardTitle}>Custom</Text>
              <Text style={styles.paceCardSubtitle}>Set your own amount</Text>
            </View>
          </Pressable>

          {selectedPace === "custom" && (
            <>
              <View style={styles.marginLabelRow}>
                <Text style={styles.marginLabelText}>
                  Daily {weightGoal === "gain" ? "surplus" : "deficit"}
                </Text>
                <Pressable onPress={handleShowMarginInfo} hitSlop={8}>
                  <SymbolView
                    name={{
                      ios: "info.circle",
                      android: "info",
                      web: "info",
                    }}
                    size={16}
                    tintColor={COLORS.textMuted}
                  />
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="E.g. 500"
                keyboardType="numeric"
                value={customMarginText}
                onChangeText={handleChangeCustomMargin}
              />
              <Text style={styles.marginHintText}>
                Recommended: 100–750 kcal. Smaller changes are easier to keep
                up.
              </Text>
            </>
          )}
        </>
      )}

      <Text style={styles.sectionLabel}>Apple Health</Text>
      <HealthConnectionStatus />

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
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#f2f2f5",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentedOptionSelected: {
    backgroundColor: COLORS.teal,
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.teal,
  },
  segmentedOptionTextSelected: {
    color: "#fff",
  },
  goalHelperText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  paceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  paceCardSelected: {
    borderColor: COLORS.teal,
    backgroundColor: "#f2f7f6",
  },
  paceRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  paceRadioOuterSelected: {
    borderColor: COLORS.teal,
  },
  paceRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.teal,
  },
  paceCardText: {
    flex: 1,
    gap: 2,
  },
  paceCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  paceCardSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  marginLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 4,
  },
  marginLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.teal,
  },
  marginHintText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
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
