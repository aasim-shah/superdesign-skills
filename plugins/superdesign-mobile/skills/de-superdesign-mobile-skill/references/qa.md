# QA before every import

Phase 8. Nothing reaches the canvas unchecked: a frame's size is fixed at creation, and a phone screen that is a few points off reads as broken. Tools: `build.py`, `render.js`, `sheet.py`, `measure.js`, `contrast.py`, `proto_test.js`, `links.py`.

## Contents

1. The checks
2. Still mode and the phone viewport
3. Reading the renders
4. Tap targets
5. Large text
6. Both themes
7. Bad loads
8. Visual checklist per screen

## 1. The checks

| Check | Command (from `.superdesign/tools`) | Pass |
|---|---|---|
| Both contracts | `python3 build.py all --quiet` (from `src/`) | 0 problems; 0 contract warnings on new screens |
| Look and targets | `STILL=1 TARGET=44 node render.js ../research/shots-x 390 ../tmp/<screen>.html` | `OK`, and you opened the PNG |
| Dark twins | the same on `../tmp/<screen>--dark.html` | `OK` |
| Large text | `STILL=1 TEXT_SCALE=1.3 node render.js ../research/shots-big 390 ../tmp/<screen>.html` | `OK`, nothing clipped or overlapping in the PNG |
| The set | `python3 sheet.py grid ../research/screens.jpg ../research/shots-x/*-390.png --cols 6 --width 240` | consistent with the anchor |
| Height | `node measure.js 390 ../tmp/*.html --min 844 --baseline ../src/heights.json` | no FAIL, OVER or CHANGED |
| Contrast | `python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt` | exit 0 in both themes |
| Interaction | `node proto_test.js ../tmp/<screen>.html ../research/shots-proto/<screen>` | `PASS` |
| Flows | `python3 links.py --src ../src --built ../tmp` | exit 0 (no dead ends you did not choose) |
| Live | `get-design --draft-id <id> --output live.html`, grep for the change | the canvas has what you built |

The board (1440 wide) renders at 1440 without `TARGET`.

## 2. Still mode and the phone viewport

Review and measure with `STILL=1` (prefers-reduced-motion) in a 390 x 844 viewport with touch emulation: that is what the scripts do for any width under 600. Never measure a phone screen in a tall window: emulation doubles the height. A fixed screen must measure exactly the device height; `import_drafts.py` refuses it otherwise.

## 3. Reading the renders

```
02-detail-390 OK {"docW":390,"h":844,"h1":1,"broken":[],"icons":true,"tailwind":true,"font":"Inter","missingFonts":[],"wide":[],"small":[]}
```

| Field | Meaning when it is wrong |
|---|---|
| `docW` | wider than 390: something sticks out; `wide` names it (a nowrap row, a fixed-width card) |
| `h` | a fixed screen above 844 clips content; a scroll screen far above its neighbours may repeat content |
| `h1` | not 1: the navbar title and a large title both used `<h1>` |
| `small` | tap targets under `TARGET` with their size (section 4) |
| `icons`, `missingFonts`, `tailwind` | a bad load (section 7) |
| `ERRORS` | script errors fail the screen; failed requests are listed and fail it only through the checks above |

## 4. Tap targets

`TARGET=44` (48 for Android) lists every link, button, switch, tab, input and role control smaller than 44 x 44 that is visible. Inline links inside a paragraph are exempt. Fix by growing the hit area, not the drawing: `.switch` is a 51 x 44 button with the 31pt track drawn inside, segment buttons are 44 tall, row links stretch to the row (`self-stretch min-h-[44px]`), icon buttons are `h-11 w-11`.

## 5. Large text

Type roles are in rem, so `TEXT_SCALE=1.3` (or 1.5) renders the screen as a user with larger text sees it. Read the PNG: rows grow instead of clipping, nothing overlaps, titles wrap instead of truncating where the content matters. Fixed screens that overflow at 1.3 need a scroll fallback in the app: note it in the handoff.

## 6. Both themes

Every dark twin renders `OK` and reads right: no white illustration boxes, no shadows doing the work of contrast (dark uses surface steps), the accent and `on-accent` pair readable, the status bar following the theme.

## 7. Bad loads

A flaky network gives broken renders: wrong docW, a fallback font, blank icons. `measure.js` accepts a load only when docW equals the width, every image and icon loaded, Tailwind ran, the body font is not a default and every `check_fonts` family has a loaded font face; it retries 3 times before FAIL. Re-run a FAIL later rather than lowering the bar.

## 8. Visual checklist per screen

- One H1: the screen title. Headings in order.
- Nothing under the status bar or the home indicator; margins 16pt; list insets consistent.
- One primary action in the accent color; destructive actions in danger, away from the primary.
- Every control shows its state (on, off, selected, disabled) and has a label.
- Empty, loading and error states drawn for screens that need them.
- Text in text elements only; strings from CONTENT.md; placeholders marked and listed.
- Fixed screens exactly 844; scroll screens under 10,000px.
- Say what you verified and how (built, rendered, tapped, measured). If you could not see something, say that instead of claiming it.
