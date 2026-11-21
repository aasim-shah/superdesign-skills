# Gotchas

Lessons that cost time on four HTML redesigns (Northwind, Contoso, Fabrikam, AcmePets) and on building this React edition. Read it before starting and again before the first import.

## Contents

1. React and the build
2. Layout and CSS
3. Measuring, rendering and the canvas
4. Motion and accessibility
5. Process, brand and people

## 1. React and the build

| What happened | Rule now |
|---|---|
| A page read `window` while rendering; the build stopped with `render failed: window is not defined` | Browser APIs only in effects and handlers. Pages never touch them (`check.py` warns) |
| `Math.random()`, `new Date()` or `toLocaleString()` in render gave the server one text and the browser another: a hydration error | Constants or props only in render; format numbers with a fixed locale; time-dependent copy is a constant in the draft |
| A class built from a string (`bg-${tone}`) never reached the stylesheet | Write every class in full; map props to full class strings |
| A dialog opened after hydration needed an image the server render never used | Call `img('key')` with a literal key: the build ships every literally referenced key to the browser |
| `<div>` inside `<p>` (or a link inside a link) rendered fine on the server, then the browser repaired it and hydration failed | Valid nesting; `<A>` never wraps another link |
| Two copies of a block drifted apart across pages | A block used twice moves to `src/blocks/` with props; the main session owns it |
| The canvas may refuse a script one day | `node build.mjs all --no-hydrate` gives static drafts with the same markup; say in the plan that interaction is off |

## 2. Layout and CSS

| What happened | Rule now |
|---|---|
| A section with an edge drawn by `::before` above it and `overflow-hidden` clipped its own edge | `overflow-x-clip` on sections with edge devices |
| `grid ... md:grid-cols-12` without `grid-cols-1` overflowed at 390 when a child held a nowrap pill or button | Every multi-column grid starts with `grid-cols-1`; render at 390 and read `wide` |
| Flex buttons with `gap` showed double spacing: the text and an icon became separate flex items | Icon and text in one span inside the button |
| A custom un-layered class with `position: relative` beat the `absolute` utility | Never set position, display or spacing in un-layered rules; use `@layer components` or utilities |
| A closed mega menu kept its box and widened phone pages | Desktop-only overlays are `hidden lg:block`; check `docW == 390` on every page |
| Filtered cards with a `flex` class ignored the `hidden` attribute | `[hidden] { display: none !important; }` in the base layer (styles.css ships it) |
| Decorative watermark words (aria-hidden) still failed automated contrast checks | Put them in generated content (`data-wm` + `::after { content: attr(data-wm) }`) |
| `vh`-sized heroes ballooned in a 10,000px frame | No `vh`, `dvh` or `h-screen`; size heroes to content (`min-h-[860px]`) |
| Off-scale font sizes crept in (22, 26, 34, 44px) | Type roles live in `tokens.json`; tally sizes on the board; new pages use the roles |

## 3. Measuring, rendering and the canvas

| What happened | Rule now |
|---|---|
| Drafts imported with `--device desktop` showed only the hero | Full height from the start: `--width 1440 --height <measured>` (390 for phone drafts) |
| A home page measured 10,513px; the CLI caps at 10,000 | Trim that page's section padding, re-measure, then import |
| Network flakiness gave broken renders: wrong docW, huge heights, broken brand images, a fallback font | Reject and retry (`measure.js`, with `check_fonts`); never import a height from a bad load |
| The API returned 5xx for a stretch, sometimes after creating the frame | `import_drafts.py` adopts a half-created frame (with its size) and reconciles before each retry |
| An import response carried two ids (`draftId` and a `draft-variant-` node id) | Store the draft id only |
| A pinned GSAP section added pin-spacer height, so a motion-on measure overstated the frame | Measure and review still (`STILL=1`; `measure.js` always is) |
| Phone emulation in a tall window doubled a phone page's measured height | Measure phones at 390 x 844 |
| `target="_top"` links were blocked inside the preview iframe | Plain `https://p.superdesign.dev/draft/<id>` links, no target |
| A page's height changed after its full-height import | Heights are frozen: overlays, transforms and opacity only; `measure.js --baseline` before every push |
| zsh did not word-split `$VAR` in `for f in $F`, so a loop ran once with every file as one argument | Use arrays (`pages=(a b); for p in "${pages[@]}"`) or pass the files straight to the tool |
| Setup copied scripts from a skill path that did not exist on that machine | Resolve `SKILL` to the folder holding SKILL.md first |

## 4. Motion and accessibility

| What happened | Rule now |
|---|---|
| Scroll reveals would leave content hidden in thumbnails | Full-height frames (`innerHeight > 1600`) get a short intro and a static page |
| Reveals used `autoAlpha` (visibility hidden), so keyboard users could not tab to links below the fold | Opacity only; a `focusin` handler reveals whatever receives focus |
| SplitText changed two headings' height by 1px | A heading whose split changes height gets a fade; measure before every push |
| A public-sector audience needed stoppable motion (WCAG 2.2.2) | A global Pause animation switch stops CSS and GSAP loops, remembered per visitor. Default on every project |
| Motion screenshots with scroll reveals showed blank pages | Test motion with a scripted scroll (`proto_test.js`); review layout still |

## 5. Process, brand and people

| What happened | Rule now |
|---|---|
| Brand-blue icons and eyebrows on dark bands looked off to the client | On dark bands every text, link, eyebrow and icon is pure white |
| White on the brand pink measured 3.5:1 | One CTA color with white text at 4.5:1 or better; bright brand colors as graphics and display text only |
| Seven track reports each held placeholders, client questions and personal data | Collect all of them from every report into PLAN.md before the next round |
| Two tracks edited shared files and both imported | One writer per file; tracks never import; the main session pushes once |
| Seven tracks needed the same rules, hooks and commands | One `TRACKS.md` shared brief, read first; per-track prompts are a few lines |
| Placeholder prices and policies looked real | `<Ph>` + `status: 'PLACEHOLDER'` in content + a draft banner on legal pages + the plan's placeholder list |
| Deliverables must read as the client's own | Never mention the agency in pages, credits, bylines or docs for the client; the agency name is in config `forbidden` |
| The live site showed leaders' and owners' names and photos, a customer photo and reviewers' names | Flag personal data to the user; reviewers as first name + last initial; consent before launch |
| The client site sat behind a bot check | Audit from public listings, say so in the plan, ask for screenshots. Never bypass a challenge |
| Asking too much ran the clock | When the user asks "how about the rest?", list the gap and start; ask only real decisions |
| The user set a cap mid-session ("no more than 5 sub-agents, keep it compact") | Save such preferences to memory; keep replies to a few lines |
