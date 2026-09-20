export interface Meal {
  name: string;
  allergens: string[];
  ingredients: string[];
  description: string;
  // In kilocalories (kcal) — the unit Apple HealthKit uses for dietary
  // energy (HKUnit.kilocalorie()), since this app compares planned meals
  // against Apple Health's burned-calorie data.
  calories: number;
  link: string;
  image: string;
}
