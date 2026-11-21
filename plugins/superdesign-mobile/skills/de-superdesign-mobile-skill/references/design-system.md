# Design system: spec, tokens, contrast, board

Phase 4, and phase 12 for the board. One source of truth: the written spec (`.superdesign/design-system.md`) and the token file (`src/tokens.json`) it mirrors. The drafts read the tokens through `{{tokens}}`; the app reads them through `tokens_export.py`. Tools: `scripts/contrast.py`, `scripts/tokens_export.py`. Templates: `templates/design-system.md`, `templates/tokens.example.json`, `templates/contrast-pairs.example.txt`.

## Contents

1. The spec: nine sections
2. tokens.json
3. Platform conventions
4. Contrast, every pair, both themes
5. House rules
6. The 00 design-system board

## 1. The spec: nine sections

Tracks read it first, so write it before any screen.

| # | Section | Contents |
|---|---|---|
| 1 | Product context | Who, what the app does, the business model (free, trial, subscription) without inventing terms; flows; the navigation map (tabs, stacks, modals) |
| 2 | Color | Primitives, then semantic tokens per theme (bg, surface, surface-2, fg, fg-muted, line, accent, on-accent, success, danger, scrim) with use and contrast in light and dark |
| 3 | Typography | Fonts (bundled in the app), the role table in points (size, line height, weight, tracking), which platform style each maps to, numbers (tabular) |
| 4 | Space, grid, shape | 4pt grid, 16pt screen margins, list insets, radius scale, shadows (light) and surface steps (dark), safe areas |
| 5 | Brand devices | 3 to 6 devices that make the app recognizable (a shape, an illustration style, a signature control, a motion), each with its static state |
| 6 | Components | Nav bar, tab bar, cells and groups, buttons, switches, segmented controls, chips, fields, cards, sheets, alerts, toasts, empty states: sizes and states |
| 7 | Motion | Transitions (push, back, tab, modal), sheet, press, success, haptics notes; durations and the Reanimated mapping (references/motion.md) |
| 8 | Accessibility and content | 44pt targets (48dp), text that scales, labels for icon buttons, contrast in both themes, Reduce Motion, voice, string length, PLACEHOLDER rule |
| 9 | Authoring and handoff contract | The draft contract plus the React Native contract (references/handoff-contract.md) |

Decisions in the spec answer audit findings: the plan's "Visual design and type" table has a decision column that points here.

## 2. tokens.json

| Key | Holds | Drafts get | App gets (tokens_export.py) |
|---|---|---|---|
| `fonts` | `href` (Google Fonts for the drafts), families per role (`sans`, `display`) | `font-sans`, `font-display` | `fonts.sans`: the family to load with expo-font |
| `colors` | Primitives by hue and step | `bg-ink-900` ... | `palette['ink-900']` |
| `semantic` | `light` and `dark` maps: name to primitive, `name/NN` or hex | `bg-surface`, `text-fg`, `text-fg-muted`, `bg-accent text-on-accent` (custom properties; `html.dark` swaps them) | `colors.light.fgMuted` ... |
| `type` | Roles in points: `size`, `lh`, `weight`, `track`, `font`, `tabular` | `.t-large-title`, `.t-body` ... in rem, so a large-text render grows them | `type.largeTitle` TextStyles |
| `radius` | Points | `rounded-md`, `rounded-sheet`, `rounded-pill` | `radius.sheet` |
| `space` | The 4pt scale | (Tailwind's own 4px scale) | `space[4]` |
| `shadow` | `y`, `blur`, `color`, `opacity` | `shadow-card`, `shadow-sheet` | iOS shadow props + Android elevation |

Screens use semantic tokens almost everywhere: a screen built from `bg-surface text-fg` works in dark mode with no extra work. Primitives appear only for brand devices. `build.py` warns on arbitrary hex classes. Change a token in the spec and `tokens.json` in the same edit, rebuild, and re-run `contrast.py` and `tokens_export.py`.

## 3. Platform conventions

| Topic | iOS (default chrome) | Android |
|---|---|---|
| Tap target | 44 x 44pt | 48 x 48dp |
| Type | Large title 34, title 28/22/20, headline 17 semibold, body 17, footnote 13, caption 12 | Display, headline, title, body 16, label 14 (Material 3) |
| Navigation | Large title on tab roots, inline title with a back label on pushed screens, tab bar at the bottom | Top app bar, bottom navigation bar, back gesture and button |
| Controls | Switch 51 x 31 (hit area 44), segmented control, action sheets, swipe actions | Switch with thumb icon, chips, menus, snackbars |
| Sheets | Detents (medium, large) with a grabber | Bottom sheets with a drag handle |

When the app ships on both, design iOS first and record the Android differences in section 6; draw Android drafts only for screens that differ (a separate `device` config and partials).

## 4. Contrast, every pair, both themes

List every text and background pair the screens use, with semantic names where possible:

```bash
python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt --json-out ../src/contrast-pairs.json
```

A pair that names a semantic token is checked in light and in dark (`--theme light` or `dark` narrows it); a pair of primitives is checked once.

| Use | Minimum | Typical pairs |
|---|---|---|
| `text` | 4.5:1 | fg and fg-muted on bg, surface, surface-2; accent as text; on-accent on accent |
| `large` | 3:1 | large titles and big numbers in a brand color |
| `ui` | 3:1 | idle tab icons, input borders, a switch's off track if it is the only cue |
| `decorative` | none | dividers, recorded so the list is complete |

The accent usually needs two steps: a dark step in light mode and a light step in dark mode, with `on-accent` flipping from white to near-black.

## 5. House rules

| Rule | Why |
|---|---|
| One accent fill means "do this"; secondary actions are tinted or plain | One obvious next step per screen |
| No eyebrows or kickers by default (iOS grouped-list headers are a platform convention, not an eyebrow) | House rule |
| Sentence case everywhere, including buttons and tabs | House style, and it matches both platforms |
| Never name the agency in the app | `forbidden` includes the agency name |

These are house rules, not platform or WCAG requirements.

## 6. The 00 design-system board

`pages/00-design-system.html`, 1440 wide (`frame_widths`), title `00 · Design system`, a `scroll` screen listed in `reference_pages` (no handoff checks, not in the inventory). `{{board:colors}}` draws every semantic token in light and dark plus every primitive; `{{board:type}}` draws every type role with its points; both come from tokens.json, so the board cannot drift. Add each brand device in its resting state and every component with its states, side by side in light and dark (`class="dark"` on a container switches its tokens).
