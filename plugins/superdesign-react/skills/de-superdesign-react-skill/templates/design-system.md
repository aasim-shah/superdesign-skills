# {Brand}: design system v1 ("{name}")

<!-- Copy to .superdesign/design-system.md. Worked example: examples/design-system.md.
     Write it before any page; every track reads it first. Tokens here are mirrored, value for value, in
     src/tokens.json (component classes in src/styles.css). Change both in the same edit, rebuild, then re-run contrast.py. -->

Source of truth for every Superdesign draft in project `{project id}`. Built from {the client's identity:
logo colors, mascots, photography, the live site}. The brief: {client's words}.

## 1. Product context
- **Who:** {company, what it sells, where, scale}.
- **The product:** {offer, prices, rules}.
- **How people buy:** {booking or checkout hand-off}.
- **Audience:** {segments, device, mood}.

### Journeys (every page is tagged with one)
1. **{Name}** · {start} → {end state}.

### Information architecture (new): routes become each page's meta.route
```
{Section}        /{route}        {purpose}
```

## 2. Color
| Token | Hex | Use · contrast |
|---|---|---|
| `{name-step}` | `#{hex}` | {role} ({ratio} on {ground}) |

Rules
- {Canvas and band order.}
- **On dark bands every text, link, eyebrow and icon is pure white.**
- `{cta token}` is the only fill that means "do this" (white text {ratio}:1, at least 4.5).
- {Accent limits, gradients allowed or not.}

## 3. Typography
{Font link, one job per family, body settings (size, line height, tracking, measure).}

| Role (tokens.json type) | Font | Phone | Desktop | Weight | LH | Tracking |
|---|---|---|---|---|---|---|
| H1 | {font} | {px} | {px} | {w} | {lh} | {em} |

{Case rules, the one signature typographic move, never justify.}

## 4. Space, grid, shape
{4px base, container, columns, gutters, section padding desktop/mobile, radius scale, shadows, borders.}

## 5. Brand devices
1. **{Device}**: {what it is, where it appears, how it moves, static state on the canvas}.

## 6. Components
- **Utility bar** (`components/UtilityBar.tsx`), **Header** (`Header.tsx`), **Mega menu** (`MegaMenu.tsx`),
  **Finder palette** (`FinderPalette.tsx`), **Buttons** (`.btn-*` in styles.css), **Cards**, **Forms**,
  **Footer** (`Footer.tsx`): {one line each, with sizes and states}.
- **Blocks** shared across pages (`src/blocks/`): {name: props}.

## 7. Motion
{Eases and durations, hero intro, scroll, hover, signature hooks (data-sig ...), Pause animation,
reduced motion, static canvas frames. Filled in during the motion phase with what shipped, with the
component that owns each hook.}

## 8. Accessibility and content
{WCAG 2.2 AA, one H1, focus, targets, alt text, voice, spelling, brand name spelling, PLACEHOLDER rule,
eyebrows on or off, reviewers as first name + last initial.}

## 9. Draft authoring and handoff contract
Pages are `src/pages/NN-slug.tsx` with a default export inside `<Layout>` and `export const meta = { title, route }`.
Every child of `<main>` is a `<Block name labelledBy>`; links are `<A id href>` with `#hash` placeholders; images are
`img('key')` and `brand('key')`; repeated items are arrays rendered with `.map` and `data-repeater` on the list; invented
copy is in `<Ph>`; tokens only (no hex); no browser globals, `Math.random()` or `Date` in render. Page ids start `pNN-`.
`build.mjs` renders, hydrates and inlines one HTML file per page; full-height import (`--width 1440 --height <measured>`;
390 for phone drafts). Never size with `vh`. Target app: {Next.js App Router | Vite + React Router}.
