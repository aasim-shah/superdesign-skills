# QA before every import

Phase 8. Nothing reaches the canvas unchecked, because a frame's size is fixed at creation and the client sees thumbnails before anyone looks closer. Tools: `build.mjs` (with `check.py`), `render.js`, `sheet.py`, `measure.js`, `contrast.py`, `proto_test.js`.

## Contents

1. The checks
2. Still mode
3. Reading the renders
4. Bad loads
5. Hydration and script errors
6. Visual checklist per page
7. How to report status

## 1. The checks

| Check | Command (from `.superdesign/tools`) | Pass |
|---|---|---|
| Both contracts | `node build.mjs all --quiet` | 0 problems; 0 contract warnings on new pages |
| Look | `STILL=1 node render.js ../research/shots-x 1440 ../tmp/<page>.html` | `OK`, and you opened the fold and the full page |
| Phones | same at `390` | `docW` 390, nothing in `wide` |
| Long pages | `python3 sheet.py page <full.png> <prefix> desktop` | every sheet read |
| The set | `python3 sheet.py grid ../research/folds.jpg ../research/shots-x/*-1440-fold.png` | consistent with the anchor page |
| Height | `node measure.js 1440 ../tmp/*.html --baseline ../src/heights.json` | no FAIL, OVER or CHANGED |
| Contrast | `python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt` | exit 0 |
| Motion and prototype | `node proto_test.js ../tmp/<page>.html ../research/shots-motion/<page>` | `PASS` |
| Journeys | `node build.mjs all --strict-links --quiet` | no dead ends you did not choose |
| Live | `get-design --draft-id <id> --output live.html`, grep for the change | the canvas has what you built |

## 2. Still mode

Review and measure with `STILL=1` (prefers-reduced-motion). The canvas shows frames static, so the still render is what the client sees, and a pinned GSAP section adds pin-spacer height that would overstate the frame. Full-page screenshots with motion on show everything below the fold hidden, waiting for scroll reveals: that is expected, and proto_test.js covers motion separately.

## 3. Reading the renders

`render.js` prints one line per page:

```
01-home-1440 OK {"docW":1440,"h":3810,"h1":1,"broken":[],"icons":true,"tailwind":true,"font":"Inter","missingFonts":[],"wide":[]}
```

| Field | Meaning when it is wrong |
|---|---|
| `docW` | wider than the viewport: horizontal scroll. `wide` names the elements: usually `grid md:grid-cols-12` without `grid-cols-1`, a nowrap pill or button, or a desktop overlay without `hidden lg:block` |
| `h1` | not 1: a second H1 in a component or a card |
| `broken` | an image key pointing at a missing upload, or a flaky load |
| `tailwind` | false: the compiled stylesheet is missing (the build did not run, or the file was edited) |
| `font`, `missingFonts` | a default font, or a `check_fonts` family that never loaded: a bad load (section 4) |
| `ERRORS` | script errors fail the page; failed requests are listed and fail it only through the checks above |

## 4. Bad loads

A flaky network gives broken renders: wrong docW, enormous heights, broken brand images, the browser's default font. Never trust or import a number from one. `measure.js` accepts a load only when docW equals the width, every image loaded, the stylesheet marker is present, the body font is not a default, fonts are ready, and every `check_fonts` family has a loaded font face (a font whose stylesheet never arrived would otherwise pass). It retries in a fresh page (3 attempts) before printing FAIL. Re-run a FAIL later rather than lowering the bar.

## 5. Hydration and script errors

The browser re-renders every page over the server markup. A difference is a hydration error in the console: `render.js` marks the page CHECK and `proto_test.js` fails. The usual causes are `Math.random()`, `Date`, `toLocaleString()` without a fixed locale, `window` or `localStorage` read during render, and an invalid nesting the browser repairs (`<div>` inside `<p>`, `<a>` inside `<a>`). Fix the source; never silence the error. If a canvas ever refuses page scripts, build with `--no-hydrate` (static drafts, no interaction) and say so in the plan.

## 6. Visual checklist per page

- One H1, in the hero; headings in order.
- docW equals the viewport at 1440 and 390.
- No broken images, every icon drawn, no empty bands or stray gaps between sections.
- Hierarchy reads at a glance; card edges and baselines line up; density matches the anchor.
- Dark bands: every text, link, eyebrow and icon white. CTAs only in the action color.
- Section edge devices visible (an edge drawn with a pseudo-element needs `overflow-x-clip`, not `overflow-hidden`).
- Buttons with an icon: one gap, not two (text and icon in one span).
- Placeholders wrapped in `<Ph>` and listed in the report; reviewers as first name + last initial.
- Height under 10,000px (trim section padding on that page if not; do not split the page).

## 7. How to report status

Say what you verified and how: built, rendered, measured, tested, fetched live. If you could not see something (thumbnails not generated yet, a page skipped), say that instead of claiming it.
