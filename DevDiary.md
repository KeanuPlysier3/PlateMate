# DevDiary

## Entry 1 — Base navigation scaffold (Home, Planner, Historie, Profile)

**Date:** 2026-09-18

**Prompt given:**
> "The first thing i will ask you to do is just to make all the pages, that includes the home page, the schedule page, the history page and the profile page. The profile should not be in the navigation tab but in the header. You may use the platform specific tabs. So I expect a components folder containing both app-tabs.native.tsx and app-tabs.tsx for web. None of the files need to have any functionality and only contain a title."

### What I built

- **`src/components/app-tabs.native.tsx`** — the tab bar for iOS/Android, built with `NativeTabs` from `expo-router/unstable-native-tabs` (this is the correct import path for Expo SDK 57 — it moves to `expo-router/native-tabs` starting in SDK 58, per the versioned docs). It renders three triggers: Home, Planner, Historie, each with an SF Symbol / Material icon.
- **`src/components/app-tabs.tsx`** — the tab bar for web, built with the headless `Tabs` / `TabList` / `TabTrigger` / `TabSlot` primitives from `expo-router/ui`, styled manually since these render as unstyled `View`/`Pressable` by default.
- **`src/app/(tabs)/_layout.tsx`** — a route group layout that just renders `<AppTabs />`. Because the file has no platform suffix, Metro's platform extension resolution automatically swaps in `app-tabs.native.tsx` on iOS/Android and falls back to `app-tabs.tsx` on web — no branching logic needed anywhere.
- **`src/app/(tabs)/index.tsx`, `planner.tsx`, `history.tsx`** — the three tab screens. Each is a bare `View` with a centered `Text` title, no logic, matching your instruction that these should have no functionality yet.
- **`src/app/profile.tsx`** — the profile screen, deliberately placed *outside* the `(tabs)` group so it isn't picked up as a fourth tab.
- **`src/app/_layout.tsx`** — the root `Stack`. It has two screens: `(tabs)` (title "PlateMate", with a 👤 button in `headerRight` that links to `/profile`) and `profile` (`presentation: "modal"`, title "Profiel"). This is what puts the profile entry point in the header instead of the tab bar, and gives it native modal presentation (slide/drag-to-dismiss on iOS, swipe-back on Android, close-link on web) per the Expo Router modals docs.
- Deleted the old placeholder `src/app/index.tsx`, since `(tabs)/index.tsx` now owns that route.

### Why these choices

- **Two files instead of one with `Platform.select`**: you explicitly asked for `app-tabs.native.tsx` + `app-tabs.tsx`, and it's also the idiomatic Expo Router pattern — native tab bars and web tab bars have fundamentally different APIs (`NativeTabs` renders an actual native tab bar; `expo-router/ui` renders regular RN views), so keeping them as separate files avoids a bunch of conditional logic and lets Metro do the platform selection for free.
- **Profile as a root-level modal, not a tab**: matches your requirement directly, and also matches the wireframe, where the profile screen is a full-screen modal opened via the header avatar icon, not a tab bar item.
- **Checked the live SDK 57 docs before writing any of this** (per AGENTS.md): confirmed the `expo-router/unstable-native-tabs` import path (SDK 57 uses `unstable-native-tabs`; `expo-router/native-tabs` is SDK 58+), the `Tabs/TabList/TabTrigger/TabSlot` API shape for web, and the `presentation: "modal"` pattern for the profile screen.

### How I verified it

- `tsc --noEmit` — no type errors in anything under `src/` (pre-existing errors only exist in the old, no-longer-referenced `example/` folder from the starter template).
- `npx expo export --platform web` — produced a successful static build with all expected routes present (`/`, `/planner`, `/history`, `/profile`, plus the `(tabs)` group), confirming the routing/platform-file resolution is wired correctly.
- I did not have browser automation tooling (Playwright/chromium-cli) available in this environment to grab a live screenshot without an extra install step, so this was verified via a successful production build rather than visually — worth a manual look with `npx expo start --web` when you get a chance.

## Entry 2 — Replace emoji header icon with SF Symbol

**Date:** 2026-09-18

**Prompt given:**
> "one extra rule during development you will not use emojis in the code. An example is the profile button contains an emoji. In this case you will use an sf icon instead."

### What I changed

In `src/app/_layout.tsx`, the header's profile button was rendering a 👤 emoji as a `Text` node. I replaced it with `SymbolView` from `expo-symbols`, using a cross-platform name object: `{ ios: "person.circle", android: "person", web: "person" }`. Confirmed via the SDK 57 docs that `SymbolView`'s `name` prop accepts either a bare string (iOS-only) or this platform object form, which is what makes it render correctly on Android and web too instead of just iOS.

### Why

Standing rule going forward, not just this one fix: no emoji characters anywhere in PlateMate's code, ever — icons should always go through `SymbolView` (SF Symbols on iOS, Material Symbol equivalents on Android/web). I've saved this as a persistent rule so I don't reintroduce emojis in later builds.

### How I verified it

- `tsc --noEmit` — clean, no errors in `src/`.
- Grepped `src/` for emoji characters — none remain.

## Entry 3 — Planner date picker (pick a date, then show it large with a reset button)

**Date:** 2026-09-18

**Prompt given:**
> "Alright next up on the schedule page we will show the following @react-native-community/datetimepicker. Once a user selected a date from the date time picker. the date and time dissapears and they see the date they chose in large. There will also be a button allowing them to reset the useState change and pick another date. You will use useState for this and the provided library."

### What I built

Rewrote [`src/app/(tabs)/planner.tsx`](<src/app/(tabs)/planner.tsx>) to hold one piece of state: `selectedDate` (`Date | null`), via `useState`.

- **No date picked yet** (`selectedDate === null`) → renders `DateTimePicker` (`mode="date"`) from `@react-native-community/datetimepicker`.
- **Date picked** → the picker disappears entirely and is replaced by a large, formatted date (`toLocaleDateString` with weekday/day/month/year) plus a "Kies opnieuw" button that calls `setSelectedDate(null)`, putting the screen back into picker mode.

Installed the library with `npx expo install @react-native-community/datetimepicker` (not `npm install`) so Expo resolves the exact version compatible with SDK 57 and wires up its config plugin automatically.

### Why these choices

- **Checked the SDK 57 docs and the library's own docs before writing anything** (per AGENTS.md): the Expo SDK reference page confirmed the install command and that it's Expo Go-compatible, but pointed to the library's own docs for the actual API. Doing so surfaced that **`onChange` is deprecated** in favor of `onValueChange` (plus `onDismiss`/`onNeutralButtonPress`), so I used `onValueChange` rather than the older, more commonly-copy-pasted `onChange` pattern.
- **Single `useState<Date | null>`** rather than a separate boolean "show picker" flag: `null` already unambiguously means "no date chosen yet, show the picker," and any `Date` value means "show the result." One state variable instead of two keeps the toggle logic (and the reset button) trivial — reset is just `setSelectedDate(null)`.
- **`expo install` instead of `npm install`**: this is a native module with a config plugin; `expo install` guarantees the version matches what SDK 57 expects and registers the plugin in `app.json` automatically (visible as `@react-native-community/datetimepicker` now being added under `plugins`).

### How I verified it

- `tsc --noEmit` — clean; this also caught a real type mismatch on my first pass (`onValueChange`'s date argument is a non-optional `Date`, and the event type is `DateTimePickerChangeEvent`, not `DateTimePickerEvent` used by the deprecated `onChange`) — fixed by matching the library's actual declared types.
- `npx expo export --platform web` — successful build, confirming the native module also bundles without errors on the web target (it ships a web implementation).
