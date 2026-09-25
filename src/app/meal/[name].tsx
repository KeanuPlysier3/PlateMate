import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import AsyncStorage from "@react-native-async-storage/async-storage";

import mealsData from "@/data/meals.json";
import {
  ALLERGIES_STORAGE_KEY,
  CUSTOM_MEALS_STORAGE_KEY,
} from "@/constants/storage";
import { COLORS } from "@/constants/theme";
import { findMatchingAllergens, getAllergenLabel } from "@/constants/allergens";
import { resolveMealImage } from "@/utils/resolve-meal-image";
import type { Meal } from "@/types/meal";

// Same bundled-meals typing rationale as planner.tsx.
const bundledMeals: Meal[] = mealsData.meals;

export default function MealDetail() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [storedCustomMeals, storedAllergies] = await Promise.all([
        AsyncStorage.getItem(CUSTOM_MEALS_STORAGE_KEY),
        AsyncStorage.getItem(ALLERGIES_STORAGE_KEY),
      ]);
      const customMeals: Meal[] = storedCustomMeals
        ? JSON.parse(storedCustomMeals)
        : [];
      const allMeals = [...bundledMeals, ...customMeals];
      setMeal(allMeals.find((candidate) => candidate.name === name) ?? null);
      setUserAllergies(storedAllergies ? JSON.parse(storedAllergies) : []);
    })();
  }, [name]);

  if (!meal) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Meal not found.</Text>
      </View>
    );
  }

  const matchedAllergens = findMatchingAllergens(meal.allergens, userAllergies);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <View style={styles.imageWrapper}>
        <Image source={resolveMealImage(meal.image)} style={styles.mealImage} />
        <View style={styles.caloriesBadge}>
          <SymbolView
            name={{
              ios: "flame.fill",
              android: "local_fire_department",
              web: "local_fire_department",
            }}
            size={14}
            tintColor={COLORS.white}
          />
          <Text style={styles.caloriesBadgeText}>{meal.calories} kcal</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealDescription}>{meal.description}</Text>

        {matchedAllergens.length > 0 && (
          <View style={styles.allergyWarning}>
            <SymbolView
              name={{
                ios: "exclamationmark.triangle.fill",
                android: "warning",
                web: "warning",
              }}
              size={20}
              tintColor="#b8860b"
            />
            <Text style={styles.allergyWarningText}>
              Warning: this recipe contains{" "}
              {matchedAllergens
                .map((allergen) => getAllergenLabel(allergen))
                .join(", ")}{" "}
              — this matches an allergy in your profile.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Ingredients</Text>
        <View style={styles.chipRow}>
          {meal.ingredients.map((ingredient) => (
            <View key={ingredient} style={styles.chip}>
              <Text style={styles.chipText}>{ingredient}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Allergens</Text>
        {meal.allergens.length > 0 ? (
          <View style={styles.chipRow}>
            {meal.allergens.map((allergen) => (
              <View key={allergen} style={[styles.chip, styles.allergenChip]}>
                <Text style={[styles.chipText, styles.allergenChipText]}>
                  {getAllergenLabel(allergen)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noAllergensText}>No known allergens</Text>
        )}

        {meal.link !== "" && (
          <Pressable
            style={styles.linkButton}
            onPress={() => Linking.openURL(meal.link)}
          >
            <SymbolView
              name={{ ios: "link", android: "link", web: "link" }}
              size={16}
              tintColor={COLORS.teal}
            />
            <Text style={styles.linkButtonText}>Open recipe</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    paddingBottom: 32,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  imageWrapper: {
    width: "100%",
    height: 240,
  },
  mealImage: {
    width: "100%",
    height: "100%",
  },
  caloriesBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.orange,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  caloriesBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  content: {
    padding: 24,
    gap: 8,
  },
  mealName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.teal,
  },
  mealDescription: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
  },
  allergyWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff6da",
  },
  allergyWarningText: {
    flex: 1,
    fontSize: 14,
    color: "#6b5900",
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    color: COLORS.teal,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#e0d9c4",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  allergenChip: {
    backgroundColor: "#fff6da",
    borderColor: "#f0dfa0",
  },
  allergenChipText: {
    color: "#6b5900",
  },
  noAllergensText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.teal,
  },
});
