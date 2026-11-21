# Gotchas

Lessons that cost time on four website redesigns (carried over where they apply), on a 16-screen app design made by adapting the website workflow, and on building this edition. Read it before the first screen and again before the first import.

## Contents

1. Screens and the device
2. Native fidelity
3. Measuring, rendering and the canvas
4. Process, brand and people

## 1. Screens and the device

| What happened | Rule now |
|---|---|
| Phone emulation in a tall window doubled a screen's measured height | Measure in a 390 x 844 viewport (the scripts do for any width under 600) |
| A `vh`-sized hero filled a 3,000px frame | No `vh`, `dvh` or `h-screen`: use `.screen` and the device metrics |
| The website tool sized frames by "mobile" in the file name, so `01-home` would have been 1440 wide | Width comes from config (`frame_width` 390, `frame_widths` for the board) |
| A short screen became a tall empty frame, a long one was cropped | `fixed` screens are exactly the device height (import refuses otherwise); `scroll` screens are measured full length |
| The tab bar sat mid-frame on a long screen | `<main class="flex-1">`, tab bar `sticky bottom-0` after it |
| A closed sheet still pushed the screen taller | Closed sheets are `display: none`; open ones are fixed overlays |
| A sheet opened on a long scroll screen appeared far below on the canvas | Draw sheet states on fixed screens; in the prototype the sheet sits at the viewport bottom |
| A partial's comment showed its own call, and the build recursed forever | Never write a literal tag in a partial's comment |
| The CSS rule `.screen[data-screen="fixed"]` made every screen look fixed to a text search | Read the root element's attribute, not the whole file (the tools do) |

## 2. Native fidelity

| What happened | Rule now |
|---|---|
| Switches (51 x 31), segments (32) and row links (40) failed the 44pt target check | Hit areas 44 x 44; draw the smaller visual inside; `TARGET=44` on every render |
| Bare text in a `div` rendered in the browser and would vanish in React Native | Text only in text elements (`build.py` warns) |
| Type in px did not grow with large text | Type roles in rem from tokens.json; check `TEXT_SCALE=1.3` |
| Dark mode was planned as a recolor at the end | Semantic tokens per theme from the start; dark twins from the same source |
| `UP NEXT` in caps over a card read as an eyebrow | Sentence-case labels; iOS grouped-list headers are the one caps convention |
| A web-style mega menu and command palette were carried into an app design | Apps use tabs, stacks and sheets; the website overlays do not apply |
| Icons had no native equivalent | Pick icons with an SF Symbol and a Material match; record the mapping |
| An off switch track on white measured about 1.2:1 | Acceptable only when the thumb and position carry the state; record the decision |
| A simulated scan or purchase looked like a working feature | Mark simulated states in the plan and the handoff; never imply the native part exists |

## 3. Measuring, rendering and the canvas

| What happened | Rule now |
|---|---|
| Drafts imported with `--device` showed one viewport | Width and height explicitly, always |
| Network flakiness gave fallback fonts and blank icons | `measure.js` rejects and retries, with `check_fonts` proof; never import a height from a bad load |
| An Iconify fallback host timed out while the icons still drew | `render.js` lists failed requests but fails a screen only through the asset checks (icons, fonts, images) and script errors |
| The API returned 5xx, sometimes after creating the frame | `import_drafts.py` adopts the half-created frame with its size and reconciles before each retry |
| An import returned a `draft-variant-` node id beside the draft id | Store the draft id only |
| `links.py` printed dead ends but exited 0, so a pipeline looked green | It exits 1 on dead ends now (`--allow-dead` while drafts are missing) |
| Thumbnails would catch an entrance animation halfway | Screens are static on load; motion plays only after a tap |
| zsh did not word-split `$VAR` in a for loop | Use arrays or pass the files straight to the tool |
| Setup copied scripts from a skill path that did not exist | Resolve `SKILL` to the folder holding SKILL.md first |

## 4. Process, brand and people

| What happened | Rule now |
|---|---|
| An existing PLAN.md at the project root belonged to other work | Never overwrite it: use `.superdesign/PLAN.md` |
| Credential files sat next to the app source | Never copy secrets, signing keys or `.env` files into `research/` or uploads |
| Trial lengths and prices were tempting to invent for a paywall | Never invent prices, trial terms or policy claims; draw the layout with marked placeholders |
| Placeholder times and streaks looked like real user data | `data-placeholder` on every invented value and a line in PLAN.md |
| Track reports each held placeholders, questions and personal data | Collect all of them into PLAN.md before the next round |
| Two authors edited shared partials | One writer per file; tracks never import |
| Deliverables must read as the client's own | Never mention the agency in screens, credits or docs for the client |
| Asking too much ran the clock | List the gap and start; ask only real decisions |
