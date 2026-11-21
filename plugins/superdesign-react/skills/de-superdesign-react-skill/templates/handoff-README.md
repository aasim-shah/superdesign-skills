# {Brand} redesign: handoff to the React app

<!-- Copy to .superdesign/handoff/README.md in the handoff phase and fill it from block-inventory.md (same
folder, from block_inventory.py), tmp/_manifest.json, config.json, design-system.md and the track reports.
Internal document: plain words, no client-facing voice. Never name the agency inside client deliverables. -->

Built {date}. {N} drafts ({desktop} desktop, {phone} phone, 1 design-system board) on
{Superdesign project URL}. Click-through starts at {preview URL of 01 · Home}. Target app: {Next.js App Router | Vite + React Router}.

**Next step:** create or open the app, copy `src/tokens.json`, `src/styles.css`, `src/components/`, `src/blocks/`,
`src/content/` and the pages, then work through "What to replace" below. The drafts are the review surface; the
source is the starting code.

## Sources of truth

| What | Where | Becomes |
|---|---|---|
| Tokens | `src/tokens.json` | `tailwind.config` theme (colors, fontFamily, borderRadius, boxShadow, maxWidth) and the type roles in `styles.css` |
| Component classes | `src/styles.css` | the app's global stylesheet, unchanged |
| Contrast pairs | `src/contrast-pairs.json` (all passing, or listed under trade-offs) | the design QA list |
| Design spec | `design-system.md` | the component README, prop rules |
| Copy and facts | `src/content/site.ts` (status per fact), `<Ph>` in pages | site config, CMS seed |
| Pages | `src/pages/*.tsx` | routes (`meta.route`) |
| Prototype links | `src/links.json` | real routes in router links |
| Assets | `src/asset-map.json`, `research/up/`, `research/brand/` | the app's image pipeline |

## Route map

| Page | Draft | Route | Notes |
|---|---|---|---|
| 01-home | {preview url} | `/` | |
| {NN-slug} | | {/route} | {a state of /contact, a dynamic route /locations/[slug] ...} |

## Blocks

{Paste the Blocks table from block-inventory.md, then for each block confirm or correct:}

| Block | Component | Pages | Props | Arrays | Surfaces | Hooks | Notes |
|---|---|---|---|---|---|---|---|
| `hero` | `Hero` | all | heading (h1), intro, buttons, image | | paper, white | data-sig="rise" | owns the H1 |

Merge decisions (same block under two names): {list}.

## Shared components

| Component | Pages | Becomes |
|---|---|---|
| `Layout` | all | root layout (`app/layout.tsx` or a layout route); finder state and shortcuts are a client component |
| `UtilityBar` | all | part of the header (Pause animation switch included) |
| `Header`, `MegaMenu` | all | header; menu data from {CMS | config} |
| `Footer` | all | footer; columns from {CMS | config}, facts from site config |
| `FinderPalette` | all | dialog + {search endpoint | generated JSON index} |

## Motion and interaction hooks

| Hook | What it does | Owner in the app |
|---|---|---|
| `data-dd` | mega menu disclosure | `MegaMenu` (state) |
| `data-search`, `data-finder` | finder palette | `FinderPalette` + search |
| `data-filter`, `data-tags` | chip filters | `useFilter` + Flip in `useGSAP` |
| `data-count` | count-up | `useGSAP` in the block |
| `data-sig...` | {signature device} | {component} |

Motion rules carried over: opacity never visibility, focus reveals, Pause animation (WCAG 2.2.2),
prefers-reduced-motion, nothing left hidden, static first render.

## Forms

| Form | Pages | Fields | Goes to |
|---|---|---|---|
| {enquiry} | {pages} | {fields} | {server action, API route, CRM, email} |

## What to replace

| Draft | App |
|---|---|
| `<A id href>` (lib/sd.tsx) | router `Link` with real routes; ids optional |
| `img('key')`, `brand('key')` | `next/image` or imported assets from `research/up/` and `research/brand/` |
| `<Block>` | the block's own `<section aria-labelledby>` |
| `<Ph>` | confirmed copy |
| GSAP from jsDelivr, `src/motion/*.ts` | `gsap` + `@gsap/react` from npm, `useGSAP()` per component |
| `build.mjs`, `tmp/`, `.sd-cache/` | nothing |

## Placeholders and open questions

{Count of `<Ph>` / data-placeholder elements and PLACEHOLDER facts; the open questions from PLAN.md.}

## Personal data

{Real names, photos, reviews and contact details in the drafts and research folder, and their consent status.}

## Known gaps and trade-offs

{Anything the drafts do that the app should not copy (inline styles on the board, eyebrows the client kept,
contrast failures with sign-off), and anything left out at the client's request.}
