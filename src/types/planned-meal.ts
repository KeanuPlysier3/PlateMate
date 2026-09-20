import type { Meal } from "@/types/meal";

// Keyed by date string in the same "YYYY-MM-DD" format toDateKey() produces
// (planner.tsx) — using the date itself as the key means direct lookups
// (plannedMeals[someDateKey]) instead of searching an array, and makes
// "one meal per date" the natural behavior rather than something that has
// to be separately enforced.
export type PlannedMeals = Record<string, Meal>;
