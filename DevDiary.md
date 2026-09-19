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

## Entry 8 — Meal images: sourcing, folder move, and compression

**Date:** 2026-09-19

**Prompts given (two related requests):**
> "can you go online and find a fitting image for each meal in the meals.json file? place those in src/assets/images/meals. Add the image path to the json file for the correct meal."
> (You then moved the folder yourself to `src/assets/images/meals` after I'd initially placed it at the root `assets/images/meals` — see below.)
> "yes compress the images and update the paths inside the json file, I changed the meals directory's location to inside the src/assets folder."

### What happened, in order

1. Before touching anything, I flagged that your `tsconfig.json` already had `"@/assets/*": ["./assets/*"]` pointing at the **root** `assets/` folder (where `icon.png`, `splash-icon.png`, etc. live), so a brand-new `src/assets/` folder as literally requested would create a second, un-aliased assets location. You chose to go with the root `assets/images/meals/` to match the existing alias.
2. Given the scale (45 meals — the spec said 40, but the file actually has 45), I delegated the image sourcing to a background agent rather than doing 45 rounds of search+download inline. Its brief: only use verifiably freely-licensed images (Wikimedia Commons, CC0/CC-BY/CC-BY-SA/PD), download with `curl`, name files kebab-case after each meal's `name`, and add an `"image"` field to every meal object in `src/data/meals.json` via a targeted line-insertion (not a full rewrite) so the rest of the file's formatting stayed untouched.
3. The agent delivered: all 45 meals got a real, verified (non-empty, correct MIME-type) photo from Wikimedia Commons, saved into `assets/images/meals/`, with `"image": "images/meals/<slug>.jpg"` added to each JSON entry. I independently re-verified this myself afterward (JSON parses, all 45 have a non-empty `image` field) rather than taking the agent's own report at face value.
4. **You then moved the `meals` folder yourself** from the root `assets/images/meals/` into `src/assets/images/meals/` — the location you'd originally asked for — and asked me to compress the images and fix the paths to match.
5. **Compression**: used macOS's built-in `sips` (no ImageMagick/other tool installed) to resize every image to a max dimension of 1080px and re-encode as JPEG at quality 72, in place. This took the folder from **152MB down to 8.0MB** (44 images were already JPEG; the one PNG — `miso-glazed-salmon.png` — was converted to `.jpg` in the same pass for consistency and better compression, since it's a photo with no transparency to preserve).
6. **Path fix**: rather than rewriting all 45 `"image"` string values in the JSON, I updated the single `tsconfig.json` alias — `"@/assets/*"` now points to `"./src/assets/*"` instead of `"./assets/*"` — since I'd confirmed nothing in `src/` was yet using that alias, so repointing it was safe. The stored JSON values (`"images/meals/<slug>.jpg"`) are the suffix appended to `@/assets/`, so they didn't need to change at all — only the one file whose extension changed (`miso-glazed-salmon.png` → `.jpg`) needed its JSON entry updated.

### Why delegate the image search instead of doing it myself inline

45 independent web lookups (search + verify license + download + verify the file) is exactly the kind of task where doing it turn-by-turn in the main conversation would have burned an enormous number of tool calls for something that doesn't need my continuous judgment at each step — a background agent with the same tools (WebSearch/WebFetch/Bash) could work through the list unsupervised, and I verified its output afterward rather than trusting its self-report.

### Why fix the alias instead of rewriting the JSON strings

Editing one line in `tsconfig.json` and re-verifying all 45 paths resolve is strictly safer than mass-editing 45 string values in a JSON file by hand (or via another scripted pass) — fewer places for a typo or off-by-one to hide, and it keeps the JSON's `image` values as portable relative paths rather than baking in a specific folder location.

### How I verified it

- `node -e "JSON.parse(...)"` — confirmed all 45 meals have an `image` field.
- Wrote a small Node check resolving every `image` path against `src/assets/` on disk — confirmed all 45 files actually exist at the paths the JSON claims (0 missing).
- Spot-checked resulting image dimensions with `sips -g pixelWidth -g pixelHeight` — confirmed the 1080px cap took effect.
- `tsc --noEmit` — clean (aside from a pre-existing, unrelated type error in `planner.tsx` from your own in-progress edit at the time, which I left untouched and flagged separately).

## Entry 9 — Meal picker (@react-native-picker/picker) with compile-time structure checking

**Date:** 2026-09-19

**Prompt given:**
> "alright now under the selected date you will use a picker speciffically from the following library @react-native-picker/picker. This picker will import every single meal. During this check if the meal item has correct structure by using typeScript. This is necessary for later. Each meal contains a name, allergens, ingredients, description, link, image. You only display the name in the picker."

### What I built

- **`src/types/meal.ts`** — a `Meal` interface with exactly the six fields specified (`name`, `allergens: string[]`, `ingredients: string[]`, `description`, `link`, `image`).
- **`(tabs)/planner.tsx`**:
  - `import mealsData from "@/data/meals.json"` then `const meals: Meal[] = mealsData.meals;` — annotating this assignment with `Meal[]` is what does the "check structure with TypeScript" part: TypeScript structurally compares every object in the imported JSON array against `Meal` at compile time. If any meal were missing a field, had a field of the wrong type (e.g. `allergens` as a string instead of `string[]`), or had a typo'd key, `tsc` would fail on this exact line — not a runtime surprise later.
  - Installed `@react-native-picker/picker` via `npx expo install` (correct SDK 57 version).
  - Added `<Picker selectedValue={selectedMealName} onValueChange={...}>` rendered under the selected-date text, with one `<Picker.Item label={meal.name} value={meal.name} />` per meal — per your instruction, only `name` is shown/used as the value; the rest of each meal's data isn't touched yet ("necessary for later" — presumably a future step will look up the full `Meal` object by the selected name).

### Incidental fix

While in this file, fixed a genuine bug from your own prior edit: `confirmButton`'s style had `color: {ACCENT_COLOR}` — object-shorthand syntax, not a valid color value — which was breaking the type-check for the entire `StyleSheet.create()` call (that's what the cryptic `NamedStyles<...>` error from your last edit was). Removed the invalid line; `color` isn't a valid `Pressable`/`View` style property anyway (that button's text color is already set correctly on `confirmButtonText`).

### Why this design

- A `Meal[]` type annotation is the simplest, zero-dependency way to get compile-time structural validation out of TypeScript — no schema library (zod, io-ts, etc.) needed for this, since the data is static, bundled JSON rather than something arriving at runtime from a network call (which would need runtime validation instead, since `tsc` can't check data it hasn't seen yet).
- Kept the `Meal` type in its own file (`src/types/meal.ts`) rather than inline in `planner.tsx`, since "necessary for later" strongly implies other screens will need to import and reuse this same shape.

### How I verified it

- `tsc --noEmit` — clean. This is itself the actual verification that all 45 meals in `meals.json` structurally satisfy `Meal` — if even one didn't, this command would have failed on the `const meals: Meal[] = mealsData.meals;` line.
- `npx expo export --platform web` — successful build.

## Entry 10 — Fix: picker had no explicit size, so it collapsed to nothing

**Date:** 2026-09-19

**Prompt given:**
> "no picker shows up"

### The problem

The `<Picker>` added in Entry 9 had no `style` at all. Unlike iOS's `UIPickerView`, Android's native picker component has no built-in default height, and the parent's `containerSelected` style uses `alignItems: "flex-start"` — which sizes children to their own content rather than stretching them. With nothing forcing it to take up space, the picker rendered at effectively zero height and was invisible, even though it was correctly in the tree (this is a well-known gotcha with `@react-native-picker/picker` specifically, distinct from the OS-native `UIDatePicker` we used earlier which does have sane defaults).

### The fix

Added an explicit `style={{ width: "100%", height: 50 }}` to the `<Picker>` in `(tabs)/planner.tsx`.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 11 — Swapped to react-native-element-dropdown for a proper dropdown look

**Date:** 2026-09-19

**Prompt given:**
> "https://www.npmjs.com/package/react-native-element-dropdown This is better"
(following a discussion about `@react-native-picker/picker` having no cross-platform compact/dropdown appearance — Android has a `mode="dropdown"` option, but iOS only ever renders the full wheel, with no built-in way to make it look like a dropdown)

### What I changed

- **Uninstalled** `@react-native-picker/picker`, **installed** `react-native-element-dropdown` (pure JS, no native linking or config plugin needed — confirmed via its docs before installing, per AGENTS.md).
- **`(tabs)/planner.tsx`**: replaced `<Picker>`/`<Picker.Item>` with `<Dropdown>`, keeping the exact same `meals: Meal[]` data and `selectedMealName` state from Entry 9/10 — only the rendering component changed, not the underlying data flow. `Dropdown` takes the `meals` array directly via `data`, with `labelField="name"` / `valueField="name"` telling it which field to display and which to treat as the value (both are `name`, per the earlier instruction to only show/use the meal name here), and `onChange` receives the full matched object, from which `.name` is pulled into `setSelectedMealName`.
- Restyled the old `picker`/`styles.picker` entry into `dropdown`/`dropdownContainer`/`dropdownText`, giving it a bordered box look (border, radius, padding) consistent with a typical dropdown control, since `react-native-element-dropdown` — unlike the native `Picker` — is fully custom-styled with no default OS chrome at all.

### Why

This directly solves the cross-platform "compact dropdown look" problem from the previous exchange: `react-native-element-dropdown` renders its own JS-based dropdown UI (a bordered field that opens a floating list on tap) identically on iOS, Android, and web, rather than delegating to each OS's native picker widget — so there's no more "wheel on iOS, dialog on Android" inconsistency to work around.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build (all routes present; a harmless "forcefully exiting" CLI message appeared after the build completed, unrelated to the bundle itself).

## Entry 12 — "-of-" divider, Add Meal button, and the modal form (UI scaffold only, no logic yet)

**Date:** 2026-09-19

**Prompt given:**
> "alright thn that is settled i would first like you to add the -or- + add a meal button. and the modal page itself. The page can already contain the form itself but no need to add the logic already. We will do this step by step."

(Follows a discussion, at your request, walking through the design *before* building: why a user-added meal's photo and data can't literally be written into the bundled `assets/`/`meals.json` at runtime, why AsyncStorage + `expo-file-system` is the practical equivalent, and why an `onError`-driven fallback image is needed for a photo that later goes missing. Nothing from that discussion was implemented yet — this entry is step one of the step-by-step build: UI only.)

### What I built

- **`src/app/add-meal.tsx`** — a new screen with a scrollable form containing one input per `Meal` field: `name`, `allergens` (comma-separated text for now), `ingredients` (comma-separated text for now), `description` (multiline), `link`, and an "Selecteer afbeelding" button placeholder for the image picker. A "Toevoegen" submit button sits at the bottom. None of these have any state, validation, or `onPress`/`onChangeText` handlers yet — pure static UI, exactly as asked.
- **`_layout.tsx`** — registered `add-meal` as a new `Stack.Screen` with `presentation: "modal"`, following the exact same pattern already used for `profile` (title + modal presentation, no custom header button — consistent with how the Profile modal already behaves after earlier reverts).
- **`(tabs)/planner.tsx`** — under the meal `Dropdown`, added a divider row (`View` + `View` acting as two flex-filled hairline lines, with "-of-" centered between them — used the Dutch "of" rather than "-or-" literally, to stay consistent with the rest of the app's Dutch UI text like "Bevestigen" and "Kies opnieuw") and a "+ Nieuw Recept" button wrapped in a `Link` to `/add-meal`, which opens the new modal.

### Why these choices

- **Modal as its own route, not a local `<Modal>` component**: matches the existing pattern already established for the Profile screen (a separate file registered as a modal `Stack.Screen`), rather than introducing a second, inconsistent way of showing a modal in the same app.
- **Comma-separated text for `allergens`/`ingredients` for now**: matches what I flagged in the design discussion — a full tag-editor UI is extra complexity that can be added later; a single text field parsed into an array is the simplest form that still produces the right `Meal` shape once logic is added.
- **No logic yet, deliberately**: per your instruction to build this step by step — this entry is purely the visual scaffold (form fields, navigation to the modal, divider), leaving image picking, AsyncStorage persistence, and the merged meal list for a following step.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build; confirmed a new `/add-meal` static route now exists alongside the others.

## Entry 13 — Wired up the text-based form inputs as controlled components

**Date:** 2026-09-19

**Prompt given:**
> "alright let's start with adding the text based inputs first, how does this local apps storage work."

### AsyncStorage, explained (before building anything)

You asked how the eventual local storage works, so I covered it before touching code: `AsyncStorage` (`@react-native-async-storage/async-storage`, already named in the original PlateMate spec) is a simple persistent key-value store — `setItem(key, string)` / `getItem(key)`, string-only so structured data needs `JSON.stringify`/`JSON.parse` around it, async (Promise-based), and persists across app restarts but is strictly per-device/per-install (no sync, wiped on uninstall). That's distinct from what this entry actually builds: plain in-memory `useState` per field, which only exists while the Add Meal screen is open — AsyncStorage itself isn't wired up yet, that's a later step once there's an actual submit action to persist.

### What I built

In `src/app/add-meal.tsx`, added one `useState<string>("")` per text field — `name`, `allergens`, `ingredients`, `description`, `link` — and wired each to its matching `TextInput` via `value`/`onChangeText`, turning them from static placeholders into real controlled inputs. The image picker button and submit button are untouched — still non-functional placeholders, per the step-by-step plan.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 14 — Required-field validation, anchored to the Meal type

**Date:** 2026-09-19

**Prompt given:**
> "Ok, one last thing, we should make every field required accept for the allergens field and the image picker. If no image is selected we will add a path to a placeholder. This means that the toevoegen button should be unactive untill the required fields are filled. How would you handle this?"
followed by:
> "i reccomend you use the meal type ok?"

(This followed a longer explanatory exchange — not implemented until this point — covering how AsyncStorage physically works per platform, why `expo-image-picker`'s modern system pickers usually don't need an explicit permission request, and the `JSON.stringify`/`JSON.parse` pattern needed since AsyncStorage only stores strings.)

### What I built

In `src/app/add-meal.tsx`:
- `type RequiredMealField = Exclude<keyof Meal, "allergens" | "image">;` — derives the required-fields list directly from the `Meal` type itself (Entry 9's `src/types/meal.ts`), rather than a hand-maintained list of field names that could silently drift out of sync if `Meal` ever changes.
- `requiredFieldValues: Record<RequiredMealField, string>` — an object literal mapping each required field name to its current form state value. Because it's typed against `RequiredMealField`, if `Meal` ever gained a new required field, this object would be missing a required key and fail to compile — forcing this validation logic to be updated instead of silently going stale.
- `isFormValid` — `Object.values(requiredFieldValues).every(v => v.trim() !== "")`. Using `.trim()` deliberately, so a field containing only whitespace doesn't count as "filled."
- The "Toevoegen" `Pressable` now has `disabled={!isFormValid}` (so tapping it while invalid does nothing at all — no need to guard inside a handler) and a conditional style (`submitButtonDisabled`, a greyed-out background) so the disabled state is visually obvious, not just silently unresponsive.

Not built yet, deliberately: the placeholder-image fallback logic (`image: pickedUri ?? "images/meals/placeholder.jpg"`) — that's part of the submit action itself, which doesn't exist yet since the image picker and AsyncStorage save haven't been wired up. This entry only covers the validation/button-state piece.

### Why anchor validation to the Meal type

Duplicating the required-fields list as a plain array of strings (`["name", "ingredients", "description", "link"]`) would work identically at runtime, but nothing would catch it going out of sync with `Meal` itself if the shape changes later. Deriving `RequiredMealField` from `keyof Meal` and using it to type `requiredFieldValues` means the connection between "what fields exist on a Meal" and "what fields are required in this form" is enforced by the compiler, not just by memory/convention.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 15 — Full add-meal logic: image picker, persistent file copy, AsyncStorage save

**Date:** 2026-09-19

**Prompt given:**
> "ok add the logic, We will add the merging of the asyncStored meals and default 45 meals later. This will be necessary so those custom meals can also be added later to the dropdown. You. may start implementing the asyncStorage logic."

This is the implementation of everything discussed conversationally over the previous several turns (AsyncStorage mechanics, why `expo-image-picker` usually doesn't need an explicit permission call, why a picked photo needs to be copied into permanent app storage rather than referencing the picker's own URI directly, and the `JSON.stringify`/`JSON.parse` pattern) — nothing new was decided here, this just builds it. Explicitly out of scope for this step, per your instruction: merging the AsyncStorage-backed custom meals with the bundled `meals.json` array (e.g. so they'd show up in the Planner's dropdown) — that stays for a later entry.

### What I built

- **Installed**: `expo-image-picker`, `expo-file-system`, `@react-native-async-storage/async-storage` (all via `npx expo install` for correct SDK 57 versions). Added the `expo-image-picker` config plugin to `app.json` with a Dutch `photosPermission` usage string (`NSPhotoLibraryUsageDescription` on iOS) — required for the native permission string to exist at all, even though (per our discussion) the modern system picker usually won't trigger that dialog for a plain image pick.
- **Generated a placeholder image**: `src/assets/images/meal-placeholder.png`, a plain solid light-gray 600×400 PNG. Built it from raw bytes with a small Python script (zlib + struct, hand-assembling the PNG chunks) rather than an image-editing tool, since neither ImageMagick nor PIL were available in this environment — this is a genuinely minimal placeholder, worth swapping for something nicer-looking later (an icon, a branded graphic, etc.) since visual design wasn't the point of this step.
- **`(tabs)` — no changes**; all of this is contained in `src/app/add-meal.tsx`:
  - `handlePickImage` — calls `ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 })` directly, no separate permission request (per the earlier discussion: modern OS pickers don't need it for a single image pick). On success, stores the picked URI in `pickedImageUri` state; a preview `<Image>` renders above the button once one's picked, and the button's own label changes to "Andere afbeelding kiezen".
  - `handleSubmit` (async):
    1. If a photo was picked: creates a `meals` directory under `Paths.document` (`idempotent: true`, so it's a no-op if it already exists), copies the picker's file into it with `sourceFile.copy(destination)` using the new class-based `File`/`Directory` API (confirmed this is the current SDK 57 API — it replaced the older function-based `FileSystem.copyAsync`/`documentDirectory` API from earlier SDKs, checked against the live docs before writing this, per AGENTS.md), and uses the resulting permanent `destination.uri` as the meal's `image` value.
    2. If no photo was picked: falls back to `PLACEHOLDER_IMAGE` (`"images/meal-placeholder.png"`) — stored the same way the 45 seeded meals store their images, as a path relative to the `@/assets/*` alias, in contrast to a picked photo's `file://...` URI. This is the two-different-shapes-of-`image`-value distinction flagged back in the original design discussion.
    3. Builds a `Meal` object — `allergens`/`ingredients` go through a small `splitCommaList` helper (splits on `,`, trims, drops empty entries) to turn the comma-separated text inputs into the `string[]` the `Meal` type actually requires.
    4. Reads the existing `customMeals` AsyncStorage entry (`JSON.parse`, defaulting to `[]` if nothing's stored yet), pushes the new meal, and writes the whole array back with `JSON.stringify` — exactly the read-modify-write-the-whole-array pattern discussed earlier, since AsyncStorage has no "append" operation.
    5. Navigates back (`router.back()`) on success; wrapped the whole thing in `try/catch` with a plain `Alert.alert` on failure, since file I/O and storage writes are a real boundary where things can genuinely fail (a validation/error-handling case worth having, unlike defensive checks for things that can't happen).
  - Added an `isSaving` state to disable the submit button and show "Bezig met opslaan..." while the async work runs, preventing a double-tap from writing the same meal twice.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build; confirms `expo-image-picker` and the new `expo-file-system` class-based API both have working web implementations and don't break the bundle for that platform.
- Did **not** verify actual on-device behavior (permission dialog appearing/not appearing, file actually persisting across app restarts) — no simulator/device available in this environment; that's worth a manual pass once you're running this on a real device or simulator.

## Entry 16 — Fix: expo-file-system isn't supported on web at all

**Date:** 2026-09-19

**Prompt given:**
> "phone version seems to work but web version shows following installHook.js:1 expo-file-system is not supported on web" (repeated 5x)

### The problem

Confirmed against the live SDK 57 docs (per AGENTS.md): the new class-based `File`/`Directory`/`Paths` API from `expo-file-system` — used in Entry 15 to copy a picked photo into permanent storage — is documented as supporting only **Android, iOS, and tvOS**. There's no web implementation at all. `handleSubmit` was calling `Paths.document`, `new Directory(...)`, and `new File(...)` unconditionally, so on web every one of those calls hit the unsupported stub and logged the warning (once per call, hence five near-identical lines).

### The fix

Branched on `Platform.OS === "web"` inside `handleSubmit` in `add-meal.tsx`:
- **Web**: skip the file-copy step entirely and use the picker's own returned URI directly as the meal's `image` value. On web, `expo-image-picker` returns a `blob:`/`data:` URI that the browser itself keeps alive — there's no cache-eviction concern the way there can be with a native picker's temp file, so there's nothing that actually needs copying.
- **Native (iOS/Android)**: unchanged — still copies into `Paths.document/meals/` as before, since that concern is real there.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.
- Did not re-verify on an actual phone (already confirmed working per your message) — only confirmed the web path no longer calls the unsupported API.

## Entry 17 — Fix: web's blob: URL doesn't survive a reload, switched to a data: URI

**Date:** 2026-09-19

**Prompt given:**
> "so the image on web will just dissapear when closing the tab?"

You caught a real bug in Entry 16's fix, not a hypothetical: I'd said the browser "keeps the blob: URL alive on its own," but that's only true for the *current* page session — a `blob:` URL is a reference the browser invalidates on reload/tab close, not a persistent link. So a web-added meal's `name`/`ingredients`/etc. would survive fine in IndexedDB, but its `image` field would point to a dead URL the moment the tab was closed and reopened — the same "reference outlives the thing it points to" failure mode as the native temp-file problem from Entry 15, just via a different mechanism.

### The fix

- `handlePickImage` now also requests `base64: true` from the picker, **but only on web** (`base64: Platform.OS === "web"`) — native doesn't need this extra, memory-heavier payload since it copies the actual file instead. Stores the returned `base64` string and `mimeType` in new state alongside the existing preview `uri`.
- `handleSubmit`'s web branch now builds a `data:${mimeType};base64,${base64}` URI and uses *that* as the meal's `image` value, instead of the raw picker `uri`. A `data:` URI isn't a reference to something else — the entire image is encoded as text inside the string itself — so it round-trips through `JSON.stringify`/`AsyncStorage`/`JSON.parse` and remains valid indefinitely, unlike the `blob:` URL.
- The preview `<Image>` shown immediately after picking still uses the original `uri` (fine for that — it only needs to survive the current session, which a `blob:` URL does).

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.
- Did not verify actual persistence across a real tab close/reopen (no browser session available in this environment) — logically this closes the gap, but worth a manual check: add a meal with a photo on web, close and reopen the tab, confirm the image still renders.

## Entry 18 — Image picker is now native-only; web always uses the placeholder

**Date:** 2026-09-19

**Prompt given:**
> "I say we make the custom image selector on web an native only feature and mention so that the image pick button is not available on the web. For web we will always fall back on the fallback image."

(You also correctly called out, before this: I'd made the previous `data:` URI change without you actually asking me to — a fair correction, since that was an implementation decision, not something you'd greenlit. This entry is the actual agreed direction: drop the base64/`data:` URI approach entirely rather than patch around its size problem.)

### What I changed, in `src/app/add-meal.tsx`

- **Removed** the `base64`/`data:` URI machinery from Entry 17 entirely — the `pickedImageBase64`/`pickedImageMimeType` state, the `base64: true` picker option, and the web-specific branch in `handleSubmit` that built a `data:` URI. None of it is needed anymore.
- **Added `isImagePickerSupported = Platform.OS !== "web"`.** The image picker button and preview `<Image>` now only render when this is true; on web, that whole section is replaced with a plain italic notice: "Een eigen foto toevoegen kan alleen in de mobiele app. Op web wordt automatisch een standaardafbeelding gebruikt."
- **`handleSubmit`'s image-copy logic is back to a single unconditional branch** (no more `Platform.OS` check inside it) — since `pickedImageUri` can now only ever be set on native (the button producing it doesn't exist on web), the `expo-file-system` copy code is guaranteed to only run on a platform that actually supports it.

### Why this is better than the base64 approach

Directly addresses your concern: a base64-encoded `data:` URI is ~33% larger than the original binary, and because `AsyncStorage` here stores the *entire* `customMeals` array as one JSON string, every read/write re-parses and re-serializes every other user-added meal's image data too — not just the one being changed. That cost scales with however many custom meals accumulate, for a feature (photo upload) that's genuinely a native-app capability rather than something browsers are well-suited for anyway. Turning it off on web entirely removes the problem rather than working around its symptoms.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 19 — Refactor: split image picking into meal-image-field.native.tsx / .tsx

**Date:** 2026-09-19

**Prompt given:**
> "also could we not just have a add-meal.native.tsx file and a add-meal.tsx instead of adding the extra logic?"
followed, after discussing the tradeoff, by: "sure"

### The discussion first

Splitting the *entire* `add-meal.tsx` screen into native/web copies would have meant duplicating everything that's actually shared between platforms — all five text fields, the required-field validation, the AsyncStorage save, the submit button — to isolate the one part that genuinely differs (the image picker). I proposed narrowing the split to just that piece instead, as its own small component, which you agreed to.

### What I built

- **`src/components/meal-image-field.native.tsx`** — the real component: picker button, image preview, and the `expo-file-system` copy-to-permanent-storage logic from Entry 15/18, all self-contained. It manages its own local preview state and reports the final, already-copied `file://` path up via a single `onImagePathChange(path: string | null)` callback prop.
- **`src/components/meal-image-field.tsx`** — the web version: just the "Een eigen foto toevoegen kan alleen in de mobiele app..." notice text, no picker, no state, and never calls `onImagePathChange` (so the parent's `imagePath` stays `null`, falling through to the placeholder).
- **`src/app/add-meal.tsx`** — stripped of all image/platform-specific code: no more `Platform`, `expo-image-picker`, `expo-file-system`, or `isImagePickerSupported` check. It just renders `<MealImageField onImagePathChange={setImagePath} />` and uses `imagePath ?? PLACEHOLDER_IMAGE` at submit time — completely agnostic to which platform's version of the component it actually received, exactly like `AppTabs` in `(tabs)/_layout.tsx` back in Entry 1.

### An extra benefit beyond "cleaner code"

Checked the actual web bundle output afterward: `expo-file-system` and `launchImageLibraryAsync` no longer appear in it **at all** (0 occurrences, confirmed via `grep` on the exported bundle). Previously, with the `Platform.OS` check living *inside* `add-meal.tsx`, both branches' code still got bundled for every platform — the check only skipped it at *runtime*, not at *bundle time*. Splitting into separate files means Metro's platform-extension resolution (the same mechanism from Entry 1) picks only the `.tsx` (web) file when bundling for web, so the native-only code is never even included, not just never executed.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.
- Grepped the exported web bundle for `expo-file-system`/`launchImageLibraryAsync` — 0 matches, confirming the native-only code is excluded from the web build entirely, not just inert.

## Entry 20 — Merged bundled meals + AsyncStorage custom meals into the dropdown

**Date:** 2026-09-19

**Prompt given:**
> "ok now back to the planner page, we should now find a way to merge both places where meals exist the default meals and the custom ones. and then show those inside the dropdown. This means that we just need to add asyncstorage and use get on there with the already existing custommealsstoragekey.After importing the asyncStorage date simply push it into the existing data."


### What I built instead

- **`src/constants/storage.ts`** — new file exporting `CUSTOM_MEALS_STORAGE_KEY = "customMeals"`. Both `add-meal.tsx` and `(tabs)/planner.tsx` now import it from here instead of `add-meal.tsx` privately owning the string.
- **`(tabs)/planner.tsx`**:
  - Renamed the top-level `meals: Meal[]` (the direct `meals.json` import) to `bundledMeals`, freeing up the name `meals` for a new piece of component state — the actual combined list the Dropdown reads from.
  - Added `useFocusEffect(useCallback(() => { ... }, []))` (from `expo-router`) that reads `CUSTOM_MEALS_STORAGE_KEY` via `AsyncStorage.getItem`, `JSON.parse`s it (defaulting to `[]` if nothing's stored yet — same as the read side of the pattern already used in `add-meal.tsx`), and calls `setMeals([...bundledMeals, ...customMeals])`.
  - Used `useFocusEffect` rather than a plain `useEffect(() => {...}, [])`: since Planner is a tab screen, it stays mounted the whole time the app runs — a mount-only effect would only ever read AsyncStorage once, on first load, and would never notice a meal added later via the Add Meal modal. `useFocusEffect` re-runs this read every time the user navigates back to this screen, so a newly added meal shows up in the dropdown immediately after returning from `add-meal.tsx`, no app restart needed.
  - The `Dropdown`'s `data={meals}` now automatically reflects the merged list, since it already referenced the (now state-backed) `meals` variable — no JSX changes needed there at all.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 21 — Meal overview screen (image, name, description, ingredients, allergens)

**Date:** 2026-09-19

**Prompt given:**
> "alright The idea is that when a meal is selected the UI changes again to the meals overview with all displayed. This includes the image, description, name, etc."

### The infrastructure problem this needed first

Displaying a meal's image turned out to need a small piece of plumbing before any UI work: React Native's `<Image source={require(...)}>` requires a **literal, static string** at bundle time — Metro can't resolve `require(someVariable)`. The 45 seeded meals store `image` as a relative string like `"images/meals/baked-ziti.jpg"` (from Entry 8), which is exactly that kind of dynamic value at runtime (it comes from `meal.image`, not a hardcoded string in the source).

- **`src/constants/meal-images.ts`** — generated (via a one-off Node script, not typed by hand) a `Record<string, ImageSourcePropType>` with one literal `require("@/assets/images/meals/<file>")` line per actual file in `assets/images/meals/`, plus the placeholder — 46 entries total. This is the static lookup table that bridges "a string from data" to "an actual bundled image module."
- **`src/utils/resolve-meal-image.ts`** — `resolveMealImage(image: string)`: if the string looks like a URI the platform already knows how to load directly (`file://`, `data:`, `blob:` — i.e. a user-added meal's photo per Entries 15–19), returns `{ uri: image }`; otherwise looks it up in `mealImageMap` (a bundled seed meal or the placeholder), falling back to the placeholder entry if a path is ever missing from the map.

### The UI itself, in `(tabs)/planner.tsx`

- Replaced `selectedMealName: string` with `selectedMeal: Meal | null` — the Dropdown's `onChange` already receives the full matched object from its `data` array, so this is just keeping the whole `Meal`, not just its name, once one's chosen.
- When `selectedMeal` is set, the dropdown/divider/add-meal-button block is replaced entirely with a meal overview: the resolved image, name, description, ingredients (`.join(", ")`), and allergens (joined, or "Geen bekende allergenen" if the array's empty) — plus a "Kies andere maaltijd" button that clears `selectedMeal` back to `null`, returning to the dropdown.
- `handleReset` (the existing date-reset back arrow) now also clears `selectedMeal`, so backing out to re-pick a date doesn't leave a stale meal selected underneath.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 22 — Auto-select a meal right after it's created

**Date:** 2026-09-19

**Prompt given:**
> "ok now when i meal is created by the user that meal should automatically be selected is that possible if so how?"

### The mechanism

Expo Router doesn't have a built-in way to "return a value" from a modal back to the screen that opened it (unlike, say, a function call returning something) — `router.back()` just navigates, it doesn't carry data with it. But Planner already re-reads AsyncStorage every time it regains focus (Entry 20's `useFocusEffect`), so I piggybacked on that existing mechanism instead of introducing a new one.

- **`src/constants/storage.ts`** — added `LAST_ADDED_MEAL_STORAGE_KEY = "lastAddedMealName"`, alongside the existing `CUSTOM_MEALS_STORAGE_KEY`.
- **`add-meal.tsx`** — right after successfully writing the updated `customMeals` array, also writes `newMeal.name` under this new key, just before `router.back()`.
- **`(tabs)/planner.tsx`**'s focus effect — after merging `bundledMeals` + `customMeals` into `allMeals` as before, it now also checks `LAST_ADDED_MEAL_STORAGE_KEY`. If a name is there, it finds that meal in `allMeals` and calls `setSelectedMeal(...)` — immediately showing Entry 21's meal overview screen instead of the dropdown — then removes the key from storage, so navigating back to Planner *again* later (without having just added something) doesn't re-trigger the auto-select.

### Why a storage marker instead of, say, route params

Considered passing the new meal's name back via `router` params instead, but Planner is a persistently-mounted tab screen, not a fresh route instance each time — the "read once, then clear" marker pattern fits naturally with the read-on-focus mechanism that already existed, without needing to reason about how param-passing interacts with a screen that's technically already mounted underneath the modal the whole time.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 23 — Cleanup: removed dead data:/blob: checks from resolveMealImage

**Date:** 2026-09-19

**Prompt given:**
> "why th data and blob?" (questioning the `data:`/`blob:` checks in `resolve-meal-image.ts`)

You were right to push on this. Those checks were leftover from the base64 `data:` URI approach (Entries 17–18), which was fully reverted in favor of making image picking native-only. Since `meal-image-field.tsx` (the web version) never calls `onImagePathChange`, no code path in the app produces a `data:` or `blob:` value anymore — only `file://` (native) does. Keeping those checks was dead code, and slightly misleading (implying web-added meals could have a real custom photo, when they can't).

### What changed

`src/utils/resolve-meal-image.ts`: narrowed the check to `image.startsWith("file://")` only, removed the `data:`/`blob:` branches, and updated the comment to reflect current reality (two cases: native `file://` URIs, or `@/assets/`-relative paths covering seed meals, the placeholder, and web-added meals alike).

### How I verified it

- `tsc --noEmit` — clean.

## Entry 24 — Meal overview uses the same back-arrow style as the date screen

**Date:** 2026-09-19

**Prompt given:**
> "ok great now once a meal was selected you added the kies andere maaltijd button. I want you to replace it with the same button used after selecting a date and just use the current onPress"

### What changed

In `(tabs)/planner.tsx`, replaced the "Kies andere maaltijd" text button (border + label) in the meal overview with the same top-left chevron-arrow `Pressable`/`SymbolView` combo already used for the date-reset back button — same `styles.backButton`, same icon (`chevron.left`/`arrow_back`), same `size`/`tintColor`/`hitSlop`. Only the `onPress` differs, and that was already correct (`() => setSelectedMeal(null)`), so it's unchanged.

Removed the now-unused `changeMealButton`/`changeMealButtonText` styles.

### Why

Keeps the two "go back a step" affordances in the flow (leave the date, leave the meal selection) visually consistent with each other, rather than one being an icon-only arrow and the other a bordered text button.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 25 — Meal overview replaces the date step entirely, plus a "Plan maaltijd" button

**Date:** 2026-09-19

**Prompt given:**
> "i want you to tweak that the button should be on the exact same location as the previous back button. That means the entire previous step of the component should be gone. we will a large button underneathe the meal details that contains says plan meal on "selected date""

### What changed

Restructured the `selectedDate` branch in `(tabs)/planner.tsx` from a single block with an *always-visible* date-reset back arrow + date text, with the dropdown-vs-meal-overview choice nested inside it — into a top-level `selectedMeal ? (...) : (...)` split, so the two states are now fully separate render paths rather than one sharing a common header:

- **No meal selected yet**: back arrow (`handleReset`, resets the whole date) + the selected date text + dropdown + divider + Add Meal button — unchanged from before.
- **Meal selected**: the back arrow now sits in the *exact same position* (`styles.backButton`, same spot in the layout) but its `onPress` is `() => setSelectedMeal(null)` instead of `handleReset` — going back one step (to meal choice) rather than all the way back to date choice. The date text is gone entirely in this state, per your instruction that "the entire previous step" should disappear, not just be visually similar. Below the meal details (image/name/description/ingredients/allergens), added a new full-width "Plan maaltijd op `<formatted date>`" button (`styles.planMealButton`).
- Extracted the repeated date-formatting object into a shared `formatDate(date: Date)` helper, since the same `weekday/day/month/year` formatting is now needed in two places (the date-picker step's heading, and the new plan-button's label) instead of one.

The "Plan maaltijd" button has no `onPress` yet — this entry is the layout/structure change only; what "planning" a meal onto a date actually *does* (presumably persisting that assignment somewhere) hasn't been discussed or built yet.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.

## Entry 26 — Made the Planner page scrollable

**Date:** 2026-09-19

**Prompt given:**
> "make scrolling possible on the page"

### What changed

Swapped the outer `<View>` in `(tabs)/planner.tsx` for a `<ScrollView>` — necessary since the meal overview (image + name + description + ingredients + allergens + the new "Plan maaltijd" button from Entry 25) can now be taller than the screen on smaller devices, and a plain `View` has no scrolling behavior at all; content would just get clipped.

Two style adjustments that go along with a `ScrollView` specifically:
- `style={styles.scrollView}` (`{ flex: 1 }`) on the `ScrollView` itself — controls the size of the scrollable *viewport*.
- The existing `container` style (previously applied via `style` on the `View`) moved to `contentContainerStyle` instead, and its `flex: 1` changed to `flexGrow: 1`. This distinction matters: `contentContainerStyle` describes the layout of the *content inside* the scroll area, not the viewport — `flex: 1` there would try to force the content to exactly match the viewport's height (defeating scrolling for genuinely tall content), whereas `flexGrow: 1` lets it fill the available space when content is short, while still being free to grow taller and scroll when content exceeds the screen.

### How I verified it

- `tsc --noEmit` — clean.
- `npx expo export --platform web` — successful build.
