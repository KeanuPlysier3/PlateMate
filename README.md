# PlateMate

PlateMate is an Expo/React Native app for planning meals against a personal
weight goal. You set a goal (lose, maintain, or gain weight) and a daily
calorie margin, plan a meal for any date on a calendar, and PlateMate compares
that planned intake against calories actually burned that day (via Apple
Health) to tell you whether you're on track. A History tab turns the last 7
days of that comparison into a chart, and a Profile screen holds your goal,
allergies, and Apple Health connection.

## AI usage

This project was built with AI assistance (Claude Code). Every AI-assisted
change is logged in [DevDiary.md](./DevDiary.md) as a dated, numbered entry —
the prompt that triggered it, exactly what was built, and how it was
verified — so the full history of what the AI did and why is traceable
there rather than only living in chat history.

## Setup

This app can no longer run in Expo Go — it depends on native modules (Apple
HealthKit, in particular) that only exist in a custom-built "dev client." For
the full explanation of why, and the complete step-by-step process for
building and running it on a physical iPhone, see
[PHYSICAL_DEVICE_SETUP.md](./PHYSICAL_DEVICE_SETUP.md).

Quick reference once the dev client is installed on your phone:

```bash
npm install
npm start          # same-network Wi-Fi
npm run start:tunnel   # if your Wi-Fi blocks phone↔Mac discovery (e.g. school networks)
```

## How storage works: zustand vs. AsyncStorage

PlateMate splits its persisted data across two different mechanisms, on
purpose — not because AsyncStorage was replaced everywhere, but because the
two things it stores have genuinely different needs.

### `useAppState` (zustand, in `src/hooks/use-appState.ts`)

Holds the four pieces of data that multiple screens need to read *and* stay
in sync on, live, while the app is running: `plannedMeals`, `allergies`,
`weightGoal`, and `calorieMargin`.

Before this store existed, each of Home, Planner, History, and Profile
independently read these values out of AsyncStorage in their own
`useFocusEffect`, re-fetching every time a screen regained focus — a
hand-rolled, less reliable version of shared state, and the direct cause of
a real bug once (Planner's calendar not reflecting a just-planned meal until
you left and came back). zustand's `create` gives every screen a hook into
the exact same in-memory object; any screen that calls one of the store's
setters (`planMeal`, `setAllergies`, etc.) causes every other screen
subscribed to that field to re-render immediately, with no manual re-fetch
required anywhere.

Since this data still has to survive an app restart (unlike, say, a
shopping-cart-style piece of state that's fine resetting), the store is
wrapped in zustand's `persist` middleware, configured to write through to
AsyncStorage under one key (`"appState"`) automatically on every change, and
to read it back in when the app launches. AsyncStorage is still the actual
disk storage underneath — `persist` is just the layer that stops every
screen from having to talk to it directly.

### Plain AsyncStorage (`src/constants/storage.ts`)

Two keys deliberately stayed outside the store:

- **`customMeals`** — the list of user-added recipes. Read in only a couple
  of places (Planner's dropdown, the meal-detail modal), more like a static
  catalog than live cross-screen state — there's no real benefit to making it
  reactive the way the four store fields are.
- **`lastAddedMealName`** — a one-shot transient flag set by the "Add Meal"
  screen and read exactly once by Planner to auto-select the meal you just
  created, then immediately cleared. It's not really "state" so much as a
  one-time signal between two screens, which doesn't need a shared store
  either.

## Libraries used

Only the libraries actually imported and used somewhere in `src/` are listed
here (checked directly against the code, not just `package.json`).

- **[expo-router](https://docs.expo.dev/router/introduction/)** — file-based
  navigation; every screen under `src/app/` is a route.
- **[zustand](https://github.com/pmndrs/zustand)** — the shared,
  cross-screen state store described above.
- **[`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/)**
  — on-device persistence, both directly (custom meals) and as zustand
  `persist`'s storage engine.
- **[`@kingstinct/react-native-healthkit`](https://github.com/kingstinct/react-native-healthkit)**
  — reads burned-calorie data (active + resting energy) from Apple Health,
  iOS-only.
- **[expo-symbols](https://docs.expo.dev/versions/latest/sdk/symbols/)** —
  every icon in the app (SF Symbols on iOS, Material icons elsewhere).
- **[react-native-calendars](https://github.com/wix/react-native-calendars)**
  — the calendar on the Planner tab, including marking days that already
  have a planned meal.
- **[react-native-element-dropdown](https://github.com/hoaphantn7604/react-native-element-dropdown)**
  — the meal-picker dropdown on Planner.
- **[react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)**
  — the diverging bar chart on the History tab.
- **[expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)**
  — copies a picked photo into permanent app storage when adding a custom
  meal.
- **[expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)**
  — lets the user choose a photo for a custom meal (native platforms only).
- **[expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)** — the
  success vibration when a meal is planned.
- **[react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)**
  — keeps the "meal planned!" toast clear of the device's safe area.

A few more packages are installed but never directly imported anywhere in
`src/` — they're peer dependencies of the libraries above, config-plugin-only
entries in `app.json`, or required by Expo/React Native's own tooling rather
than by this app's own code (e.g. `react-native-svg` and `expo-linear-gradient`
are required by `react-native-gifted-charts` internally; `expo-splash-screen`
is configured purely through `app.json`'s `plugins` list). They're left out of
the list above since this app's code never calls into them directly.

## The screens

- **`(tabs)/index.tsx` — Home.** Today's planned meal (tap it to open its full
  detail), three stats (planned intake, live Apple Health burn, difference),
  a goal-aware tip, and the next 6 days with quick "plan"/"delete" actions.
- **`(tabs)/planner.tsx` — Planner.** A calendar for picking a date (past
  dates with an already-planned meal are viewable but locked; empty past
  dates are disabled), a dropdown to pick a bundled or custom meal, and an
  overview screen showing the chosen meal with an allergy warning if it
  matches something in your profile.
- **`(tabs)/history.tsx` — History.** The last 7 days' net calorie balance
  (planned intake vs. burned) as a bar chart, plus a daily list showing each
  day's status against your current goal (within / too high / too low / no
  data).
- **`profile.tsx`** (modal) — Allergies, your weight goal (Lose/Maintain/Gain)
  with a Pace section (Gentle/Moderate/Custom calorie margin), your Apple
  Health connection status, and a debug "clear all stored data" button.
- **`add-meal.tsx`** (modal) — Form for adding a custom recipe: name,
  allergens, ingredients, description, calories, an optional link, and an
  optional photo.
- **`meal/[name].tsx`** (modal) — Full detail for any single meal (bundled or
  custom), looked up by name: image, calories, description, an allergy
  warning if applicable, ingredient/allergen chips, and a button to open its
  recipe link if it has one.
