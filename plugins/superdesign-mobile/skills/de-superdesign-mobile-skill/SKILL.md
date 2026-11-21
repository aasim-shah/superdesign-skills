---
name: de-superdesign-mobile-skill
description: Use when a phone app's screens (iOS or Android) are to be designed or redesigned on a Superdesign canvas without spending Superdesign credits, when the screens must hand off to React Native or Expo, or when someone says "design the app screens in Superdesign", "mobile UI drafts", "390 screens", "dark mode screens", "make the app prototype clickable", "import the screens" or "hand the screens over to the Expo app".
---

# DEK Superdesign app screens, mobile edition

Claude writes every app screen as HTML from shared partials and one token file, renders and checks it in a phone viewport, and imports it to a Superdesign canvas as a 390-wide draft: exactly one device tall for a fixed screen, the full scroll length for a scrolling one. Superdesign is the canvas and review surface only. The handoff is a React Native / Expo package: `theme/tokens.ts` generated from the same tokens, a screen to expo-router route map, a component inventory with props, and the interaction states each control carries.

This is the phone-app version of `de-superdesign-skill` (website drafts, WordPress handoff). Same canvas discipline, same no-credit rule, same people and placeholder rules; the screen model, the checks and the handoff are native. Its web sibling is `de-superdesign-react-skill`.

`prefix` in `config.json` names the root (`{{prefix}}-root`); templates use the tag, so no find-and-replace is needed.

## Start here

- New app or redesign: phase 0, then the phases in order. Read `references/gotchas.md` before the first screen and again before the first import.
- Joining one in progress: read `PLAN.md`, `.superdesign/design-system.md`, `src/TRACKS.md` and `src/drafts.json`, then run `python3 import_drafts.py status`.
- `SKILL` below means the folder holding this file: the "Base directory for this skill" shown when the skill loads (for example `.claude/skills/de-superdesign-mobile-skill` for a copied skill, or a folder under `~/.claude/plugins/` for a plugin install). Never assume another path.
- References, read when the phase comes:
  - `references/audit-and-plan.md`: intake, the app audit (source, device screenshots, store listing), flows, the screen list with states, PLAN.md.
  - `references/brand-assets.md`: app icon, logo, illustration and photo keys, upload.
  - `references/design-system.md`: the nine-section spec, `tokens.json` (semantic light and dark), contrast per theme, the board.
  - `references/screen-pipeline.md`: folder layout, screens, partials with parameters, fixed and scroll screens, dark twins, both contracts, the anchor screen.
  - `references/parallel-tracks.md`: splitting by flow, TRACKS.md, file ownership, reports.
  - `references/qa.md`: every check, tap targets, large text, both themes, bad loads.
  - `references/canvas-import.md`: 390 frames, fixed and scroll heights, retries, updates, superseding.
  - `references/prototype-layer.md`: links, tab bar, back, sheets, switches, segments, chips, toasts.
  - `references/motion.md`: static thumbnails, navigation transitions, sheets, press feedback, the Reanimated mapping.
  - `references/handoff-contract.md`: HTML to React Native mapping, tokens export, routes, the inventory.
  - `references/gotchas.md`: lessons that cost time, as a table.
  - `references/creative-direction.md`: what the client approves first, the screen recipe, the self-review before showing a screen. Read before phases 4 and 6.

## Defaults (unless the user says otherwise)

1. **No credits.** Never `create-design-draft`, `iterate-design-draft`, `execute-flow-pages` or image or video generation. Claude writes the HTML; `import-design-draft` places it. The tools refuse the credit commands.
2. **Device frames.** Every screen is `device.width` wide (390). A `fixed` screen is exactly `device.height` (844) tall; a `scroll` screen is the full scroll length, measured still, at most 10,000px. Never `--device`, never a tall viewport for measuring. Frames cannot be resized, renamed or deleted from the CLI.
3. **States are screens.** Empty, loading, error, offline, permission, first run, sheets and alerts each get a draft when the flow needs them; dark mode is a twin draft (`<page>--dark`), not an afterthought.
4. **At most five agents at once**, short chat replies, findings in PLAN.md rather than chat. Save the user's caps and preferences to memory.
5. **One writer per file.** Tracks write only their own `src/pages/NN-*.html`; the main session owns partials, tokens, config, links and every import.
6. **Native rules.** Tap targets 44 x 44pt on iOS (48dp on Android); text in text elements only (React Native renders text only inside `<Text>`); type in points from the token roles, so large text scales; the safe areas are respected (status bar, home indicator); one primary action per screen.
7. **Brand rules.** One accent color for the main action with label contrast 4.5:1 or better in both themes. No eyebrows unless the client asks (house rule). US or UK English per the client, sentence case, no em or en dashes.
8. **Never mention the agency** (DEK) in screens or deliverables; its name is in `forbidden`.
9. **Personal data and placeholders.** Flag real names, photos and contact details as you meet them; invented copy and numbers get `data-placeholder` and a line in PLAN.md; never invent prices, trial terms or policy claims.
10. **PLAN.md locally**; a Claude Doc only when the user asks. **Never merge pull requests**; humans merge. **Never change the app's code** in this skill: it designs and hands off.
11. **Pass the authoring model** to imports (`--model <id>` or `DD_SD_MODEL`): it is recorded as `--generated-by`.
12. **Screens first, boards later.** The first thing the client approves is two or three real screens of the main flow with real copy, sent as live preview links; the `00` board follows from the approved screens (`references/creative-direction.md`).

## Phases

| # | Phase | Deliverable | Read |
|---|---|---|---|
| 0 | Intake and setup | Constraints, platform, `.superdesign/` folder, tools installed | `references/audit-and-plan.md` |
| 1 | App audit | Device screenshots, route and component map, store listing notes | `references/audit-and-plan.md` |
| 2 | Plan | PLAN.md: audit tables, flows, screen list with states, open questions | `templates/PLAN.md` |
| 3 | Brand assets | App icon, logo, illustrations uploaded, `asset-map.json`, `brand_urls` | `references/brand-assets.md` |
| 4 | Design system | `design-system.md`, `tokens.json`, `contrast-pairs.json` (both themes) | `references/design-system.md` |
| 5 | Screen pipeline | Partials, config, links, titles, `build.py` passing | `references/screen-pipeline.md` |
| 6 | Anchor screen | The main tab's root screen, light and dark, by the main session | `references/screen-pipeline.md` |
| 7 | Parallel tracks | Every screen and state, from `TRACKS.md` and short prompts | `references/parallel-tracks.md` |
| 8 | QA | Still renders, tap targets, large text, both themes, heights, contrast | `references/qa.md` |
| 9 | Canvas import | 390 drafts, `drafts.json`, `heights.json` | `references/canvas-import.md` |
| 10 | Prototype layer | Linked screens, tab bar, back, sheets and controls working | `references/prototype-layer.md` |
| 11 | Motion | Transitions on tap, sheets, press feedback, reduced motion | `references/motion.md` |
| 12 | Board | `00 · Design system` at 1440, generated from tokens | `references/design-system.md` |
| 13 | Handoff | `handoff/README.md`, `theme/tokens.ts`, component inventory, PLAN.md final | `references/handoff-contract.md` |

### 0. Intake and setup

Find what exists (memory, PLAN.md, `.superdesign/`, the app's source, the Superdesign project). Confirm own model only, the agent cap, the deadline, the platforms (iOS, Android, both) and the app stack (Expo Router is the default handoff). Then:

```bash
SKILL="<base directory of this skill>"   # the folder holding this SKILL.md, e.g. .claude/skills/de-superdesign-mobile-skill
mkdir -p .superdesign/{research,src/pages,src/partials,tmp,tools,handoff}
cp "$SKILL"/scripts/* .superdesign/tools/
cp "$SKILL"/templates/partials/* .superdesign/src/partials/
cp "$SKILL"/templates/tokens.example.json .superdesign/src/tokens.json
cp "$SKILL"/templates/config.example.json .superdesign/src/config.json
cp "$SKILL"/templates/links.example.json .superdesign/src/links.json
cp "$SKILL"/templates/titles.example.json .superdesign/src/titles.json
cp "$SKILL"/templates/CONTENT.md .superdesign/src/CONTENT.md
cp "$SKILL"/templates/pages/* .superdesign/src/pages/          # the board, a tab root and a pushed screen to start from
cd .superdesign/tools && npm install     # Playwright 1.64.1; uses system Chrome
```

Set `project_id`, `prefix`, `device`, `platform` and `routes` in `config.json`. Keep `research/`, `tmp/` and `tools/node_modules/` out of git.

### 1 and 2. App audit and plan

Audit the app as it is: its routes and navigation (expo-router `app/` tree or the navigator), its theme and components, screenshots of every screen and state from a simulator or device (`xcrun simctl io booted screenshot`, `adb exec-out screencap -p`), the store listing and reviews. Write the four audit tables (critical issues, UX and navigation, visual design and type, platform and accessibility), name two to four flows with end states, and list every screen with its states. Number screens `NN-slug` in flow order. Done when PLAN.md has every section and the user has seen the screen list.

### 3. Brand assets

App icon, logo, illustrations, onboarding art and real photos go through `images.py` and `upload.py` once, with stable keys. Done when every image a screen shows has a key. Many apps need none: icons come from the icon set, shapes from CSS.

### 4. Design system

Read `references/creative-direction.md` first. Keep this phase to what the anchor screens need; the client sees the result on those screens, not as a board.

Write `design-system.md` (nine sections), put every token in `src/tokens.json` (primitives, semantic colors per theme, type roles in points, radius, space, shadow), list every pair in `src/contrast-pairs.txt` with semantic names and run:

```bash
python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt --json-out ../src/contrast-pairs.json
```

Every semantic pair is checked in light and dark. Done when contrast exits 0 and the spec answers every visual finding in the plan.

### 5 and 6. Pipeline and the anchor screen

Edit the chrome partials (`tabbar` tabs, `navbar`, `topbar`, `statusbar`, `homebar`) and the component classes in `head.html`, then fill `titles.json`, `links.json` and `CONTENT.md`. The main session writes the main tab's root screen itself as the quality anchor, light and dark (`dark_pages`).

```bash
cd .superdesign/src && python3 ../tools/build.py 01-home
cd ../tools && STILL=1 TARGET=44 node render.js ../research/shots-home 390 ../tmp/01-home.html ../tmp/01-home--dark.html
STILL=1 TEXT_SCALE=1.3 node render.js ../research/shots-home 390 ../tmp/01-home.html
node proto_test.js ../tmp/01-home.html ../research/shots-home/01
```

Done when the anchor renders `OK` (targets included) in both themes and at 130% text, `proto_test.js` passes, it passes the self-review in `references/creative-direction.md` section 3, it has 0 problems and 0 contract warnings, and the client has approved the anchor screens' live previews. Then set `"contract": "error"`.

### 7. Parallel tracks

Write `src/TRACKS.md` from the template, then launch up to five tracks in one message with short prompts from `templates/track-prompts.md`, grouped by flow (onboarding, core loop, library, settings, paywall), four to eight screens each including their states. Collect every report's placeholders, client questions, personal data and wanted partial changes into PLAN.md before the next round.

### 8. QA

Rebuild everything, render every screen still at 390 with `TARGET=44`, the dark twins too, the key screens at `TEXT_SCALE=1.3`, read every image, compare the set with `sheet.py grid`, and measure:

```bash
node measure.js 390 ../tmp/*.html --min 844 --json ../research/heights-390.json
```

### 9. Canvas import

```bash
python3 import_drafts.py status
python3 import_drafts.py create --dry-run
python3 import_drafts.py create --model <authoring model id>
```

It measures (never shorter than the device), refuses a `fixed` screen that is not exactly the device height, adopts half-created frames, reconciles before every retry, titles dark twins `NN · Name · Dark`, and writes `drafts.json` and `heights.json`. Later pushes use `update`.

### 10 and 11. Prototype and motion

Rebuild after every create so links resolve to live drafts; `python3 links.py --src ../src --built ../tmp` exits 1 on dead ends. Tap every flow in the live preview: tabs, push and back, sheets, the confirmation. Motion plays only after a tap (push, back, tab transitions; sheets slide; buttons press), so every thumbnail is the finished screen. `proto_test.js` on each interactive screen.

### 12. Board

`00-design-system.html` at 1440 wide (`frame_widths`): swatches for every semantic token in both themes and every primitive, the type roles, components in both themes. Colors and type come from `{{board:colors}}` and `{{board:type}}`, generated from tokens.json, so the board cannot drift.

### 13. Handoff

```bash
python3 build.py all --quiet                 # from src/
cd ../tools
python3 block_inventory.py ../tmp --src ../src --out ../handoff/component-inventory.md
python3 block_inventory.py ../tmp --src ../src --format json --out ../handoff/component-inventory.json
python3 tokens_export.py ../src/tokens.json --out ../handoff/theme/tokens.ts
```

Write `handoff/README.md` from `templates/handoff-README.md`: screen to route map, components with props, the element to React Native mapping, interaction states, icons to SF Symbols and Material, strings, placeholders, open questions, personal data, known gaps. Update PLAN.md's screen table with every preview link. Reply in a few lines: what is live, the link to tap from, known gaps, what the user must do by hand.

## The handoff contract

| Draft | Rule | Becomes in React Native |
|---|---|---|
| The root | `<div class="screen" data-screen="fixed\|scroll">` | A screen component; `scroll` wraps its content in a ScrollView or FlatList |
| Each child of `<main>` | `<section data-block="kebab-name" aria-labelledby="...">` | One component with props |
| Repeated items | Real repeated markup; `data-repeater="field"` on the list | FlatList data (or a map) |
| Chrome partials | `topbar`, `navbar`, `tabbar`, `homebar`, `statusbar` | Stack and Tabs options, safe-area insets, expo-status-bar |
| `tokens.json` | The only token source; semantic colors per theme; type in points | `theme/tokens.ts` (tokens_export.py) |
| Controls | State in ARIA (`aria-checked`, `aria-pressed`), behavior in `data-*` hooks | Switch value, selected index, chip state, sheet routes |
| Text | Only inside text elements | `<Text>` with a type role |
| `CONTENT.md`, `data-placeholder` | Real strings and facts; invented ones marked | The strings file, a to-confirm list |
| `config.json` `routes` | Page to expo-router file | The `app/` tree |

`build.py` checks it on every build; `block_inventory.py` reads it. Details: `references/handoff-contract.md`.

## Lessons that cost time

| Symptom | Rule |
|---|---|
| A short screen imported as one tall frame of empty space, or a long one cropped | `data-screen="fixed"` is exactly the device height (import refuses otherwise); `scroll` is measured full length |
| The phone page measured twice its height | Measure in a 390 x 844 viewport, never a tall one |
| A `vh` or `h-screen` hero filled a 3,000px frame | Size with the device metrics (`.screen`, `--status-h`, `--home-h`), never viewport units |
| The tab bar floated mid-screen on a long frame | The tab bar is `sticky bottom-0` after `<main>` with `flex-1`: pinned on a phone, at the end of a tall frame |
| A switch or segment looked right but failed the 44pt check | Hit areas are 44 x 44; draw the smaller visual inside (`.switch` does) |
| Text vanished in the React Native port | No bare text in layout elements: wrap it (`build.py` warns) |
| Dark mode was a recolor of a few screens | Semantic tokens per theme from day one; dark twins built from the same source |
| Thumbnails caught a transition halfway | Screens are static on load; motion plays only after a tap |
| A sheet changed the screen's height | Closed sheets are `display: none`; open sheets are fixed overlays |

The full table: `references/gotchas.md`.

## Files in this skill

| File | Read or use it when |
|---|---|
| `scripts/build.py`, `tokens.py`, `links.py`, `htmltree.py` | Building screens: partials with parameters, tokens, dark twins, link wiring, both contract checks |
| `scripts/render.js`, `sheet.py` | Looking at screens: PNGs, docW, overflow, tap targets (`TARGET`), large text (`TEXT_SCALE`), errors |
| `scripts/height.js`, `measure.js` | Quick heights; import-grade heights with bad-load rejection, font proof, a device minimum and a baseline |
| `scripts/proto_test.js` | Tabs, switches, segments, sheets (touch and keyboard), toasts, nothing hidden, the canvas pass |
| `scripts/import_drafts.py`, `upload.py`, `sdcli.py`, `images.py` | Canvas status, create, update, supersede; assets; how the CLI is found |
| `scripts/contrast.py` | Every pair, in every theme, against tokens.json |
| `scripts/tokens_export.py` | The React Native `theme/tokens.ts` |
| `scripts/block_inventory.py` | The screen, route, component, hook, form and placeholder inventory |
| `scripts/package.json`, `pw.js` | Playwright dependency and shared helpers |
| `templates/partials/` | head (tokens, component classes), statusbar, topbar, navbar, tabbar, homebar, navkit (interactions), motion |
| `templates/pages/` | `00-design-system` (board), `01-home` (tab root, scroll, sheet), `02-detail` (pushed, fixed) |
| `templates/*.json`, `contrast-pairs.example.txt` | tokens, config, links, titles, brand manifest, contrast pairs |
| `templates/PLAN.md`, `design-system.md`, `CONTENT.md`, `TRACKS.md`, `track-prompts.md`, `handoff-README.md` | The documents each phase writes |

## Related skills

de-superdesign-skill (website drafts, WordPress handoff), de-superdesign-react-skill (web pages in React), de-design-tokens-skill (tokens and contrast pairs), de-content-writing-skill (copy rules).
