// All user-added meals live under this one AsyncStorage key, as a single
// JSON-serialized Meal[]. Shared between add-meal.tsx (writes it) and
// planner.tsx (reads it, merged with the bundled meals.json).
export const CUSTOM_MEALS_STORAGE_KEY = "customMeals";

// Set by add-meal.tsx right after a successful save, holding that meal's
// name. planner.tsx checks for it on focus to auto-select the meal that was
// just created, then clears it so it doesn't re-trigger on a later visit.
export const LAST_ADDED_MEAL_STORAGE_KEY = "lastAddedMealName";

// A single JSON-serialized PlannedMeals object (see src/types/planned-meal.ts)
// — keyed by "YYYY-MM-DD" date string, so a lookup is a direct property
// access rather than a search. Written by planner.tsx's "Plan maaltijd"
// button; read wherever a planned meal needs to be shown (e.g. Home's
// upcoming-7-days list, later).
export const PLANNED_MEALS_STORAGE_KEY = "plannedMeals";
