# Prototype layer: linked drafts, mega menu, finder palette, filters

Phase 10. Asked as "make the canvas clickable", "the search should be a popup", "the nav dropdown should work". Tools: `lib/sd.tsx` (link resolution at render time), `scripts/build.mjs --strict-links`, `scripts/proto_test.js`. Templates: `templates/links.example.json`, `components/MegaMenu.tsx`, `components/FinderPalette.tsx`, `content/palette.ts`, `lib/useFilter.ts`.

## Contents

1. Linked drafts
2. Wiring every journey
3. Mega menu
4. Finder palette
5. Filters and small widgets
6. Verify

## 1. Linked drafts

Pages and components keep readable placeholders (`<A id="hdr-nav-services" href="#services">`). At render time `<A>` resolves each `#hash` whose target page has a draft to `https://p.superdesign.dev/draft/<id>` (ids from `drafts.json`), so links go live as soon as the target is imported: rebuild and `update` after each round of creates. Server and browser resolve with the same data, so hydration never sees a different href.

| links.json key | Maps | Example |
|---|---|---|
| `hash` | hash to page | `"#memberships": "03-memberships"` |
| `prefix` | hash prefix to page | `"#tip-": "24-tip"` (every article card opens the one article draft) |
| `page` | per-page overrides | `"07-contact": {"#send": "08-contact-sent"}` |
| `id` | one anchor by id (most specific); `null` keeps the hash on purpose and is never a dead end | `"pal-all": "26-search-404"` |
| `mobile` | links on phone drafts go to the phone twin | `"map": {"01-home": "27-mobile-home"}` |

A link to the page it sits on stays an in-page anchor when that id exists on the page, otherwise it links to the page itself, and chrome links (`hdr-`, `mm-`, `ftr-`, `util-`, `nav-`, `tab-`, `mob-`, `sal-`) get `aria-current="page"`. Phone, email, social and in-page tabs stay as they are. Never add `target`: the preview iframe blocks top navigation.

Buttons and forms that move to another draft resolve the URL during render and navigate in the handler:

```tsx
const sent = useHref('#contact-sent');
<form data-form="contact" onSubmit={(e) => { e.preventDefault(); go(sent); }}> ... </form>
```

## 2. Wiring every journey

Click each journey end to end in the live preview: home to the product, to the booking or checkout step, to the confirmation; the story to the inquiry to "inquiry received"; search "see all" to the search page; every legal link to the legal template. `node build.mjs all --strict-links` fails on hashes that resolve to no draft and lists them per page: add the draft, map the hash, or map the anchor id to `null` on purpose. A finished prototype has every hash resolved.

## 3. Mega menu

`MegaMenu.tsx`: one disclosure per menu group, a `<button data-dd aria-expanded aria-controls>` and an absolute panel `[data-mega]` below the header, closed by default, so page height never changes.

- Opens on click, Enter, Space or ArrowDown (focus moves to the first link), and on hover after a 70ms intent delay for pointer devices; closes on Esc (focus back to the button), outside click and focus leaving.
- Plain links in lists; no `role="menu"`.
- `hidden lg:block` on the panel: a hidden panel that keeps its box still widens phone pages.
- Panel content (from `content/site.ts`): a framing line, rows with an icon or avatar, name and one-line description, and one feature card.
- Grids inside the panel start with `grid-cols-1`.

## 4. Finder palette

`FinderPalette.tsx`, a command-palette search (a salon finder by city, state or ZIP; designs and guides).

- Opens from the header search button, `/`, Cmd/Ctrl-K (`Layout`), or any form that calls `useFinder().open(query)` (give the form `role="search" data-finder`). Pinned 96px from the top, never vertically centred (frames are up to 10,000px tall).
- Focused input, popular chips, results grouped with match highlighting, arrows to move, Enter to open, Esc and outside click to close, focus trapped while open, focus returned on close.
- Rendered only while open, so the server markup and the thumbnail never contain it.
- Items live in `content/palette.ts` with `#hash` hrefs, so they wire like any link. Generate the file from research data when there are many (49 salons from `research/locations.json` with a 40-line script in `src/gen/`).
- Handoff: a dialog component; the index becomes a search endpoint or a generated JSON file.

## 5. Filters and small widgets

- Filters: `useFilter()` (lib/useFilter.ts). Buttons carry `data-filter` and `aria-pressed`; list items carry `data-tags` and `hidden={!f.shows(tags)}`; a live count says how many show. Every item is in the server markup, so the canvas shows the full list. When the motion layer runs, Flip glides the cards to their new places. `styles.css` ships `[hidden] { display: none !important; }` because a `flex` class would otherwise win.
- Project widgets (a price finder with a weight slider and size buttons that update a monthly price) are components with state: their initial render is the state the canvas shows, so choose a representative default.

## 6. Verify

```bash
node proto_test.js ../tmp/01-home.html ../research/shots-motion/01 --query pricing --click '[data-filter="care"]' --click '[data-filter="all"]'
```

It hovers the mega menu open and closed, types in the palette and checks results and Esc, runs each `--click`, scrolls to the end, toggles Pause animation, then reloads at full frame height as the canvas does and checks nothing is hidden and the height did not move. Any console error (hydration included) fails it. Then click a nav link in the live preview (`superdesign.dev/preview/draft/<home id>`) and confirm the frame lands on the target draft.
