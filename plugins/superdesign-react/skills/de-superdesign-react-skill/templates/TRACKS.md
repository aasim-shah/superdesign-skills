# {Brand} page tracks: shared rules

<!-- Copy to .superdesign/src/TRACKS.md and fill every {placeholder}. Each track prompt only says "read
TRACKS.md, your pages are ..." (templates/track-prompts.md), so everything shared lives here, once. -->

You are building {Brand} website redesign drafts on a Superdesign canvas: Claude-authored React (TSX) pages,
no Superdesign generation. {One line of brief from the client, in their words.}
Folder: `{absolute path}/.superdesign/`. Pages are in `src/pages/`. Tools are in `tools/` (run them from there).

## Read first (in this order)
1. `design-system.md`: colors, type, space, brand devices, components, motion, the contracts.
2. `src/content/site.ts`: shared copy and facts (with their status). Deep source: `research/content-dump.md`
   (grep it for your page); structured data in `research/{cards.json}`.
3. `src/tokens.json` and `src/styles.css`: the tokens and component classes ({list them: .wrap .h1 .h2 .h3 .lead
   .btn-primary .btn-outline .btn-light .card .link .field .label .hint ... and the brand device classes}).
4. `src/lib/sd.tsx`: the runtime (`A`, `Block`, `img`, `brand`, `useHref`, `go`, `Ph`, `cx`).
5. `src/pages/01-home.tsx`: **the quality anchor**. Match its structure, density, rhythm and polish, and
   reuse its blocks ({name them: hero, ticker, service-cards, steps, reviews, cta-band}) and `src/blocks/`.

## Page skeleton
```tsx
import { Layout } from '../components/Layout';
import { A, Block, img, Ph } from '../lib/sd';

export const meta = { title: 'Page title | {Brand}', route: '/{route}' };

export default function Page() {
  return (
    <Layout>
      <Block name="hero" labelledBy="pNN-title" className="..."> {/* the FIRST block: the motion intro animates it; owns the H1 */} </Block>
      <Block name="{kebab-name}" labelledBy="pNN-x-title" className="..."> ... </Block>
    </Layout>
  );
}
```

## Handoff contract (the React app reuses your code)
- Every child of `<main>` is a `<Block name="{kebab-name}" labelledBy="...">` (or `label=` when it has no
  visible heading). One block = one future app component.
- Reuse block names from this list when the content is the same kind: {hero, ticker, service-cards,
  price-finder, steps, reviews, faq, cta-band, ...}. New name? Name the content, not the look
  (`service-cards`, never `blue-grid`), and say so in your report. Blocks in `src/blocks/` are imported, never copied.
- Repeated items are arrays rendered with `.map`, with `data-repeater="{field}"` on their list.
- Behavior lives in components (state, handlers). No `window`, `document`, `localStorage`, `Math.random()` or
  `Date` in a page, no `dangerouslySetInnerHTML`, no `<script>`.
- Tokens only: no hex anywhere in a page. Need a new color or class? Ask in your report.
- Write every class name in full (`cx(on && 'bg-ink-900')`, never `bg-${tone}`).
- Invented copy, numbers or names: `<Ph>` around it, and list it in your report.
- One `<h1>`, in the hero. Block headings `h2`, item titles `h3`.

## Assets, icons, links
- Images only through `img('{key}')` (keys in `src/asset-map.json`) and `brand('logo')`, `brand('logo-rev')`{, ...},
  with literal keys. Cutouts with transparent backgrounds: {keys}. Every `<img>` has real alt text, or
  `alt="" aria-hidden="true"` when decorative.
- Icons: `lucide-react` components, `aria-hidden="true"` when decorative; one size per role.
- Every link is `<A id="pNN-..." href="...">`. Hrefs are `#hash`, `https://`, `mailto:` or `tel:`. Use these
  hashes for other pages (they become live draft links): {#home #services #pricing ...}. A form or button that
  moves on uses `const next = useHref('#x')` and `go(next)` in its handler.
- Page ids start with `pNN-`.
- Never size with `vh`, `dvh` or `h-screen`. Desktop pages are 1440 wide; aim for 5,000 to 9,500px, hard max 10,000.

## Brand rules
- On dark bands (`on-dark text-white` on the block) every text, link, eyebrow and icon is pure white.
- {cta color} is the only "do this" fill. {other color rules from design-system.md section 2}
- {Eyebrows: none (house rule) | kept at the client's request: .eyebrow only}.
- {US|UK} English, sentence case, no em or en dashes. Keep the client's real copy where it exists.
- Never mention the agency in copy, credits or bylines.
- Real people: first name + last initial for reviewers; flag every real name, photo or review you use.

## Motion hooks (the layers start after hydration; the page must look finished without them)
{List each signature hook with one line: `data-sig="..."` what it does, what markup it needs. Plus the shared
ones: `data-count` (numbers count up), `data-parallax`, `data-reveal`, `data-skip`, `data-nudge` (icon nudges
on hover). Filters: `useFilter()` from `lib/useFilter.ts`. Search forms call `useFinder().open(query)`.}

## Build, look, measure (from `tools/`)
```bash
node build.mjs <page-name>                      # no PROBLEMS, no contract warnings on your page
STILL=1 node render.js ../research/shots-<track> 1440 ../tmp/<page-name>.html
STILL=1 node render.js ../research/shots-<track> 390 ../tmp/<page-name>.html    # docW must be 390
python3 sheet.py page ../research/shots-<track>/<page-name>-1440.png ../research/shots-<track>/<page-name> desktop
STILL=1 node height.js 1440 ../tmp/<page-name>.html
```
zsh does not split `$VAR` in `for f in $FILES`: loop over an array (`pages=(a b); for p in "${pages[@]}"`)
or pass the files straight to the tool.

LOOK at the fold PNG and every contact sheet (read the images). `render.js` must say OK: no script or hydration
error, docW equal to the width (it names the elements that stick out), no broken images. Fix empty bands, weak
hierarchy, misalignment, cramped or sparse sections. Iterate until the page sits comfortably next to the home page.

## Rules
- Write ONLY your own `src/pages/NN-*.tsx`. Do not edit components, blocks, lib, content, tokens, styles, tools,
  links.json, drafts.json, design-system.md or PLAN.md. A shared change you need goes in your report; until it
  lands, build the piece inside your page.
- Never import to Superdesign, and never run create-design-draft, iterate-design-draft or
  execute-flow-pages (they spend credits). The main session imports after review.

## Report (short)
Per page: file, still height at 1440, one line "what it shows", journey ({journeys}), blocks used (and any
new block name), PLACEHOLDER content you invented, questions for the client, personal data you used (names,
photos, reviews), component, block, token or content changes you want.
