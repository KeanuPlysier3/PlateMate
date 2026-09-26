import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WeightGoal } from "@/utils/calorie-tips";
import type { Meal } from "@/types/meal";
import type { PlannedMeals } from "@/types/planned-meal";

interface AppState {
  plannedMeals: PlannedMeals;
  allergies: string[];
  weightGoal: WeightGoal;
  calorieMargin: number;

  planMeal: (dateKey: string, meal: Meal) => void;
  deletePlannedMeal: (dateKey: string) => void;
  setAllergies: (allergies: string[]) => void;
  setWeightGoal: (goal: WeightGoal) => void;
  setCalorieMargin: (margin: number) => void;
  resetAppState: () => void;
}

const INITIAL_APP_STATE = {
  plannedMeals: {} as PlannedMeals,
  allergies: [] as string[],
  weightGoal: "maintain" as WeightGoal,
  calorieMargin: 0,
};

export const useAppState = create<AppState>()(
  persist(
    //keep data alive during app restarts, by persisting it to AsyncStorage
    (set) => ({
      ...INITIAL_APP_STATE,

      planMeal: (dateKey, meal) =>
        set((state) => ({
          plannedMeals: { ...state.plannedMeals, [dateKey]: meal }, //overwrites any meal already planned for this date, by design — one meal per date
        })),

      deletePlannedMeal: (dateKey) =>
        set((state) => {
          const updated = { ...state.plannedMeals };
          delete updated[dateKey];
          return { plannedMeals: updated };
        }),

      setAllergies: (allergies) => set({ allergies }),
      setWeightGoal: (weightGoal) => set({ weightGoal }),
      setCalorieMargin: (calorieMargin) => set({ calorieMargin }),
      resetAppState: () => set(INITIAL_APP_STATE),
    }),
    {
      name: "appState", // zustand persist key
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
