# Intake, app audit and plan

Phases 0 to 2: find out what exists, audit the app as it ships, and write the plan every later phase follows. Template: `templates/PLAN.md`.

## Contents

1. Intake
2. Set up the project folder
3. The app audit
4. Audit tables
5. Flows and the screen list
6. The plan (PLAN.md, Claude Doc on request)

## 1. Intake

| Ask or find | Why |
|---|---|
| Existing work: memory, `PLAN.md`, `.superdesign/`, the Superdesign project (`fetch-design-nodes --project-id <id> --json`) | Joining a design in progress is common; never start a second canvas |
| The app: repository, stack (Expo Router, React Navigation, native), platforms (iOS, Android, both), the devices that matter | Sets `config.json` `device` and `platform`, the chrome partials, the route format in `routes` |
| Constraints: own model only (no credits), agent cap (default 5), deadline, what may not change (navigation, paywall rules, safety behavior) | Recorded in the plan; behavior the app enforces (permissions, purchases, background work) is designed, never simulated as working |
| The app's fonts (bundled files), colors, icon set, app icon, any brand book | Design system inputs; reuse bundled fonts when the drafts can load them |
| Locale and every language the app ships in | Long strings (German, Finnish) break tight rows; plan the longest |
| What the client asked to keep or drop | Recorded in the plan so nobody adds it back |

When the user asks "how about the rest?", list the gap and start building. Ask only for real decisions.

## 2. Set up the project folder

```bash
SKILL="<base directory of this skill>"   # the folder holding SKILL.md, e.g. .claude/skills/de-superdesign-mobile-skill
mkdir -p .superdesign/{research,src/pages,src/partials,tmp,tools,handoff}
cp "$SKILL"/scripts/* .superdesign/tools/
cp "$SKILL"/templates/partials/* .superdesign/src/partials/
cp "$SKILL"/templates/tokens.example.json .superdesign/src/tokens.json
cp "$SKILL"/templates/config.example.json .superdesign/src/config.json
cp "$SKILL"/templates/links.example.json .superdesign/src/links.json
cp "$SKILL"/templates/titles.example.json .superdesign/src/titles.json
cp "$SKILL"/templates/CONTENT.md .superdesign/src/CONTENT.md
cp "$SKILL"/templates/pages/* .superdesign/src/pages/          # the board, a tab root and a pushed screen to start from
cd .superdesign/tools && npm install          # Playwright 1.64.1, system Chrome
```

Set `project_id`, `prefix`, `device` (points: width, height, status bar, home indicator, tab bar, nav bar), `platform` and `routes`. Device presets:

| Device | width x height | status | home | Notes |
|---|---|---|---|---|
| iPhone 13 to 16 class (default) | 390 x 844 | 47 | 34 | The canvas default; most reviews happen here |
| iPhone Pro with Dynamic Island | 393 x 852 | 59 | 34 | Use when the client's users skew to recent iPhones |
| Small iPhone check | 375 x 667 | 20 | 0 | A QA render, not a draft set |
| Android (Pixel class) | 412 x 915 | 24 | 24 | Use the Android chrome conventions (references/design-system.md) |

Keep `research/`, `tmp/` and `tools/node_modules/` out of git. The Superdesign CLI is found by `sdcli.py`: `$SUPERDESIGN_CLI`, a `superdesign` binary, else `npx --yes @superdesign/cli@latest`.

## 3. The app audit

There is no site to crawl. Collect, in `research/`:

| Source | How | Use it for |
|---|---|---|
| Route and navigation map | Read the `app/` tree (expo-router) or the navigators; list tabs, stacks, modals | The current IA, every screen that must exist |
| Theme and components | Read the theme file and shared components; note colors, type sizes, radii | The visual audit in numbers |
| Screenshots of every screen and state | `xcrun simctl io booted screenshot research/shots/<name>.png`, `adb exec-out screencap -p > research/shots/<name>.png` | The audit and the before and after story. Read them |
| Store listing and reviews | The App Store and Play pages; recent reviews | Positioning, complaints worth fixing, the first screenshots people see |
| Analytics or support notes (when the client shares them) | Where people drop off | Which flow to fix first |

Never copy credentials, signing keys or `.env` files into `research/`. Reviews and support notes can hold personal data: say so before sharing them.

## 4. Audit tables

One table per area, each row a finding with where it is and the fix (a screen number when the redesign fixes it). Lead with the point and a number.

| Area | What to look for |
|---|---|
| Critical issues | Dead ends (no way back), lost data on back, a permission asked before it is needed, a paywall that blocks a safety feature, crashes or blank states in the screenshots |
| UX and navigation | Taps from launch to the core action; tab count and naming; deep stacks; settings that hide primary features; onboarding length; empty states that explain nothing |
| Visual design and type | Font count and roles, type sizes against the platform scale, contrast in light and dark, icon style mixed across screens, glass or blur over busy content |
| Platform and accessibility | Tap targets under 44pt, fixed font sizes that ignore the user's text size, unlabeled icon buttons (VoiceOver, TalkBack), motion that ignores Reduce Motion, content under the status bar or home indicator, Android back behavior |

## 5. Flows and the screen list

Name 2 to 4 flows, each with an end state (an alarm app: Set, create an alarm to saved; Wake, ringing to the challenge to done; Keep, streaks to settings). Tag every screen with its flow.

List every screen, then its states. Each state a user can reach gets a draft when it looks different:

| State | Draw it when |
|---|---|
| Empty | The screen can have no data (first run, filtered to nothing) |
| Loading | Content arrives from the network or disk slower than a blink |
| Error and offline | The screen depends on the network or a device capability |
| Permission (asked, denied) | The screen needs camera, notifications, location, health data |
| First run and onboarding | Every step, and the moment it hands over to the app |
| Sheets, alerts, menus | Any overlay with its own decisions |
| Paywall or locked | A feature is gated |
| Dark | Every key screen (config `dark_pages`); all of them when dark mode is a selling point |

Number screens in flow order: `NN-slug.html`, title `NN · Name` (`05 · Home · Empty`); `00` is the board. Keep a state next to its screen.

## 6. The plan

Write `PLAN.md` at the project root from `templates/PLAN.md` (or `.superdesign/PLAN.md` when the root already has an unrelated PLAN.md: never overwrite it): lead (the problem and the plan in two sentences), the screen table (filled after import), the four audit tables, strategy (flows, navigation map), design system summary, feature specs for the app build, open questions, placeholder content, personal data noted, sources.

Make a Claude Doc only when the user asks for one. Either way, findings go in the plan, not the chat. Every track report adds to its lists: open questions, placeholders, personal data, partial changes wanted.
