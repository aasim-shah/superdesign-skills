# Changelog

## 1.0.0 (2026-11-21)

First public release. Both skills are rewrites of an internal HTML-to-WordPress Superdesign workflow, which is not included here.

### superdesign-mobile (`de-superdesign-mobile-skill`)

- Screens are 390 wide. A `fixed` screen is exactly 844 tall (import refuses any other height). A `scroll` screen is its full measured length.
- Device partials with parameters: `statusbar`, `topbar`, `navbar` (title, back, action), `tabbar` (active tab), `homebar`.
- Semantic light and dark tokens. `dark_pages` builds `<page>--dark` twins, titled and linked automatically.
- Type roles in points, rendered as rem, so `TEXT_SCALE=1.3` previews large text.
- Controls: switches, segmented controls, chips, bottom sheets (focus trap, Esc, scrim), toasts, tab state.
- Screens are static on load. Push, back and tab transitions run only after a tap, so thumbnails never catch a screen mid-animation.
- Native checks: root `.screen` with `data-screen`, no bare text in layout elements, no `vh`, `dvh` or `h-screen`, 44 x 44 tap targets, contrast in both themes.
- Handoff: `tokens_export.py` writes `theme/tokens.ts` (passes `tsc --strict`), an element-to-React-Native map, an accessibility map, a screen-to-route inventory, and an icon map to SF Symbols and Material.

### superdesign-react (`de-superdesign-react-skill`)

- Pages are React 19 TSX components built from shared components. `tokens.json` is the only token source.
- `build.mjs` bundles each page with esbuild, renders it on the server in two passes, hydrates it, and inlines it into one HTML file (about 300KB). Tailwind 3 is compiled at build time, so there is no runtime CDN. `--no-hydrate` builds script-free drafts.
- `<A id href>` resolves links at render time. `img('key')` and `brand('key')` stop the build on an unknown key. `<Block name labelledBy>` marks handoff blocks.
- `MegaMenu`, `FinderPalette`, `MotionToggle` and `useFilter` are provided as components and hooks.
- React checks: browser globals in pages, `Math.random()` or `Date` during render, raw `<a>`, `<section>` or literal `src`, leaked `undefined`, `NaN` or `[object Object]`, empty `<title>`, render failures, hydration errors.
- Handoff: route and component inventory from `tmp/_manifest.json`, plus a README that maps every draft construct to the app.

### Fixes shared by both skills

- The skill folder is resolved from where the skill loads, so plugin installs and copied folders both work.
- `sdcli.py` finds the Superdesign CLI: `$SUPERDESIGN_CLI`, then a `superdesign` binary, then `npx --yes @superdesign/cli@latest`. Credit-spending commands are refused.
- There is no default authoring model. Writes require `--model` or `DD_SD_MODEL`.
- Frame width comes from config (`frame_width`, `frame_widths`, `mobile_pattern`), not from the page name.
- `draft-variant-` node ids are never accepted as draft ids.
- After a transient failure, the canvas is checked for the title before a retry, and a half-created frame is adopted instead of duplicated. Adopted frames get a recorded height, and `update` refuses frames that have none unless `--force` is passed.
- A font passes only when a FontFace is `loaded`.
- A render is OK only with no overflow, no script or console errors, and loaded fonts.
- Dead-end links fail the build (mobile `links.py` exits 1; React `build.mjs --strict-links`). `"id": null` keeps a hash on purpose and is not a dead end.
- The forbidden-string check skips scripts and styles.
- The viewport check covers `h-dvh`, `min-h-dvh`, `h-svh` and `h-lvh`.
- `contrast.py --tokens` checks semantic pairs per theme.
- Skill descriptions list triggers only.
- Playwright is pinned to 1.64.1. 1.48.2 had a high-severity advisory (browser downloads without SSL certificate checks, fixed in 1.55.1). Both editions pass their smoke tests on 1.64.1 with unchanged heights.

### Known limits

- Imports were tested only in dry-run mode and against saved canvas listings, not against a live Superdesign project.
- The canvas's limit on inline script size is untested for React drafts (about 230KB of script). Use `--no-hydrate` if a canvas refuses them.
