import { Link, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable } from "react-native";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "PlateMate",
          headerRight: () => (
            <Link href="/profile" asChild>
              <Pressable hitSlop={8}>
                <SymbolView
                  name={{ ios: "person.circle", android: "person", web: "person" }}
                  size={22}
                />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profiel",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
