# Page pipeline

Phase 5 and the anchor page (phase 6). Pages are TSX components built from shared components, one token file and a small runtime, rendered on the server, hydrated in the browser and inlined into one HTML document per draft, then validated against two contracts. Tools: `scripts/build.mjs`, `scripts/check.py`. Templates: `templates/src/`.

## Contents

1. Folder layout
2. The runtime (lib/sd.tsx)
3. A page
4. Components and content
5. What build.mjs does
6. The draft contract (problems)
7. The handoff contract (warnings)
8. Build and look
9. The anchor page

## 1. Folder layout

```
PLAN.md                          audit and plan (project root)
.superdesign/
  design-system.md               the spec
  research/                      crawl, brand/, img/, up/, shots-*/, img-sources.json
  src/
    config.json                  project id, prefix, brand_urls, forbidden, contract, widths, fonts, gsap, app
    tokens.json                  THE token source (colors, fonts, type roles, radius, shadow, width)
    styles.css                   base rules and component classes (Tailwind layers)
    asset-map.json               img('key') -> uploaded URL (upload.py)
    titles.json                  page -> canvas title ("01 · Home")
    links.json  drafts.json      prototype links; page -> draft id (import_drafts.py)
    heights.json                 page -> frozen frame size (import_drafts.py)
    contrast-pairs.txt|json      every allowed pair (contrast.py)
    TRACKS.md                    the shared brief for parallel tracks
    lib/sd.tsx  lib/useFilter.ts the draft runtime; chip filters with Flip
    components/                  Layout, UtilityBar, Header, MegaMenu, Footer, FinderPalette, Motion, ...
    blocks/                      blocks used on more than one page (a component with props)
    content/site.ts  palette.ts  shared copy and facts; the finder index
    motion/motion.ts signature.ts the two motion layers
    pages/NN-slug.tsx            one page per draft (default export + meta)
    gen/                         small generators (palette items from research data); not scanned
  tmp/                           built drafts (what gets rendered and imported), _manifest.json, .sd-cache/
  tools/                         this skill's scripts + node_modules
  handoff/                       README.md, block-inventory.md/json
```

## 2. The runtime (lib/sd.tsx)

| Export | Use | Why |
|---|---|---|
| `<A id href>` | Every link. `id` is required (pNN-, hdr-, mm-, ftr-, util-, nav- ...) | `#hash` placeholders resolve to live drafts from links.json + drafts.json; in-page anchors stay hashes; chrome links to the current page get `aria-current="page"` |
| `<Block name labelledBy \| label variant>` | Every child of `<main>` | Renders `<section data-block>`: one future app component |
| `img('key')`, `brand('key')` | Every image | Only uploaded URLs; an unknown key stops the build |
| `useHref('#x')`, `go(url)` | Buttons and forms that navigate (`onSubmit={() => go(next)}` with `const next = useHref('#sent')` in render) | Same resolution as `<A>` |
| `<Ph as>` | Invented copy | Renders `data-placeholder` |
| `cx(...)` | Joining class names | Write each class in full |

The build renders every page with the same context the browser hydrates with (page name, links, drafts, the ids on the page, the asset and brand URLs it uses), so server and client markup match. The runtime never ships to production; the app swaps `<A>` for its router link and `img()` for its image pipeline.

## 3. A page

```tsx
import { CalendarCheck } from 'lucide-react';
import { Layout } from '../components/Layout';
import { A, Block, img, Ph } from '../lib/sd';

export const meta = { title: 'Services | Bath, grooming and spa add-ons | Brand', route: '/services' };

const addOns = [
  { id: 'p02-deshed', title: 'Extreme de-shed', text: 'Less fur on the sofa for weeks.' },
  { id: 'p02-soak', title: 'Paw spa soak', text: 'Five fizzy minutes for tired paws.' },
];

export default function Services() {
  return (
    <Layout>
      <Block name="hero" labelledBy="p02-title" className="bg-paper">
        <div className="wrap py-24">
          <h1 id="p02-title" className="h1">Every bath, every visit.</h1>
          <A id="p02-book" href="#book" className="btn-primary mt-8"><span className="inline-flex items-center gap-2"><CalendarCheck size={20} aria-hidden="true" />Book a visit</span></A>
          <img src={img('hero-pug')} alt="A pug in a towel after a bath" className="mt-10 rounded-panel" />
        </div>
      </Block>
      <Block name="add-ons" labelledBy="p02-add-title" className="bg-white py-24">
        <div className="wrap">
          <h2 id="p02-add-title" className="h2">Spa add-ons.</h2>
          <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2" data-repeater="add-ons">
            {addOns.map((a) => (
              <li key={a.id} className="card p-8"><h3 className="h3">{a.title}</h3><Ph as="p" className="mt-3">{a.text}</Ph></li>
            ))}
          </ul>
        </div>
      </Block>
    </Layout>
  );
}
```

- `meta.title` is the SEO title (the check fails without it); `meta.route` is the app route (`null` for boards and states that are not routes); `meta.template` is optional ("a state of /contact").
- Page-only pieces are small functions in the page file; a block used on two pages moves to `src/blocks/` with typed props (the main session decides, from track reports).
- Page ids start with `pNN-`. Repeated items are arrays rendered with `.map` and `data-repeater` on the list.
- No `window`, `document`, `localStorage`, `Math.random()` or `Date` in a page: the server render throws (`window is not defined`) or the hydration differs. Browser behavior lives in components, inside effects and handlers.

## 4. Components and content

| File | Owns | Change it when |
|---|---|---|
| `components/Layout.tsx` | Skip link, chrome, `<main>`, finder state ("/" and Cmd/Ctrl-K), motion start | A page needs another chrome variant: add a prop or a second layout, never chrome in a page |
| `UtilityBar.tsx` | The promise line, utility links, `MotionToggle` (Pause animation) | |
| `Header.tsx`, `MegaMenu.tsx` | Logo, nav, the mega menu disclosure, search button, CTA, phone menu link | |
| `Footer.tsx` | Line, newsletter form, columns, facts, legal | |
| `FinderPalette.tsx` | The search dialog; rendered only while open | |
| `Motion.tsx` | Starts `motion/motion.ts` and `motion/signature.ts` after hydration | |
| `content/site.ts` | Brand, nav, footer, facts with `status` | Real copy arrives; a fact is confirmed |
| `content/palette.ts` | The finder index | Generate it from research data when long |

## 5. What build.mjs does

1. Bundles each page twice with esbuild (Node and browser), resolving packages from `tools/node_modules`.
2. Renders it with `react-dom/server`: pass 1 collects the ids on the page, pass 2 keeps links to those ids as in-page anchors. An unknown image key or a render error stops that page.
3. Compiles Tailwind once for all pages (theme from `tokens.json`, content from `src/**/*.{ts,tsx}`, `styles.css`, the type roles) and inlines it with the `--sd-css: 1` marker that `measure.js` checks.
4. Writes one document: fonts, the motion pre-paint guard, the CSS, `<div id="<prefix>-root" data-sd-root>` with the server markup, the render context as JSON, the pinned GSAP scripts and the minified page bundle (about 230KB) that hydrates it.
5. Writes `tmp/_manifest.json` (title, route, components each page imports, dead ends) and runs `check.py`.

Flags: `--quiet`, `--strict-links` (dead-end hashes fail the build), `--no-hydrate` (server markup only: static drafts with no page script, for a canvas that rejects scripts), `--no-check`, `--src`, `--out`.

## 6. The draft contract (problems, exit 1)

What Superdesign's importer needs. A page that breaks it does not pass.

- One complete `<!DOCTYPE html>` document with a non-empty `<title>`; `<body>` has no class; one root element in `<body>` (scripts aside), id `<prefix>-root`.
- Every `<a>` has a unique id; hrefs are `https://`, `#hash`, `mailto:` or `tel:`; anchors never nest; no duplicate ids anywhere.
- Images only from uploaded URLs; every `<img>` has alt; empty alt only with `aria-hidden="true"`.
- None of config `forbidden` in the markup (old brand names, misspellings, the agency's name, lorem); no leaked render values (`undefined`, `NaN`, `[object Object]`) in visible text.

## 7. The handoff contract (warnings)

What the React app build needs (full rules in handoff-contract.md). Warnings by default; set config `"contract": "error"` once the anchor page is clean so tracks cannot slip.

- Every child of `<main>` is a `<Block>` with a kebab-case name and `labelledBy` pointing at an existing id (or `label`).
- Exactly one `<h1>`.
- In the page source: no `vh`, `h-screen` or `dvh` (frames are up to 10,000px tall), no hex colors, no `dangerouslySetInnerHTML` or `<script>`, no raw `<a>`, `<section>` or literal image `src`, no browser globals, no `Math.random()` or `Date`.
- No `.eyebrow` when config `eyebrows` is false.

## 8. Build and look

```bash
cd .superdesign/tools
node build.mjs all                    # or page names; --quiet for problems only
STILL=1 node render.js ../research/shots-a 1440 ../tmp/02-services.html
STILL=1 node render.js ../research/shots-a 390 ../tmp/02-services.html
python3 sheet.py page ../research/shots-a/02-services-1440.png ../research/shots-a/02 desktop
```

Look at the fold and every contact sheet, every time. `render.js` prints `OK` or `CHECK` with docW, height, H1 count, broken images, fonts, whether the styles loaded, the elements that stick out past the viewport (`wide`), and any script or hydration error.

## 9. The anchor page

The main session writes `pages/01-home.tsx` itself, before any track starts, and iterates until it is the quality bar: every device from the spec in use, every component in its best form, both contracts clean, 1440 and 390 checked, no console errors, measured under 10,000px. Tracks are told to match its structure, density, rhythm and polish, and to reuse its blocks by name. A weak anchor multiplies across 25 pages; an hour more here saves a round of fixes.
