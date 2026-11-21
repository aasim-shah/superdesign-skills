# Design system: spec, tokens, contrast, board

Phase 4, and phase 12 for the board. One source of truth in two mirrored places: the written spec (`.superdesign/design-system.md`) and the token file (`src/tokens.json`), with component classes in `src/styles.css`. Tools: `scripts/contrast.py`. Templates: `templates/design-system.md`, `templates/src/tokens.json`, `templates/src/styles.css`, `templates/contrast-pairs.example.txt`. Worked example: `examples/design-system.md`.

## Contents

1. The spec: nine sections
2. tokens.json and styles.css
3. Contrast, every pair
4. Brand rules that ship by default
5. The 00 design-system board
6. Optional: a Design System artifact

## 1. The spec: nine sections

Tracks read it first, so write it before any page.

| # | Section | Contents |
|---|---|---|
| 1 | Product context | Who, the product and its prices, how people buy, audience; journeys; the new IA as a tree of routes |
| 2 | Color | Token table (token, hex, use and contrast) and the rules |
| 3 | Typography | Font link, one job per family, body settings, role table (phone, desktop, weight, line height, tracking), case and emphasis rules |
| 4 | Space, grid, shape | 4px base, container, 12 columns, section padding, radius scale, the signature shape, shadows tinted with the dark color, borders |
| 5 | Brand devices | 5 to 9 devices that make it unmistakable, each with its static canvas state |
| 6 | Components | Utility bar, header, mega menu, finder palette, buttons, cards, special widgets, forms, footer: each names its component file |
| 7 | Motion | Eases, hero, scroll, hover, signature hooks, Pause animation, reduced motion, static canvas (filled in after the motion phase) |
| 8 | Accessibility and content | WCAG 2.2 AA, one H1, targets, alt text, voice, spelling, brand-name spelling, PLACEHOLDER rule |
| 9 | Authoring and handoff contract | The draft contract plus the React handoff contract (references/handoff-contract.md) |

Decisions in the spec answer audit findings: the plan's "Visual design and typography" table has a decision column that points here.

## 2. tokens.json and styles.css

`tokens.json` is the only place tokens exist. `build.mjs` turns it into the Tailwind theme and the type-role classes; `contrast.py` reads its colors; the app reuses it unchanged.

| Key | Holds | Becomes |
|---|---|---|
| `fonts` | `href` (Google Fonts, only the weights the spec uses), then families per role (`display`, `sans`) | `<link>` tags and `font-display`, `font-sans` |
| `colors` | Primitives named by hue and step (`ink-900`, `brand-600`); roles stay in the spec | `bg-ink-900`, `text-brand-700` ... |
| `radius`, `shadow`, `maxWidth` | The shape scale | `rounded-card`, `shadow-md`, `max-w-site` |
| `type` | Roles (`body`, `display-xl`, `h1` to `h4`, `lead`, `stat`): font, weight, `size: [phone, desktop]`, `lh`, `track`, `color`, `tabular` | `.h1` ... classes in the components layer, desktop size from `breakpoint` up; `body` styles the body |

`styles.css` holds base rules and component classes (`.wrap .btn .btn-primary .btn-outline .btn-light .btn-ghost-dark .btn-sm .chip .card .link .field .label .hint .nav-btn .mm-* .kbd`, the `.on-dark` overrides) written with token utilities and `theme('colors.x')`. Un-layered rules are for signature shapes and devices only, and never set `position`, `display` or spacing (an un-layered rule beats utilities).

- Pages use these classes and token utilities. `check.py` warns on hex in a page (`bg-[#FFFBEF]`, `'#123456'`): add a token instead, or record why.
- Write class names in full. Tailwind scans `src/**/*.{ts,tsx}` for complete class strings; `bg-${tone}` never reaches the stylesheet. Map props to full strings (`{ dark: 'bg-ink-900', light: 'bg-white' }[tone]`).
- Change a token in the spec and `tokens.json` in the same edit, rebuild, and re-run `contrast.py`.

## 3. Contrast, every pair

List every text and background pair the spec allows, with its use, and check it against the tokens:

```bash
python3 contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt --json-out ../src/contrast-pairs.json
```

| Use | Minimum | Typical pairs |
|---|---|---|
| `text` | 4.5:1 | body, muted, links, button labels, small accent text |
| `large` | 3:1 | display emphasis 24px+ (or 18.66px+ bold) |
| `ui` | 3:1 | input borders, icons that carry meaning, focus rings |
| `decorative` | none | recorded so the list is complete |

The check confirms every ratio in the spec and catches the quiet failures: gold review stars on white at about 2:1 are fine as decoration beside a text label, a failure if the stars carry the rating alone. If the site has a dark theme, add `"semantic": {"light": {...}, "dark": {...}}` to tokens.json and pairs that name semantic tokens are checked in both themes.

## 4. Brand rules that ship by default

| Rule | Why |
|---|---|
| On dark bands every text, link, eyebrow and icon is pure white (`on-dark text-white` on the block) | Brand-colored icons and labels on dark looked off to two clients and fail contrast more often than not |
| One CTA color, white text at 4.5:1 or better; secondary actions are outlines | When the brand color fails (a hot pink at 3.5:1), use its darker step for buttons and keep the bright one for graphics |
| Brand-bright colors as text only at display sizes | Small bright text uses the darker step |
| No eyebrows by default | House rule. If the client keeps them, `.eyebrow` only, white on dark, listed in the handoff |
| Never name the agency in deliverables, bylines, footers or page copy | `forbidden` in config.json includes the agency name, so the check fails if it slips in |

These are house rules, not WCAG requirements; the contrast minimums above are the WCAG part.

## 5. The 00 design-system board

`pages/00-design-system.tsx`, title `00 · Design system`, a full-height draft that imports `tokens.json` and the real components, so it can never drift: cover, color (swatches from the token file), typography (each role at its sizes), space, radius and shadow, brand devices (each in its resting state), components (buttons, cards, chips, fields, header, palette), motion and accessibility. Swatch colors come from the token file as inline styles, so no class is built from a string. It is listed in config `reference_pages`, so the handoff checks and the block inventory skip it.

Tally the font sizes the pages actually use before finishing the board (`grep -oh 'text-\[[0-9]*px\]' src/pages/*.tsx | sort | uniq -c`) and list off-scale sizes to snap in the app build.

## 6. Optional: a Design System artifact

When the user asks for the design system "the way designers work", publish one from the claude.ai Design System artifact type (Artifact `quickstart` with intent `other` names it) and read the type's own instructions before writing. What designers expect: primitives plus semantic tokens with per-mode aliases, a usage note on every token naming its grounds and contrast (keep failing pairs exact and flagged), the type scale for phone and desktop, real font files, logos as uploads, short brand-book sections and a cover drawn from a brand device. Offer components as a follow-up.
