---
name: de-superdesign-react-skill
description: Use when a website or web app is to be redesigned or designed as React (TSX) pages on a Superdesign canvas without spending Superdesign credits, when the deliverable is React components for a Next.js or Vite app rather than WordPress, or when someone says "design it in React on Superdesign", "TSX drafts", "React drafts on the canvas", "make the canvas clickable", "add GSAP motion to the drafts", "import the drafts full height" or "hand the redesign over to the React app".
---

# DEK Superdesign redesign, React edition

Claude writes every page as a React (TSX) component built from shared components and one token file. `build.mjs` renders each page on the server, hydrates it in the browser and inlines everything into one HTML file, which is checked locally and imported to a Superdesign canvas as a full-height draft. Superdesign is the canvas and review surface only. The handoff is the source itself: tokens, components, blocks with props, content files and routes that drop into a Next.js or Vite app.

This is the React version of `de-superdesign-skill` (HTML partials, WordPress handoff). Same phases, same canvas discipline, same brand and people rules; the authoring layer and the handoff change. Its phone-app sibling is `de-superdesign-mobile-skill`.

`prefix` in `config.json` names the root (`<prefix>-root`) and the Pause animation storage key. Everything else is prefix-free (`sd-still`, `data-skip`, `data-sig`), so no find-and-replace is needed.

## Start here

- New redesign: phase 0, then the phases in order. Read `references/gotchas.md` before the first page and again before the first import.
- Joining one in progress: read `PLAN.md`, `.superdesign/design-system.md`, `src/TRACKS.md`, `src/drafts.json` and `tmp/_manifest.json`, then run `python3 import_drafts.py status`.
- `SKILL` below means the folder holding this file: the "Base directory for this skill" shown when the skill loads (for example `.claude/skills/de-superdesign-react-skill` for a copied skill, or a folder under `~/.claude/plugins/` for a plugin install). Never assume another path.
- References, read when the phase comes:
  - `references/audit-and-plan.md`: intake, folder setup, crawl, audit tables, journeys, PLAN.md.
  - `references/creative-direction.md`: what the client approves first, the composition recipe (product cutouts, panels, callouts), color, motion, self-review. Read before phases 4 and 6.
  - `references/inspiration.md`: six reference designs broken down layer by layer (product scene, cutout with callouts, bento with notched joins, notched pricing cards, abstract hero object, two-tone app shell), which to pick for which product, and how to apply them without photography.
  - `references/brand-assets.md`: fetch, crop, reverse logo, WebP, upload with stable keys, `img()` and `brand()`.
  - `references/design-system.md`: the nine-section spec, `tokens.json` and `styles.css`, contrast, brand rules, the board.
  - `references/page-pipeline.md`: folder layout, the runtime, a page, components, `build.mjs`, both contracts, the anchor page.
  - `references/parallel-tracks.md`: splitting, TRACKS.md, file ownership, collecting reports.
  - `references/qa.md`: every check, still mode, bad loads, hydration errors, the per-page checklist.
  - `references/canvas-import.md`: full-height frames, retries, half-created frames, updates, superseding.
  - `references/prototype-layer.md`: links.json, `<A>`, journeys, mega menu, finder palette, filters.
  - `references/motion.md`: the GSAP layer, the signature layer, Pause animation, motion and React.
  - `references/handoff-contract.md`: what makes drafts app-ready, the handoff step, the inventory.
  - `references/gotchas.md`: lessons that cost time, as a table.

## Defaults (unless the user says otherwise)

1. **No credits.** Never `create-design-draft`, `iterate-design-draft`, `execute-flow-pages` or image or video generation. Claude writes the TSX; `import-design-draft` places the built HTML. The tools refuse the credit commands.
2. **Full-height frames.** `--width 1440 --height <measured>` (390 for phone drafts), never `--device`, at most 10,000px, measured still. Frames cannot be resized, renamed or deleted from the CLI.
3. **At most five agents at once**, short chat replies, findings in PLAN.md rather than chat. Save the user's caps and preferences to memory.
4. **One writer per file.** Tracks write only their own `src/pages/NN-*.tsx` (and new `src/blocks/` files the prompt names); the main session owns tokens, styles, components, lib, content, config and every import.
5. **Brand rules.** On dark bands every text, link, eyebrow and icon is pure white. One CTA color with white text at 4.5:1 or better. No eyebrows unless the client asks (house rule). US or UK English per the client, sentence case, no em or en dashes.
6. **Never mention the agency** (DEK) in drafts, deliverables, credits or bylines; its name is in `forbidden`, so the check fails if it slips in.
7. **Personal data.** Flag real names, photos, reviews and contact details to the user as you meet them; reviewers appear as first name + last initial; list them in PLAN.md.
8. **Placeholders are visible.** Invented copy is wrapped in `<Ph>` (or has `data-placeholder`); invented facts have `status: 'PLACEHOLDER'` in `content/site.ts`; each gets a line in PLAN.md.
9. **PLAN.md locally**; a Claude Doc only when the user asks for one.
10. **Never merge pull requests**; humans merge.
11. **Pass the authoring model** to imports (`--model <id>` or `DD_SD_MODEL`): it is recorded as `--generated-by`. Use the id of the model that actually wrote the TSX.
12. **A page first, boards later.** The first thing the client approves is the anchor page (`01-home`) with real copy and real product imagery, sent as a live preview link; the `00` board follows from the approved page. Compose it with `references/creative-direction.md`: product cutouts breaking a panel edge, callouts with leader lines, paper + ink + one panel color + one accent.

## Phases

| # | Phase | Deliverable | Read |
|---|---|---|---|
| 0 | Intake and setup | Constraints, `.superdesign/` folder, tools installed | `references/audit-and-plan.md` |
| 1 | Crawl and audit | Screenshots, crawl.json, content dump, image inventory, records | `references/audit-and-plan.md` |
| 2 | Plan | PLAN.md: audit tables, journeys, sitemap, open questions | `templates/PLAN.md` |
| 3 | Brand assets | Uploaded brand and content images, `asset-map.json`, `brand_urls` | `references/brand-assets.md` |
| 4 | Design system | `design-system.md`, `tokens.json`, `styles.css`, `contrast-pairs.json` | `references/design-system.md` |
| 5 | Page pipeline | Components, content, config, links, titles, `build.mjs` passing | `references/page-pipeline.md` |
| 6 | Anchor page | `pages/01-home.tsx`, written by the main session | `references/page-pipeline.md` |
| 7 | Parallel tracks | Every sitemap page, from `TRACKS.md` and short prompts | `references/parallel-tracks.md` |
| 8 | QA | Still renders read, docW, H1, hydration, heights, contrast | `references/qa.md` |
| 9 | Canvas import | Full-height drafts, `drafts.json`, `heights.json` | `references/canvas-import.md` |
| 10 | Prototype layer | Linked drafts, mega menu, finder palette, filters | `references/prototype-layer.md` |
| 11 | Motion | GSAP layer, signature layer, Pause animation | `references/motion.md` |
| 12 | Board and mobile | `00 · Design system` board, phone drafts at 390 | `references/design-system.md` |
| 13 | Handoff | `handoff/README.md`, block inventory, PLAN.md final | `references/handoff-contract.md` |

### 0. Intake and setup

Find what exists (memory, PLAN.md, `.superdesign/`, the project via `fetch-design-nodes`). Confirm own model only, the agent cap, the deadline and the target app (Next.js or Vite; `config.json` `app`). "By end of play" means design-complete with placeholders; the build waits on client content. Then:

```bash
SKILL="<base directory of this skill>"   # the folder holding this SKILL.md, e.g. .claude/skills/de-superdesign-react-skill
mkdir -p .superdesign/{research,src,tmp,tools,handoff}
cp "$SKILL"/scripts/* .superdesign/tools/
cp -R "$SKILL"/templates/src/. .superdesign/src/
cp "$SKILL"/templates/config.example.json .superdesign/src/config.json
cp "$SKILL"/templates/links.example.json .superdesign/src/links.json
cp "$SKILL"/templates/titles.example.json .superdesign/src/titles.json
cd .superdesign/tools && npm install     # esbuild, React 19, Tailwind 3, Playwright 1.64.1 (system Chrome)
```

Set `project_id` and `prefix` in `config.json`. Keep `research/`, `tmp/` and `tools/node_modules/` out of git.

### 1 and 2. Crawl, audit and plan

```bash
node crawl.js --out ../research --sitemap https://client.com/sitemap.xml --max 60
node crawl.js --out ../research --no-shots --widths 1440 --cards ".location-card" https://client.com/locations/
```

Read the screenshots. Write the four audit tables (critical issues, UX and IA, visual design and typography, technical, SEO and accessibility), name two to four journeys with end states, and draw the sitemap, including in-between states (confirmations, search and 404, the open mobile menu). Number pages `NN-slug` in sitemap order. Done when PLAN.md has every section and the user has seen the page list.

### 3. Brand assets

`images.py fetch`, `trim`, `reverse` (the reverse logo for dark bands), `crop` and `webp`, then `upload.py --dry-run` and `upload.py` for brand and content keys. Done when every image a page shows has a key in `asset-map.json` (`img('key')`) or `brand_urls` (`brand('key')`).

### 4. Design system

Read `references/creative-direction.md` first. Keep this phase to what the anchor page needs (tokens, styles, contrast); the client sees the result on the anchor page, not as a board.

Write `design-system.md` (nine sections), put every token in `src/tokens.json` (colors, fonts, type roles, radius, shadow, width), keep component classes in `src/styles.css`, list every pair in `src/contrast-pairs.txt` and run:

```bash
python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt --json-out ../src/contrast-pairs.json
```

Done when contrast exits 0 (or each failure is a recorded decision) and the spec answers every visual finding in the plan.

### 5 and 6. Pipeline and the anchor page

Fill the chrome components (`UtilityBar`, `Header`, `MegaMenu`, `Footer`, `FinderPalette`; drop the ones a small site does not need), `content/site.ts`, `content/palette.ts`, `titles.json` and `links.json`. The main session writes `pages/01-home.tsx` itself as the quality anchor, composed by the recipe in `references/creative-direction.md` (the product cut out of a panel edge with `components/Cutouts.tsx`, callouts on real UI, its motion in `motion/signature.ts`): every brand device, every component at its best, both contracts clean.

```bash
cd .superdesign/tools && node build.mjs 01-home
STILL=1 node render.js ../research/shots-home 1440 ../tmp/01-home.html
STILL=1 node render.js ../research/shots-home 390 ../tmp/01-home.html
python3 sheet.py page ../research/shots-home/01-home-1440.png ../research/shots-home/01 desktop
```

Done when the anchor renders `OK` at 1440 and 390 (no hydration or script errors), passes the self-review in `references/creative-direction.md` section 5, `proto_test.js` passes with motion live, it has 0 problems and 0 contract warnings, and the client has approved its live preview. Then set `"contract": "error"`.

### 7. Parallel tracks

Write `src/TRACKS.md` from the template (read order, page skeleton, runtime, handoff contract, assets, hashes, brand rules, hooks, commands, rules, report format), then launch up to five tracks in one message with short prompts from `templates/track-prompts.md`, grouped by journey, four to six pages each. Collect every report's PLACEHOLDER content, client questions, personal data and wanted component changes into PLAN.md before the next round.

### 8. QA

Rebuild everything, render each new page still at 1440 and 390, read the fold and every sheet, compare the set with `sheet.py grid`, and measure:

```bash
node build.mjs all --quiet
node measure.js 1440 ../tmp/*.html --json ../research/heights-1440.json
node measure.js 390 ../tmp/*mobile*.html
```

`measure.js` accepts a load only when docW, images, styles and every `check_fonts` family are right, and retries; a FAIL is re-run, never imported.

### 9. Canvas import

```bash
python3 import_drafts.py status
python3 import_drafts.py create --dry-run
python3 import_drafts.py create --model <authoring model id>
```

It measures, skips pages over 10,000px, adopts a frame a 5xx half-created (and records its size) instead of duplicating it, reconciles with the canvas before every retry and writes `drafts.json` and `heights.json`. Later pushes use `update`, which refuses a page whose height changed.

### 10. Prototype layer

Rebuild after every create so `<A>` resolves `#hash` placeholders to live drafts, then `node build.mjs all --strict-links` for dead ends and click every journey in the live preview. The mega menu and finder palette are overlays, so heights never change.

### 11. Motion

`src/motion/motion.ts` (site-wide: intro, line reveals, counts, hover) and `src/motion/signature.ts` (the brand's devices) start once after hydration. GSAP loads from jsDelivr, pinned (`config.json` `gsap`). Opacity only, focus reveals, static on full-height frames, nothing under reduced motion, every loop stopped by Pause animation. Verify:

```bash
node proto_test.js ../tmp/01-home.html ../research/shots-motion/01 --query <term> --click '<selector>'
node measure.js 1440 ../tmp/*.html --baseline ../src/heights.json
python3 import_drafts.py update --model <authoring model id>
```

### 12. Board and phone drafts

`pages/00-design-system.tsx` renders swatches and type roles from `tokens.json` and uses the real components, so it cannot drift. Phone drafts (home, a key template, the open menu) are named `*mobile*`, built and measured at 390, use the same block names as their desktop twins, and are mapped in `links.json` `mobile`.

### 13. Handoff

```bash
node build.mjs all --quiet
python3 block_inventory.py ../tmp --src ../src --out ../handoff/block-inventory.md
python3 block_inventory.py ../tmp --src ../src --format json --out ../handoff/block-inventory.json
```

Write `handoff/README.md` from `templates/handoff-README.md`: route map, block to component map with props and merge decisions, token source, shared components, motion and interaction hooks, forms, placeholders, open questions, personal data, known gaps, and what to strip from the drafts (the `sd` runtime). Update PLAN.md's screen table with every preview link. Reply in a few lines: what is live, the link to click from, known gaps, what the user must do by hand (delete superseded frames, confirm placeholders and consent).

## The handoff contract

| Draft | Rule | Becomes in the app |
|---|---|---|
| Each child of `<main>` | `<Block name="kebab-name" labelledBy="...">` | One React component |
| Repeated items | An array rendered with `.map`; `data-repeater="field"` on the list | An array prop (or a CMS collection) |
| Chrome | Only in `components/` (`Layout`, `Header`, `Footer` ...) | Layout components |
| `tokens.json` + `styles.css` | The only token source; no hex in pages | `tailwind.config` theme + `styles.css` (or CSS custom properties) |
| Behavior | In components (state, effects) and `data-*` hooks; no browser globals in pages | The same components; motion as `useGSAP` |
| Links and images | `<A id href>`, `img('key')`, `brand('key')` | Router links, the app's image pipeline |
| Content | Facts in `content/site.ts`; invented copy in `<Ph>` | Site config, CMS seed, a to-confirm list |
| `meta` | `export const meta = { title, route }` per page | The route table |

`build.mjs` (via `check.py`) checks it on every build; `block_inventory.py` reads it. Details: `references/handoff-contract.md`.

## Lessons that cost time

| Symptom | Rule |
|---|---|
| Canvas shows only the hero | Import with `--width/--height`, never `--device` |
| A hydration error in the console | No `Math.random()`, `Date`, `window` or locale-dependent formatting during render; browser code goes in effects |
| A class works in one page and not in another | Tailwind only sees class names written in full in `src/`; never build them from strings (`bg-${c}`) |
| An edge device clipped by its own section | `overflow-x-clip`, not `overflow-hidden` |
| The client calls the work "dummy samples", "too many colours" or "boxy, AI-generated" | Show a real page with the real product cut out of a panel edge (`references/creative-direction.md`), one accent, no per-section gradients or bordered card grids |
| `proto_test.js`: elements left hidden after scrolling, on pinned hero copy | Move scrubbed copy out with `y`; never fade it below 0.05 |
| `duplicate ids` on a page that repeats an SVG object | Suffix gradient and mask ids with `useId()` |
| Phone page wider than 390 | `grid-cols-1` before `md:grid-cols-12`; desktop overlays `hidden lg:block` |
| Double gap in an icon button | Icon and text in one span |
| Unstyled render, huge height | Bad load: `measure.js` rejects and retries; never import it |
| API 5xx mid-import | `import_drafts.py` reconciles with the canvas before each retry; run `status` before re-importing |
| Links unreachable by keyboard after reveals | Opacity, never `autoAlpha`; reveal on focus |

The full table: `references/gotchas.md`.

## Files in this skill

| File | Read or use it when |
|---|---|
| `scripts/build.mjs` | Building drafts: bundle, server render (two passes), hydration bundle, Tailwind compile, GSAP tags, manifest, then `check.py` |
| `scripts/check.py`, `htmltree.py` | Both contracts on the built HTML and the page sources |
| `scripts/crawl.js` | Crawling a live or reference site: screenshots, text, type, colors, images, records |
| `scripts/images.py`, `upload.py`, `sdcli.py` | Preparing and uploading brand and content images; how every Python tool finds the Superdesign CLI |
| `scripts/contrast.py` | Checking every pair against `tokens.json` |
| `scripts/render.js`, `sheet.py` | Looking at drafts: fold and full-page PNGs, docW, overflow culprits, errors, contact sheets |
| `scripts/height.js`, `measure.js` | Quick heights; import-grade heights with bad-load rejection, font proof and a baseline |
| `scripts/import_drafts.py` | Canvas status, full-height create, update, supersede, with retries and reconciliation |
| `scripts/proto_test.js` | Menu, palette, clicks, nothing hidden, Pause animation, the canvas pass |
| `scripts/block_inventory.py` | The route, block, component, hook, form and placeholder inventory |
| `scripts/package.json`, `pw.js` | Dependencies and shared Playwright helpers |
| `templates/src/` | The starting project: `tokens.json`, `styles.css`, `lib/` (runtime, `useFilter`), `components/` (including `Cutouts.tsx`: Phone, Callout, Leads, NotchCard), `content/`, `motion/`, `pages/00-design-system.tsx`, `pages/01-home.tsx` |
| `references/creative-direction.md` | Composing the anchor page, choosing color, the motion recipe and the self-review before the client sees a page |
| `references/inspiration.md` | Matching a reference hero the client shows you, or deciding between a photographic scene and product cutouts |
| `templates/*.json`, `contrast-pairs.example.txt` | config, links, titles, brand manifest, contrast pairs |
| `templates/PLAN.md`, `design-system.md`, `TRACKS.md`, `track-prompts.md`, `handoff-README.md` | The documents each phase writes |
| `examples/design-system.md` | A finished nine-section spec for a fictional brand (AcmePets) |

## Related skills

de-superdesign-skill (the HTML and WordPress edition), de-superdesign-mobile-skill (phone app screens, React Native handoff), de-design-tokens-skill (tokens and contrast pairs), de-gsap-skill (the production motion layer), de-content-writing-skill (copy rules), de-wp-accessibility-skill (menus, dialogs, contrast, motion patterns that apply to any web build).
