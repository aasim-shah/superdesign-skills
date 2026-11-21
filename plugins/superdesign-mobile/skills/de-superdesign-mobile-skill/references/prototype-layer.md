# Prototype layer: linked screens and working controls

Phase 10. Asked as "make the app clickable", "the tabs should work", "the sheet should open". Tools: `scripts/links.py` (run by `build.py`), `templates/partials/navkit.html`, `scripts/proto_test.js`. Template: `templates/links.example.json`.

## Contents

1. Linked screens
2. Tabs, back and states
3. Controls
4. Sheets
5. Toasts
6. Verify

## 1. Linked screens

Screens and partials keep readable placeholders (`href="#home"`). At build time `links.py` rewrites each `<a href="#...">` whose target screen has a draft to `https://p.superdesign.dev/draft/<id>`, so links go live as soon as the target is imported: rebuild and `update` after each round of creates.

| links.json key | Maps | Example |
|---|---|---|
| `hash` | hash to screen | `"#library": "03-library"` |
| `prefix` | hash prefix to screen | `"#item-": "02-detail"` (every row opens the one detail screen) |
| `page` | per-screen overrides | `"02-detail": {"#back": "01-home"}` |
| `id` | one anchor by id; `null` keeps the hash on purpose (never a dead end) | `"nav-action": null` |
| `buttons` | a `<button>` by its label | `"07-new": {"Save": "08-saved"}` |

A dark twin links to the dark twin of its target when that draft exists. A link to the screen it sits on keeps its hash when that id exists on the screen; chrome links (`tab-`, `nav-`, `bar-`, `hdr-` ...) to the current screen get `aria-current="page"`. Never add `target`: the preview iframe blocks top navigation. `python3 links.py --src ../src --built ../tmp` lists hashes that resolve to no draft and exits 1 (add `--allow-dead` while drafts are still missing).

## 2. Tabs, back and states

- Tab bar: each tab is a link to the tab's root screen. `{{> tabbar active="library"}}` marks the active tab on sub-screens too; navkit sets `aria-current="page"` from `data-active`.
- Back: `{{> navbar back="#home"}}`; map `#back` per screen in links.json `page` when the previous screen differs.
- States: a button that leads to a state links to that state's screen (`#home-empty`, `#permission-denied`). Every flow ends somewhere real: the confirmation, the populated list, the screen the user started from.
- Tap every flow end to end in the live preview: launch to the core action to its confirmation, each tab, each back.

## 3. Controls

Controls work on the screen, so reviewers can feel the state change. State lives in ARIA, which the CSS styles and the handoff maps to props.

| Hook | Behavior | React Native |
|---|---|---|
| `button.switch[role="switch"][aria-checked]` | Tap toggles `aria-checked` | `<Switch value onValueChange>` |
| `[data-segment] > button[aria-pressed]` | One pressed at a time | Segmented control, `selectedIndex` |
| `[data-chips] > button[aria-pressed]` | Each toggles | Chip state in an array |
| `[data-tabbar][data-active]` | Marks the current tab | Tabs layout |

## 4. Sheets

```html
<button type="button" class="btn-primary" data-sheet-open="p01-new">New item</button>
...
<div id="p01-new" class="sheet-wrap" data-sheet data-open="false" role="dialog" aria-modal="true" aria-labelledby="p01-new-title">
  <div class="scrim" data-sheet-close></div>
  <div class="sheet"><span class="grabber" aria-hidden="true"></span><h2 id="p01-new-title" class="t-title3">New item</h2> ... </div>
</div>
```

- Closed sheets are `display: none`, so they never change the screen's height. Open sheets are fixed overlays at the bottom of the viewport (a tall frame's bottom on the canvas: draw a sheet state on a fixed screen).
- Opening moves focus into the sheet and traps it; Esc, the scrim and any `[data-sheet-close]` close it and return focus.
- The sheet's own screen (`06-home-sheet`) is the base screen with `data-open="true"`: that is what the canvas thumbnail shows.
- The sheet lives inside the root, after `<main>`; it is a screen-level overlay, not a block.

## 5. Toasts

`data-toast="Saved"` on any button shows a `role="status"` toast above the tab bar for 2.4s. In the app: a toast library or an inline status, announced to screen readers.

## 6. Verify

```bash
node proto_test.js ../tmp/01-home.html ../research/shots-proto/01
node proto_test.js ../tmp/04-settings.html ../research/shots-proto/04 --click '#p04-row-sound'
```

In a 390 x 844 touch viewport it checks the current tab, taps every switch and segment, opens every sheet (focus inside, Esc closes, the scrim closes), shows a toast, runs each `--click`, scrolls, checks nothing in `<main>` is hidden and the height did not move, then reloads at the full frame height as the canvas does. Any script error fails it. Then tap a tab and a row in the live preview and confirm the frame lands on the target screen.
