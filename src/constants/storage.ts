// All user-added meals live under this one AsyncStorage key, as a single
// JSON-serialized Meal[]. Shared between add-meal.tsx (writes it) and
// planner.tsx (reads it, merged with the bundled meals.json).
export const CUSTOM_MEALS_STORAGE_KEY = "customMeals";

// Set by add-meal.tsx right after a successful save, holding that meal's
// name. planner.tsx checks for it on focus to auto-select the meal that was
// just created, then clears it so it doesn't re-trigger on a later visit.
export const LAST_ADDED_MEAL_STORAGE_KEY = "lastAddedMealName";
