# {App}: design system v1 ("{name}")

<!-- Copy to .superdesign/design-system.md. Write it before any screen; every track reads it first. Every token
     here is mirrored, value for value, in src/tokens.json. Change both in the same edit, rebuild, then re-run
     contrast.py and tokens_export.py. -->

Source of truth for every screen draft in project `{project id}`. Built from {the app's identity: icon, fonts,
colors, the current screens}. Platforms: {iOS | Android | both}. Device: {390 x 844}. The brief: {client's words}.

## 1. Product context
- **What the app does:** {one or two lines}.
- **Business model:** {free | subscription | one-time; never invent prices or trial terms here}.
- **Audience and context of use:** {who, when, one-handed, in a hurry, in the dark}.

### Flows (every screen is tagged with one)
1. **{Name}** · {start} → {end state}.

### Navigation map
```
Tabs        {Home} · {Library} · {Settings}
{Home}      → {Detail} (push) → {Edit} (sheet)
Modals      {Paywall}, {Onboarding}
```

## 2. Color
| Token | Light | Dark | Use · contrast |
|---|---|---|---|
| `bg` | `{primitive}` | `{primitive}` | screen background |
| `surface` | | | cards, cells, sheets |
| `fg` | | | text ({ratio} on bg, both themes) |
| `fg-muted` | | | secondary text ({ratio}) |
| `accent` / `on-accent` | | | the one primary action ({ratio}) |

Rules
- {Surface steps in dark instead of shadows; where primitives may appear (brand devices only).}
- `accent` is the only fill that means "do this". Destructive actions use `danger`, never the accent.

## 3. Typography
{Fonts bundled in the app (and the Google Fonts link the drafts use), one job per family.}

| Role (`.t-*`) | Font | Size / line (pt) | Weight | Tracking | Platform style |
|---|---|---|---|---|---|
| large-title | {font} | 34 / 41 | 700 | {pt} | Large Title |

{Numbers tabular; sentence case; text scales with the user's setting.}

## 4. Space, grid, shape
{4pt grid, 16pt margins, list insets, radius scale, shadows (light), surface steps (dark), safe areas.}

## 5. Brand devices
1. **{Device}**: {what it is, where it appears, how it moves, its still state}.

## 6. Components
- **Navigation**: top bar (large title on tab roots, inline with back on pushed screens), tab bar ({n} tabs).
- **Lists**: grouped cells, rows with value, rows with switch, swipe actions.
- **Buttons**: primary, secondary, plain, destructive; sizes and states.
- **Controls**: switch, segmented control, chips, fields, steppers.
- **Overlays**: sheets (detents), alerts, toasts.
- **States**: empty, loading, error, offline, permission.
{One line each with sizes and states; Android differences.}

## 7. Motion
{Push, back, tab, sheet, press, success; durations and easing; haptics; Reduce Motion. Filled in with what shipped,
with the React Native mapping.}

## 8. Accessibility and content
{44pt targets (48dp), text that scales, labels on icon buttons, headings, contrast in both themes, Reduce Motion,
voice, spelling, string length per locale, PLACEHOLDER rule, eyebrows off.}

## 9. Draft authoring and handoff contract
One complete document per screen; `<body>` without a class; one root `<div id="{{prefix}}-root" class="screen"
data-screen="fixed|scroll">`; chrome from partials (topbar, navbar, tabbar, homebar); unique `id` on every `<a>`;
links `#hash`, `https://`, `mailto:` or `tel:`; images only from uploaded URLs; tokens only (semantic classes);
type only through `.t-*` roles; text only inside text elements; control state in ARIA; behavior through `data-*`
hooks. Every child of `<main>` is a `<section data-block="...">` with `aria-labelledby`. Screen classes prefixed
`pNN-`. Width 390; fixed screens exactly {844}; never `vh`. Handoff: React Native / Expo Router.
