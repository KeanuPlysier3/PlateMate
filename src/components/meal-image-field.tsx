import { StyleSheet, Text } from "react-native";

type MealImageFieldProps = {
  onImagePathChange: (path: string | null) => void;
};

// expo-file-system's File/Directory/Paths API (needed to permanently store a
// picked photo) is native-only — no web implementation exists at all. Rather
// than working around that with base64 data: URIs (tried, then reverted:
// those inflate ~33% larger and get re-serialized on every single
// AsyncStorage read/write of the whole customMeals array), image picking is
// simply not offered on web; web-added meals always use the bundled
// placeholder image instead, so this component never calls onImagePathChange.
export default function MealImageField(_props: MealImageFieldProps) {
  return (
    <Text style={styles.webImageNotice}>
      Adding your own photo is only possible in the mobile app. On web, a
      default image is used automatically.
    </Text>
  );
}

const styles = StyleSheet.create({
  webImageNotice: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
});
