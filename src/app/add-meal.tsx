import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MealImageField from "@/components/meal-image-field";
import {
  CUSTOM_MEALS_STORAGE_KEY,
  LAST_ADDED_MEAL_STORAGE_KEY,
} from "@/constants/storage";
import type { Meal } from "@/types/meal";

// Every Meal field is required to fill in the form EXCEPT allergens and image
// (allergens can be empty, image falls back to a placeholder) — deriving this
// list from `keyof Meal` means a future change to the Meal shape that isn't
// reflected here fails the type check below, instead of silently going stale.
type RequiredMealField = Exclude<keyof Meal, "allergens" | "image">;

// Bundled fallback used when the user doesn't pick a photo. Stored the same
// way the 45 seeded meals store their images: a path relative to `@/assets/`.
const PLACEHOLDER_IMAGE = "images/meal-placeholder.png";

const splitCommaList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim()) //no whitespace
    .filter((item) => item !== ""); //remove empty strings

export default function AddMeal() {
  const [name, setName] = useState("");
  const [allergens, setAllergens] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [link, setLink] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const requiredFieldValues: Record<RequiredMealField, string> = {
    // TypeScript type check ensures all required fields are present
    name,
    ingredients,
    description,
    calories,
    link,
  };

  const areRequiredFieldsFilled = Object.values(requiredFieldValues).every(
    //check that all required fields are non-empty after trimming whitespace
    (value) => value.trim() !== "",
  );
  // calories also needs to actually parse to a real, positive number — Meal.calories
  // is typed as `number`, so "abc" passing the non-empty check above isn't enough
  // on its own; Number("abc") would silently become NaN otherwise.
  const caloriesValue = Number(calories);
  const isCaloriesValid = Number.isFinite(caloriesValue) && caloriesValue > 0;
  const isFormValid = areRequiredFieldsFilled && isCaloriesValid;

  const handleSubmit = async () => {
    if (!isFormValid || isSaving) {
      return;
    }

    setIsSaving(true); //prevent multiple submissions while saving
    try {
      const newMeal: Meal = {
        name: name.trim(),
        allergens: splitCommaList(allergens),
        ingredients: splitCommaList(ingredients),
        description: description.trim(),
        calories: caloriesValue,
        link: link.trim(),
        image: imagePath ?? PLACEHOLDER_IMAGE,
      };

      const storedValue = await AsyncStorage.getItem(CUSTOM_MEALS_STORAGE_KEY);
      const customMeals: Meal[] = storedValue ? JSON.parse(storedValue) : [];
      customMeals.push(newMeal);
      await AsyncStorage.setItem(
        CUSTOM_MEALS_STORAGE_KEY,
        JSON.stringify(customMeals),
      );
      // Read by planner.tsx's focus effect to auto-select this meal once
      // we've navigated back, then cleared there so it only fires once.
      await AsyncStorage.setItem(LAST_ADDED_MEAL_STORAGE_KEY, newMeal.name);

      router.back();
    } catch (error) {
      Alert.alert(
        "Saving failed",
        "Something went wrong while saving the meal. Please try again.",
      );
    } finally {
      //even if the save fails, we want to reset the saving state so the user can try again
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="E.g. Spaghetti Carbonara"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Allergens</Text>
      <TextInput
        style={styles.input}
        placeholder="Comma-separated, e.g. gluten, dairy, egg"
        value={allergens}
        onChangeText={setAllergens}
      />

      <Text style={styles.label}>Ingredients</Text>
      <TextInput
        style={styles.input}
        placeholder="Comma-separated, e.g. pasta, eggs, cheese"
        value={ingredients}
        onChangeText={setIngredients}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Short description of the dish"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Calories (kcal)</Text>
      <TextInput
        style={styles.input}
        placeholder="E.g. 650"
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />

      <Text style={styles.label}>Link</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        value={link}
        onChangeText={setLink}
      />

      <Text style={styles.label}>Photo</Text>
      <MealImageField onImagePathChange={setImagePath} />

      <Pressable
        style={[
          styles.submitButton,
          !isFormValid && styles.submitButtonDisabled,
        ]}
        disabled={!isFormValid || isSaving}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {isSaving ? "Saving..." : "Add"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#1c1c1e",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#aaa",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
