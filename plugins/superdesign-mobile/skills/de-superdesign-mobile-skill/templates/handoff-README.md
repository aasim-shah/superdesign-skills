# {App} screens: handoff to React Native

<!-- Copy to .superdesign/handoff/README.md in the handoff phase and fill it from component-inventory.md (same
folder), theme/tokens.ts, config.json, design-system.md, CONTENT.md and the track reports. Internal document:
plain words. Never name the agency inside client deliverables. -->

Built {date}. {N} screen drafts ({light} light, {dark} dark twins, 1 design-system board) on {Superdesign project URL}.
Tap-through starts at {preview URL of 01 · Home}. Target: {Expo SDK n, expo-router}.

**Next step:** add `handoff/theme/tokens.ts` to the app, wire a `useTheme()` that picks `colors.light` or
`colors.dark` from `useColorScheme()`, then build screens in the route order below, one component per block.
The drafts are the review surface; the app code is written fresh in React Native.

## Sources of truth

| What | Where | Becomes |
|---|---|---|
| Tokens | `src/tokens.json` | `theme/tokens.ts` (tokens_export.py; never edit by hand) |
| Contrast pairs | `src/contrast-pairs.json` (both themes) | the design QA list |
| Design spec | `design-system.md` | component rules |
| Strings and facts | `src/CONTENT.md` | the strings file, a to-confirm list |
| Screens | `src/pages/*.html`, built in `tmp/` | routes and components |
| Assets | `src/asset-map.json`, `research/up/`, `research/brand/` | bundled images |

## Screen to route

| Screen | Draft (light / dark) | Kind | Route | Presentation | Notes |
|---|---|---|---|---|---|
| 01-home | {url} / {url} | scroll | `app/(tabs)/index.tsx` | tab root | |
| 02-detail | {url} | fixed | `app/item/[id].tsx` | push | |
| 06-home-sheet | {url} | fixed | `app/new.tsx` | formSheet | the sheet state of 01 |

## Components

{Paste the Components table from component-inventory.md, then confirm or correct each:}

| Block | Component | Screens | Props | List data | States | Notes |
|---|---|---|---|---|---|---|
| `item-list` | `ItemList` | 01 | heading, items[{title, subtitle, icon, enabled}] | FlatList | empty (05) | rows push to 02 |

Merge decisions: {list}.

## Element mapping used

{Keep the table from references/handoff-contract.md section 2, with any project-specific choices (segmented control
package, bottom sheet library, toast library).}

## Interactions

| Hook | Screens | React Native |
|---|---|---|
| `role="switch"` | {screens} | `Switch` |
| `data-segment` | {screens} | {segmented control} |
| `data-sheet-open` | {screens} | {formSheet route / bottom sheet} |
| `data-toast` | {screens} | {toast + announcement} |

## Motion

| Moment | Draft | App |
|---|---|---|
| Push / back | 320ms slide | native stack default |
| Sheet | 320ms rise | formSheet detents |
| Press | 0.97 scale, 150ms | Pressable + Reanimated |
| Haptics | not drawn | {success on save, warning on delete} |

## Icons

| Draft (Phosphor) | iOS (SF Symbol) | Android (Material) | Screens |
|---|---|---|---|
| `ph:house-fill` | `house.fill` | `home` | tab bar |

## Simulated in the drafts (the app must build these for real)

{Permissions, notifications, purchases, camera or NFC, background work: what each screen shows and what the native
code must do.}

## Placeholders and open questions

{Count of data-placeholder elements and PLACEHOLDER strings; the open questions from PLAN.md.}

## Personal data

{Names, photos, contact details in the drafts and research folder, and consent status. "None" is valid.}

## Known gaps and trade-offs

{Screens not drawn, Android differences not drawn, contrast decisions with sign-off (an off switch track), anything
left out at the client's request.}
