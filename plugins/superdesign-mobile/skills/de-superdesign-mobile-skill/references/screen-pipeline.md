# Screen pipeline

Phase 5 and the anchor screen (phase 6). Screens are sources plus partials, built into one complete HTML document per draft (and per theme) and validated against two contracts. Tools: `scripts/build.py`, `scripts/tokens.py`, `scripts/links.py`, `scripts/htmltree.py`. Templates: `templates/partials/`, `templates/pages/`.

## Contents

1. Folder layout
2. A screen source
3. Template tags and partial parameters
4. Fixed and scroll screens
5. States and dark twins
6. Component classes
7. The draft contract (problems)
8. The handoff contract (warnings)
9. Build and look
10. The anchor screen

## 1. Folder layout

```
PLAN.md                          audit and plan (project root, or .superdesign/PLAN.md if the root has one)
.superdesign/
  design-system.md               the spec
  research/                      shots/ (device screenshots), brand/, up/, store notes
  src/
    config.json                  project id, prefix, device, platform, widths, dark_pages, routes, forbidden, contract
    tokens.json                  THE token source (primitives, semantic light and dark, type, radius, space, shadow)
    asset-map.json               {{img:key}} -> uploaded URL (upload.py)
    CONTENT.md                   real strings and facts, PLACEHOLDER marked
    TRACKS.md                    the shared brief for parallel tracks
    titles.json                  page -> canvas title ("01 · Home"); dark twins add " · Dark" themselves
    links.json  drafts.json      prototype links; page -> draft id (import_drafts.py)
    heights.json                 page -> frozen frame size (import_drafts.py)
    contrast-pairs.txt|json      every allowed pair (contrast.py)
    partials/                    head, statusbar, topbar, navbar, tabbar, homebar, navkit, motion, ...
    pages/NN-slug.html           one source per screen
  tmp/                           built drafts (NN-slug.html, NN-slug--dark.html)
  tools/                         this skill's scripts + node_modules
  handoff/                       README.md, component-inventory.md/json, theme/tokens.ts
```

## 2. A screen source

```html
<!-- title: Alarms | App name -->
{{> head}}
<div id="{{prefix}}-root" class="screen" data-screen="scroll">
{{> topbar}}
<main id="main" class="flex-1 pb-8">
<!-- HEADER -->
<section data-block="screen-header" aria-labelledby="p02-title" class="pad pt-1">
  <h1 id="p02-title" class="t-large-title">Alarms</h1>
</section>
<!-- ALARM LIST -->
<section data-block="alarm-list" aria-labelledby="p02-list" class="pad">
  <h2 id="p02-list" class="group-label">Upcoming</h2>
  <ul class="group" role="list" data-repeater="alarms"> <li class="cell">...</li> </ul>
</section>
</main>
{{> tabbar active="alarms"}}
</div>
</body></html>
```

The first line is the screen's title. Keep the comment above each section: it names the section for people and is the fallback component name. Screen-only styles go in a `<style>` inside the root with `pNN-` classes. The root is the device: `class="screen"` and `data-screen`.

## 3. Template tags and partial parameters

| Tag | Becomes |
|---|---|
| `{{> name}}` | `partials/name.html`, nested up to 4 levels |
| `{{> name key="value"}}` | the same, with `{{@key}}` (or `{{@key\|default}}`) inside the partial replaced by the value |
| `{{title}}` | the `<!-- title: -->` line (else config `default_title`) |
| `{{tokens}}`, `{{fonts}}` | the token block and font links from tokens.json (head partial) |
| `{{lang}}`, `{{theme}}`, `{{prefix}}` | config `lang`; `light` or `dark`; config `prefix` |
| `{{img:key}}`, `{{logo}}` (any `brand_urls` key) | uploaded URLs; an unknown image key stops the build |
| `{{board:colors}}`, `{{board:type}}` | the board's generated swatches and type specimen |
| config `inject` | partials appended before `</body>` on every screen (motion) |
| `#hash` hrefs | live draft links when links.json maps them |
| `<iconify-icon` | gets `noobserver`: the canvas never scrolls, so lazy icons would stay blank |

Never write a literal tag inside a partial's own comment: the build expands it (a navbar comment that shows its own call recurses).

| Partial | Parameters | Use |
|---|---|---|
| `topbar` | none | Tab roots: status bar only; the first block holds the large title (the H1) |
| `navbar` | `title`, `back`, `back-label`, `action`, `action-href`, `action-class` (`""` shows the action) | Pushed screens: back, inline title (the H1), one trailing action |
| `tabbar` | `active` (the tab's `data-tab`) | Tab roots and their sub-screens. Edit the tabs per project |
| `homebar` | none | Screens without a tab bar: the home indicator |
| `statusbar` | none | Inside topbar and navbar; follows the theme |

## 4. Fixed and scroll screens

| `data-screen` | Height | Use for |
|---|---|---|
| `fixed` | exactly `device.height` (844); content that overflows is clipped, so design it to fit | Pushed forms, sheets drawn as screens, onboarding steps, alerts, the ringing or camera screen |
| `scroll` | the full scroll length, at least `device.height` | Lists, feeds, settings, long detail screens |

The root is a flex column at least one device tall: `<main class="flex-1">` pushes the tab bar or home indicator to the bottom. The tab bar is `sticky bottom-0`: pinned while a phone-size window scrolls, at the end of a full-height canvas frame. Sizes come from the device metrics (`--status-h`, `--home-h`, `--tabbar-h`, `--navbar-h`), never from `vh`.

## 5. States and dark twins

- A state that looks different is its own screen: `05-home-empty.html`, `06-home-sheet.html` (the sheet authored open: `data-open="true"`), `07-permission.html`. Copy the screen, change the state, keep the block names.
- Dark mode: list pages in config `dark_pages` (or `"all"`). The build also writes `<page>--dark.html` with `<html class="dark">`: the semantic tokens switch, nothing else changes. Its canvas title is the page title + " · Dark" and its links go to dark twins.
- Images with a light background need a dark variant; brand devices drawn with primitives need a check in dark.

## 6. Component classes

`head.html` defines the vocabulary every track uses (token utilities only): `.topbar .statusbar .navrow .navrow-title .nav-btn .tabbar .tab .homebar .pad .group .group-label .cell .cell-icon .card .btn .btn-primary .btn-secondary .btn-plain .btn-danger .chip .field .label .switch .segment .sheet-wrap .scrim .sheet .grabber .toast`, and the type roles `.t-large-title .t-title1 .t-title2 .t-title3 .t-headline .t-body .t-callout .t-subhead .t-footnote .t-caption .t-stat`. Controls carry their state in ARIA (`aria-checked`, `aria-pressed`, `aria-current`, `data-open`), which the CSS reads and the handoff maps to props.

## 7. The draft contract (problems, exit 1)

- One complete `<!DOCTYPE html>` document; `<body>` has no class; one root element in `<body>` with `class="screen"` and `data-screen="fixed"` or `"scroll"`.
- Every `<a>` has a unique id; hrefs are `https://`, `#hash`, `mailto:` or `tel:`; anchors never nest; no duplicate ids anywhere.
- Images only from uploaded URLs; every `<img>` has alt; empty alt only with `aria-hidden="true"`.
- No unrendered `{{tags}}`; none of config `forbidden`.

## 8. The handoff contract (warnings)

Warnings by default; set config `"contract": "error"` once the anchor screen is clean.

- Every child of `<main>` is a `<section>` with a kebab-case `data-block` and `aria-labelledby` pointing at an existing id (or `aria-label`).
- Exactly one `<h1>`: the screen title (in the first block or the navbar).
- No `vh`, `dvh`, `h-screen` or `min-h-screen`: use the device metrics.
- No arbitrary hex color classes; no inline `<script>` in screen sources; no `.eyebrow` when config `eyebrows` is false.
- No bare text inside layout elements (`div`, `section`, `ul`, `form` ...): wrap it in `span`, `p`, a heading, `label` or `button`. React Native renders text only inside `<Text>`.

## 9. Build and look

```bash
cd .superdesign/src && python3 ../tools/build.py all            # or names; --quiet for problems only
cd ../tools
STILL=1 TARGET=44 node render.js ../research/shots-a 390 ../tmp/02-alarms.html ../tmp/02-alarms--dark.html
STILL=1 TEXT_SCALE=1.3 node render.js ../research/shots-a 390 ../tmp/02-alarms.html
node proto_test.js ../tmp/02-alarms.html ../research/shots-a/02
```

Look at every PNG, every time: `render.js` prints `OK` or `CHECK` with docW, height, H1 count, broken images, icons, fonts, overflow (`wide`) and tap targets under 44 (`small`).

## 10. The anchor screen

The main session writes the main tab's root screen itself, before any track starts, light and dark, and iterates until it is the quality bar: every component from the spec in its best form, both contracts clean, targets and large text checked, `proto_test.js` passing. Tracks are told to match its spacing, density and polish and to reuse its blocks by name. A weak anchor multiplies across every screen.
