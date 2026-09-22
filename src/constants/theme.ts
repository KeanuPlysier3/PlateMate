// Palette lifted from wireframe/StyleExample.jpg — dark teal headers/hero
// surfaces, a warm cream page background, and coral-orange for buttons and
// highlights. Named tokens here (rather than repeating hex codes in every
// screen's StyleSheet) keep the six screens visually consistent and let the
// palette be adjusted in one place.
export const COLORS = {
  teal: "#1B4D46",
  tealLight: "#2E6D63",
  orange: "#E2703A",
  cream: "#F5F1E6",
  white: "#FFFFFF",
  textPrimary: "#1C1C1E",
  textMuted: "#6B6B6B",
} as const;
