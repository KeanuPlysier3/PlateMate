import type { ImageSourcePropType } from "react-native";

import { mealImageMap } from "@/constants/meal-images";

// A Meal's `image` field holds one of two different kinds of value: a real
// file:// URI (a native user-added meal's photo, copied into permanent
// storage by meal-image-field.native.tsx), or a path relative to `@/assets/`
// (every bundled seed meal, the placeholder, and web-added meals — which
// always use the placeholder, since image picking is native-only) that needs
// the static require() map instead.
export function resolveMealImage(image: string): ImageSourcePropType {
  if (image.startsWith("file://")) {
    return { uri: image };
  }

  return mealImageMap[image] ?? mealImageMap["images/meal-placeholder.png"];
}
