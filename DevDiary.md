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

## Entry 4 — In-screen back arrow (top-left, not the header) replaces "Kies opnieuw"

**Date:** 2026-09-18

**Prompt given:**
> "instead of the kies opnieuw button add the return arrow button in the upper left corner (not the header) This button will be more clear. Underneath it should show the selected date"

### What I built

Replaced the "Kies opnieuw" text button in `(tabs)/planner.tsx` with a `SymbolView` return-arrow icon (`chevron.left` / `arrow_back`) wrapped in a `Pressable`, positioned at the top-left of the screen's own content area — not the shared app header, per your instruction. It still calls `setSelectedDate(null)` to go back to the calendar. The selected date text now renders directly underneath it, left-aligned, instead of centered.

Split the container styling into two variants depending on state: `containerPicking` (centered, for the calendar view) and `containerSelected` (top/left-aligned, for the arrow + date view), applied conditionally via a style array.

### Why

- **"Not the header"** was an explicit correction from earlier attempts (Entries 5–7 in an earlier version of this diary, since reverted) where I tried routing this through the shared `Stack` header and ran into a navigator-boundary bug. Keeping the control entirely inside the screen's own render tree sidesteps that class of problem entirely — it's a plain conditional render + local state update, nothing crosses a navigator boundary.
- **Arrow over text button**: matches your stated reasoning that an icon-only affordance in a fixed, predictable corner position reads more clearly than a labeled button floating in the middle of the content.
- **No emoji**: consistent with the standing "use SF Symbols via `SymbolView`, never emoji" rule.

### How I verified it

- `tsc --noEmit` — clean, no errors in `src/`.
- `npx expo export --platform web` — successful build, all routes intact.

## Entry 5 — Fix: today wasn't selectable, add a confirm button

**Date:** 2026-09-18

**Prompt given:**
> "I have a hunch that this is the problem no value is the displayed meaning that it is the current selected value. Since it is selected the onChange event can't trigger when we click on the current date because it is already the current date. We could hypothetically fix this problem by adding a confirmation button to selecting a date. This button thn does the UI change instead of tapping a date"

### The actual root cause

Your diagnosis was correct. `DateTimePicker`'s `value` prop was set to today, so tapping "today" in the inline calendar doesn't fire an update event at all — on iOS this is backed by `UIDatePicker`, a native `UIControl` whose `valueChanged` action only fires when the control's value actually changes. Since the tap doesn't change anything (it's already showing today), no JS callback ever runs, so there was no code path to confirm "today" was chosen.

### What I built

Split the single `selectedDate` state into two:

- **`pendingDate`** — what the inline calendar currently shows, initialized to the start of today via `getStartOfToday()`. Updated by `onValueChange` whenever the user taps a *different* day (that case already worked fine).
- **`selectedDate`** — the confirmed date, `null` until the user taps a new "Bevestigen" (confirm) button, which sets `selectedDate = pendingDate`.

Because `pendingDate` already equals today by default — set in JS, not read back from the native control — confirming without touching the calendar now works correctly: the confirm button doesn't need the picker to have fired any event at all, it just commits whatever `pendingDate` already holds.

The back arrow's reset handler (`handleReset`) now also resets `pendingDate` back to today, so reopening the picker doesn't start on a stale previously-picked day.

I also reverted two incidental regressions from the version in progress: `onChange` (deprecated, weaker event typing) back to `onValueChange`, and `minimumDate={undefined}` back to a real start-of-today value — the missing minimum meant past dates had become selectable again, which was unrelated to the actual bug being fixed.

### Why this design

- Adding a dependency on reading the calendar's "current" value back out via an event is exactly what caused the bug — so the fix avoids the native event entirely for the no-op case, instead trusting the JS-side default that was already correct.
- Kept `getStartOfToday()` as a plain module-level function (not a hook) since `useState(getStartOfToday)` — passing the function itself, not calling it — is the standard lazy-initializer pattern; it only runs once on mount rather than on every render.

### How I verified it

- `tsc --noEmit` — clean, no errors in `src/`.
- `npx expo export --platform web` — successful build, all routes intact.

## Entry 6 — Switched from @react-native-community/datetimepicker to react-native-calendars

**Date:** 2026-09-18

**Prompt given:**
> "you may switch to that library"
(following a discussion about the darker "today" color being an iOS system-level rendering detail of the native `UIDatePicker`/`UICalendarView`, not something the wrapper library's public API can fully override)

### What I changed

- **Removed** `@react-native-community/datetimepicker` (`npm uninstall`) and its config plugin entry from `app.json`'s `plugins` array.
- **Installed** `react-native-calendars` (pure JS, no native module/config plugin needed — confirmed it ships its own TypeScript types at `src/index.d.ts`, so no separate `@types` package was needed).
- **Rewrote** `(tabs)/planner.tsx`'s calendar to use `<Calendar>` from `react-native-calendars` instead of `<DateTimePicker display="inline">`.

The state model (`pendingDate` / `selectedDate`, the confirm button, the back-arrow reset) is unchanged from Entry 5 — only the calendar widget itself was swapped. `onDayPress` now receives a `DateData` object (`{ year, month, day, ... }`) instead of a native change event, and I construct the `Date` from its numeric fields (`new Date(day.year, day.month - 1, day.day)`) rather than parsing `dateString`, to avoid UTC/local timezone off-by-one issues.

### Why this fixes the original color problem

`react-native-calendars` renders every day cell as a plain React Native `View`/`Text` — there's no OS-level native control drawing a separate "today" indicator underneath a "selected" indicator. I made `pendingDate` (defaulting to today) always appear in `markedDates` with `selected: true`, so today and any other picked day go through the exact same rendering path (`selectedDayBackgroundColor` from `theme`). There's no longer a code path where "today" and "a selected day" can visually diverge, because there's only one visual state ("selected") instead of two independent ones ("today" + "selected") that could previously overlap and render differently.

### Trade-off acknowledged

This is a deliberate deviation from the original PlateMate spec, which explicitly named `@react-native-community/datetimepicker` as the date-selection library. Switching gives full styling control (which the native picker fundamentally can't offer) at the cost of the native OS look-and-feel and matching this decision to the original spec — a conscious choice made because the visual bug had no clean fix within the native picker's public API.

### How I verified it

- `tsc --noEmit` — clean, no errors in `src/`.
- `npx expo export --platform web` — successful build; confirms the new pure-JS library bundles fine on web too (no native-module linking step needed, unlike the previous library).

## Entry 7 — Calendar: wide, but shorter

**Date:** 2026-09-18

**Prompt given:**
> "i want it to be wide but not take a lot of the height"

### What I found and changed

Read the installed `react-native-calendars` source directly (`node_modules/react-native-calendars/src/calendar/style.js` and `.../day/basic/style.js`) rather than guessing: each day cell is a flexbox `flex: 1` inside a `flexDirection: "row"` week, so `width: "100%"` (already set in Entry 6) genuinely does fill the full width — that part was never the problem. The calendar's *height* comes from a separate, unrelated source: `weekVerticalMargin` (a theme value, default `7`px of vertical margin above and below every week row) and each day's fixed 32×32px circle.

Added `weekVerticalMargin: 2` to the `theme` prop in `(tabs)/planner.tsx`, which tightens the vertical gap between week rows without touching the width at all.

### A dead end worth recording

I first tried also shrinking the day-circle size via `theme["stylesheet.day.basic"] = { base: { width: 26, height: 26 } }`, since the source confirms the library reads that exact flat string key at runtime (`theme['stylesheet.day.basic']` in `day/basic/style.js`). But the library's own shipped `Theme` type only declares a *nested* `stylesheet.day.basic` shape, not that flat dot-string key — so `tsc` rejected it as an unknown property, even though it would have worked correctly at runtime. Rather than fight the library's own type/runtime mismatch with a type assertion, I dropped that part and kept only `weekVerticalMargin`, which is properly typed and already delivers a meaningfully shorter calendar.

### How I verified it

- `tsc --noEmit` — clean, no errors in `src/`.
- `npx expo export --platform web` — successful build.
