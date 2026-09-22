export const COMMON_ALLERGENS: string[] = [
  "gluten",
  "dairy",
  "peanuts", // meals.json only tags "peanuts" specifically, not tree nuts generally — closest existing match
  "soy",
];

//capitalizes the first letter of a common allergen for display purposes, e.g. "gluten" -> "Gluten"
export const getAllergenLabel = (allergen: string): string =>
  allergen.charAt(0).toUpperCase() + allergen.slice(1);

export const findMatchingAllergens = (
  mealAllergens: string[],
  userAllergies: string[],
): string[] => {
  const userAllergiesLower = new Set(
    userAllergies.map((allergy) => allergy.toLowerCase()),
  );
  return mealAllergens.filter((allergen) =>
    userAllergiesLower.has(allergen.toLowerCase()),
  );
};
