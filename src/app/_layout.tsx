import { Link, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable } from "react-native";

import { COLORS } from "@/constants/theme";

const headerOptions = {
  headerStyle: { backgroundColor: COLORS.teal },
  headerTintColor: COLORS.white,
} as const;

export default function RootLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "PlateMate",
          headerRight: () => (
            <Link href="/profile" asChild>
              <Pressable hitSlop={8}>
                <SymbolView
                  name={{
                    ios: "person.circle",
                    android: "person",
                    web: "person",
                  }}
                  size={22}
                  tintColor={COLORS.white}
                />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="add-meal"
        options={{
          title: "Add Meal",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
