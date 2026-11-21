# The handoff contract: drafts that become a React app

What makes a React redesign app-ready. Drafts that follow it move into a Next.js (App Router) or Vite + React Router codebase as components, routes, a theme and content with little more than renaming. Checked by `check.py` (warnings, or errors with `"contract": "error"`) and read by `block_inventory.py`.

## Contents

1. The contract at a glance
2. Blocks: Block and its rules
3. Naming blocks
4. Chrome, tokens, behavior and content
5. What the app replaces
6. The handoff step
7. Block inventory script

## 1. The contract at a glance

| Draft artifact | Rule | Becomes in the app |
|---|---|---|
| Each child of `<main>` | `<Block name="kebab-name" labelledBy>` (or `label`) | One component, `blocks/<Name>.tsx`, with typed props |
| Repeated items | An array rendered with `.map`, `data-repeater="field"` on the list | An array prop, or a CMS collection when items have their own pages |
| Surfaces | The block's background token class (`bg-white`, `on-dark bg-ink-900`) | A `surface` prop with an approved list |
| Variants | `variant="name"` on the Block when one block has two layouts | A `variant` prop, not a second component |
| Chrome | Only in `components/` | The app layout and its parts |
| `tokens.json` + `styles.css` | The only token source; no hex in pages | `tailwind.config` theme (or CSS custom properties) + the same `styles.css` |
| Behavior | Component state, handlers and effects; `data-*` hooks for motion | The same components; motion as `useGSAP` |
| `content/site.ts` + `<Ph>` | Real facts with a status; invented copy marked | Site config, CMS seed, a "to confirm" list |
| Forms | `<form data-form="name">`, every field labelled, `name` attributes | Server actions or API routes |
| `meta` + `titles.json` | Title, route, canvas title | The route table and page metadata |

## 2. Blocks: Block and its rules

```tsx
<Block name="reviews" labelledBy="p05-rev-title" className="relative bg-white py-24 md:py-28">
  <div className="wrap">
    <h2 id="p05-rev-title" className="h2">Pups (and their people) love it here.</h2>
    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" data-repeater="reviews">
      {reviews.map((r) => (
        <figure key={r.by} className="card p-7"><blockquote>“{r.quote}”</blockquote><figcaption>{r.by}</figcaption></figure>
      ))}
    </div>
  </div>
</Block>
```

- One block, one responsibility. A section that does two jobs is two blocks.
- The first block owns the only H1. Block headings are H2, item titles H3.
- Same block name on two pages means the same markup skeleton and props. Layout differences are `variant`.
- A block on two or more pages lives in `src/blocks/` with typed props; a one-page block may stay a function inside the page.
- Nested `<section>` elements inside a block (FAQ topic groups) are items, not blocks.
- No eyebrow, kicker or pre-heading by default (house rule). If the client kept them, `.eyebrow` only, and the handoff README says so.
- Facts (phone, address, hours, prices) come from `content/site.ts`, never free text that differs per page.

## 3. Naming blocks

Name the content and its job, not the look, in kebab-case: `hero`, `ticker`, `service-cards`, `price-finder`, `steps`, `reviews`, `faq`, `stats`, `media-text`, `cta-band`, `form`, `map-list`. The app component is the PascalCase of the name (`service-cards` is `ServiceCards`). Reuse a name whenever the content is the same kind; a new name is a decision the main session makes from track reports. Record the list in TRACKS.md. The inventory's "merge candidates" list shows blocks that share a kind and prop shape under two names.

## 4. Chrome, tokens, behavior and content

- **Chrome:** anything on more than one page and outside `<main>` is a component in `components/`. Never copy chrome into a page.
- **Tokens:** pages use token utilities and component classes. A one-off color is a missing token: add it to `tokens.json` and the spec, or use an existing one.
- **Behavior:** state and handlers in components; browser APIs only in effects and handlers; motion through `data-*` hooks. No `dangerouslySetInnerHTML`, no inline scripts.
- **Content:** real copy from the crawl and the client; anything invented in `<Ph>` and in the track report and PLAN.md.

## 5. What the app replaces

| Draft | App |
|---|---|
| `lib/sd.tsx` `<A id href>` | The router link (`next/link` or React Router `Link`) with real routes from `meta.route`; ids can go |
| `img('key')`, `brand('key')` | The image pipeline (`next/image` or imported assets); `research/up/` and `research/brand/` hold the files |
| `<Block>` | Nothing: each block is already a component; keep `aria-labelledby` on its `<section>` |
| `<Ph>` | Real copy once confirmed |
| GSAP from jsDelivr, `motion/*.ts` on hooks | `gsap` from npm, `useGSAP()` per component, the same rules |
| `Layout` finder state, `MotionToggle` | The same components in the root layout (client components in Next.js) |
| The draft build (`build.mjs`, `tmp/`) | Nothing: drafts are a review surface |

## 6. The handoff step

The last phase writes `.superdesign/handoff/`:

```bash
cd .superdesign/tools
node build.mjs all --quiet --strict-links                       # 0 problems, every hash resolved
python3 block_inventory.py ../tmp --src ../src --out ../handoff/block-inventory.md
python3 block_inventory.py ../tmp --src ../src --format json --out ../handoff/block-inventory.json
python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt --json-out ../src/contrast-pairs.json
```

Then fill `handoff/README.md` from `templates/handoff-README.md`: sources of truth, route map, the block inventory with confirmed names and props, merge decisions, shared components, motion and interaction hooks, forms, placeholders and open questions, personal data, known gaps and trade-offs, and what to strip.

## 7. Block inventory script

`block_inventory.py` reads the built drafts and `tmp/_manifest.json` and reports:

| Section | Contents |
|---|---|
| Page to route | Each page's title, route (from `meta`), its blocks in order, the shared components it imports |
| Blocks | Each block: guessed kind (hero, cards, steps, faq, form, stats, media-text, ticker, cta-band, table, list, content), uses on desktop and phone drafts, pages, guessed props (heading level, intro, buttons, image, arrays with item fields, forms), surfaces, hooks, an example heading |
| Merge candidates | Names that share a kind and a prop shape |
| Sections by page | Every section with the source of its name |
| Shared components | Each component, how many pages use it, what it becomes |
| Hooks, forms, placeholders | Every `data-*` hook with counts, every form with its fields, `data-placeholder` counts and PLACEHOLDER facts |

A section without a `Block` gets a suggested name (aria-label, then heading) and the report says "fallback": wrap it in `<Block>` and rebuild before the app build.
