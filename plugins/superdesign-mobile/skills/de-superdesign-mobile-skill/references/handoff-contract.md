# The handoff contract: screens that become a React Native app

What makes app screen drafts ready for an Expo (expo-router) build. Checked by `build.py` (warnings, or errors with `"contract": "error"`) and read by `block_inventory.py` and `tokens_export.py`. The drafts are HTML; the app is native. The contract keeps the translation mechanical: every draft element has one obvious React Native counterpart.

## Contents

1. The contract at a glance
2. Element mapping
3. Components: data-block and its rules
4. Tokens
5. Accessibility mapping
6. Icons and strings
7. The handoff step
8. What the drafts cannot prove

## 1. The contract at a glance

| Draft artifact | Rule | Becomes |
|---|---|---|
| Root `div.screen[data-screen]` | One per draft; `fixed` or `scroll` | A screen component; `scroll` content in a ScrollView or FlatList, `fixed` in a View that fits |
| `config.json` `routes` | Page to expo-router file | The `app/` tree (`app/(tabs)/index.tsx`, `app/item/[id].tsx`) |
| Each child of `<main>` | `<section data-block="kebab-name" aria-labelledby>` | One component with typed props |
| Repeated items | Real repeated markup, `data-repeater="field"` on the list | FlatList `data` (or a map for short lists) |
| Chrome partials | Only in partials | Stack and Tabs options, safe-area insets, expo-status-bar |
| `tokens.json` | The only token source; semantic per theme | `theme/tokens.ts` (tokens_export.py) |
| Control state | ARIA attributes; behavior through `data-*` hooks | Props and component state |
| Text | Only inside text elements | `<Text style={type.body}>` |
| `CONTENT.md` + `data-placeholder` | Real strings and facts; invented ones marked | The strings file (i18n keys), a to-confirm list |
| Dark twins | Same source, `html.dark` | `useColorScheme()` choosing `colors.light` or `colors.dark` |

## 2. Element mapping

| Draft | React Native |
|---|---|
| `div`, `section`, `ul`, `li` (layout) | `View` (flex column by default, like the drafts' Tailwind flex usage) |
| `p`, `span`, `h1` to `h3`, `label` with a `.t-*` role | `Text` with `style={type.<role>}` and a semantic color |
| `a` to another screen | `Link` (expo-router) or `router.push` in a `Pressable` |
| `button` | `Pressable` (or the native control below) |
| `button.switch[role=switch]` | `Switch` |
| `.segment` | a segmented control (`@react-native-segmented-control/segmented-control` or `@expo/ui` where available) |
| `input.field` | `TextInput` |
| `.sheet-wrap[data-sheet]` | a `formSheet` route or a bottom sheet component |
| `.group` + `.cell` | a grouped list: `View` with `borderRadius`, rows as `Pressable`, hairline separators |
| `img` | `expo-image` `Image` |
| `iconify-icon` | `expo-symbols` (SF Symbols) on iOS, Material icons on Android, or one cross-platform set |
| `.topbar`, `.navbar` | `Stack.Screen` options (`headerLargeTitle`, `title`, `headerBackTitle`, `headerRight`) |
| `.tabbar` | `Tabs` in `app/(tabs)/_layout.tsx` |
| `.statusbar`, `.homebar` | not built: `expo-status-bar` and `useSafeAreaInsets()` |

## 3. Components: data-block and its rules

- One section, one component, one responsibility. A section that does two jobs is two components.
- Same name on two screens means the same component and props; layout differences are `data-variant`, a `variant` prop.
- Name the content and its job in kebab-case: `screen-header`, `summary-card`, `item-list`, `settings-group`, `empty-state`, `permission-prompt`, `paywall-plans`. The component is the PascalCase of the name.
- The H1 is the screen title (the navbar title or the large title). Section headings H2, item titles H3: they become accessibility headings.
- Facts and strings come from CONTENT.md; never retype a number that differs per screen.

## 4. Tokens

```bash
python3 tokens_export.py ../src/tokens.json --out ../handoff/theme/tokens.ts
```

Writes `palette`, `colors.light` and `colors.dark` (semantic, resolved to hex or rgba), `fonts`, `type` (TextStyles in points: the same numbers the drafts use), `radius`, `space` and `shadow` (iOS shadow props plus an Android elevation approximation to check on a device). Re-run it after every token change; never edit the output by hand. Type in React Native scales with the user's text size by default; the drafts' rem roles and the `TEXT_SCALE` render preview that.

## 5. Accessibility mapping

| Draft | React Native |
|---|---|
| `aria-label` | `accessibilityLabel` |
| `role="switch"` + `aria-checked` | `accessibilityRole="switch"`, `accessibilityState={{ checked }}` (the native Switch does it) |
| `aria-pressed` | `accessibilityState={{ selected }}` |
| `aria-current="page"` on a tab | handled by Tabs |
| `h1` to `h3` | `accessibilityRole="header"` |
| `role="dialog" aria-modal` on a sheet | the modal route (focus is contained by the platform) |
| `role="status"` toast | `AccessibilityInfo.announceForAccessibility` |
| `alt` | `accessibilityLabel` on the image; decorative images `accessible={false}` |
| 44pt hit areas | `hitSlop` or a 44pt `Pressable` around a smaller drawing |

## 6. Icons and strings

- List every icon the screens use, then give each its SF Symbol and Material name in the handoff README: `grep -oh 'icon="ph:[a-z-]*' ../tmp/*.html | sort | uniq -c`.
- Strings: every visible string comes from CONTENT.md; the handoff lists them as keys for the app's strings file, with the longest translation noted where layouts are tight.

## 7. The handoff step

```bash
cd .superdesign/src && python3 ../tools/build.py all --quiet
cd ../tools
python3 block_inventory.py ../tmp --src ../src --out ../handoff/component-inventory.md
python3 block_inventory.py ../tmp --src ../src --format json --out ../handoff/component-inventory.json
python3 tokens_export.py ../src/tokens.json --out ../handoff/theme/tokens.ts
python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt --json-out ../src/contrast-pairs.json
```

Then fill `handoff/README.md` from `templates/handoff-README.md`. The inventory reports: screen to route (with fixed or scroll), components with guessed props, merge candidates, sections by screen, chrome partials and what they become, hooks, forms and placeholders. Dark twins and the board are not listed.

## 8. What the drafts cannot prove

The canvas shows the design and the flow. It cannot show permission dialogs, notifications, background behavior, camera or NFC, purchases, haptics, real performance or the user's text size beyond the simulation. List each feature that depends on them under "Known gaps" with what the app must do, and never draw a simulated success as if the native part were done.
