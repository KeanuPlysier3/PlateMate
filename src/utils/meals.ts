import AsyncStorage from "@react-native-async-storage/async-storage";

import mealsData from "@/data/meals.json";
import { CUSTOM_MEALS_STORAGE_KEY } from "@/constants/storage";
import type { Meal } from "@/types/meal";

// Typing this assignment as Meal[] makes TypeScript check every entry in
// meals.json against the Meal shape at compile time — a structurally
// invalid meal fails the build, not runtime.
export const bundledMeals: Meal[] = mealsData.meals;

// Shared by planner.tsx (dropdown) and meal/[name].tsx (detail lookup) —
// previously duplicated inline in both places.
export async function getAllMeals(): Promise<Meal[]> {
  const storedValue = await AsyncStorage.getItem(CUSTOM_MEALS_STORAGE_KEY);
  const customMeals: Meal[] = storedValue ? JSON.parse(storedValue) : [];
  return [...bundledMeals, ...customMeals];
}
