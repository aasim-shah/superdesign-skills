# {App} screen tracks: shared rules

<!-- Copy to .superdesign/src/TRACKS.md and fill every {placeholder}. Each track prompt only says "read
TRACKS.md, your screens are ..." (templates/track-prompts.md), so everything shared lives here, once. -->

You are building {App} app screen drafts on a Superdesign canvas: Claude-authored HTML at {390 x 844}, no
Superdesign generation. The screens hand off to React Native (Expo Router). {One line of brief from the client.}
Folder: `{absolute path}/.superdesign/`. Work from `src/`. Tools are in `tools/`.

## Read first (in this order)
1. `design-system.md`: tokens, type, components, navigation map, motion, the contracts.
2. `src/CONTENT.md`: real strings and facts, and the PLACEHOLDER rules.
3. `src/partials/head.html`: the component classes (`.cell .group .group-label .btn-primary .btn-secondary .btn-plain
   .btn-danger .chip .field .label .switch .segment .sheet-wrap .sheet .toast`) and the type roles (`.t-*`).
4. `src/pages/{01-home}.html`: **the quality anchor**. Match its spacing, density and polish, and reuse its
   blocks ({screen-header, summary-card, item-list, settings-group, actions}).

## Screen skeleton
```html
<!-- title: Screen title | {App} -->
{{> head}}
<div id="{{prefix}}-root" class="screen" data-screen="fixed|scroll">
{{> topbar}}                                   <!-- tab roots; pushed screens: {{> navbar title="..." back="#..."}} -->
<main id="main" class="flex-1 pb-8">
  <section data-block="screen-header" aria-labelledby="pNN-title" class="pad"> the H1 (unless the navbar holds it) </section>
  <section data-block="{kebab-name}" aria-labelledby="pNN-x" class="pad"> ... </section>
</main>
{{> tabbar active="{tab}"}}                    <!-- or {{> homebar}} on screens without tabs -->
</div>
</body></html>
```

## Handoff contract (the app is built from your markup)
- `data-screen="fixed"` = exactly {844} tall (design it to fit); `scroll` = the full scroll length.
- Every child of `<main>` is a `<section>` with `data-block="{kebab-name}"` and `aria-labelledby` (or `aria-label`).
  One section = one future React Native component. Reuse names: {screen-header, item-list, settings-group, empty-state, ...}.
- Repeated items are real repeated markup with `data-repeater="{field}"` on the list.
- Text only inside text elements (`span`, `p`, headings, `label`, `button`): never bare in a `div`.
- Type only through `.t-*` roles; colors only through semantic tokens (`bg-surface`, `text-fg`, `text-fg-muted`,
  `bg-accent text-on-accent`). No hex.
- Controls keep state in ARIA: `role="switch" aria-checked`, `aria-pressed` in `data-segment` and `data-chips`.
- Invented strings, numbers or names: `data-placeholder` on the element, and list it in your report.
- One `<h1>` per screen: its title.

## Assets, icons, links
- Images only through `{{img:key}}` and brand tags. Every `<img>` has real alt text, or `alt="" aria-hidden="true"`.
- Icons: `<iconify-icon icon="ph:...">` (Phosphor fill or bold) with an SF Symbol and Material match.
- Every `<a>` has a unique id prefixed `pNN-`. Use these hashes for other screens: {#home #library #settings #item ...}.
- Sheets: `data-sheet-open="pNN-x"` on the trigger, the sheet markup after `</main>` (see the anchor screen).
- Never size with `vh` or `h-screen`. Tap targets at least 44 x 44.

## Native and brand rules
- One primary action per screen, in the accent. Destructive actions use danger.
- {US|UK} English, sentence case, no em or en dashes. No eyebrows (grouped-list headers are fine).
- Never invent prices, trial terms or policy claims. Never mention the agency.
- Every screen must work in dark mode: no white-boxed images, no shadow-only separation.

## Build, look, test (from `src/` and `tools/`)
```bash
python3 ../tools/build.py <screen>            # from src/: no PROBLEMS, no contract warnings
cd ../tools
STILL=1 TARGET=44 node render.js ../research/shots-<track> 390 ../tmp/<screen>.html ../tmp/<screen>--dark.html
STILL=1 TEXT_SCALE=1.3 node render.js ../research/shots-<track> 390 ../tmp/<screen>.html
node proto_test.js ../tmp/<screen>.html ../research/shots-<track>/<screen>
```
LOOK at every PNG (read the images). `render.js` must say OK (targets, docW 390, icons, fonts); fixed screens must
measure 844. Iterate until the screen sits comfortably next to the anchor.

## Rules
- Write ONLY your own `src/pages/NN-*.html`. Do not edit partials, tokens, other screens, tools, links.json,
  drafts.json, design-system.md, CONTENT.md or PLAN.md. A shared change you need goes in your report.
- Never import to Superdesign, never run create-design-draft, iterate-design-draft or execute-flow-pages.
- Never change the app's source code.

## Report (short)
Per screen: file, fixed or scroll and height, light and dark checked, one line "what it shows", flow ({flows}),
blocks used (and new names), placeholders you invented, questions for the client, personal data used, partial or
token changes you want.
