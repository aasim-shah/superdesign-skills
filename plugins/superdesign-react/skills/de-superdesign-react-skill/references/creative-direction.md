# Creative direction: the anchor page

Read this before the design system (phase 4) and again before the anchor page (phase 6). It says what the first thing the client sees is, how it is composed, and how it moves. Template parts: `templates/src/components/Cutouts.tsx` (Phone, Callout, Leads). Worked references, broken down layer by layer: `references/inspiration.md`.

## Contents

1. What the client approves first
2. The composition recipe
3. The color recipe
4. The motion recipe
5. Self-review before showing a page
6. Making the parts

## 0. References inform, they do not repeat

The references in `inspiration.md` and the approved example in `examples/walkaway-home/` show the level, not the look. For each new client:

- Choose the composition from the product (`inspiration.md` section 1): an object, an app, a service in the world, a platform, a dashboard.
- Take the panel color, the accent and the display face from the client's brand and the audit, never from an example.
- Keep the method (product first, one broken edge, annotations on real parts, one accent, one quiet section) and the motion (`templates/src/motion/product.ts`).
- If a draft could pass for one of the references with the logo swapped, change the composition before showing it.

## 1. What the client approves first

The first approval is a real page, not a board. In order:

1. **The anchor page (`01-home`)** with the client's real copy and real product imagery, imported and sent as a live preview link (`https://p.superdesign.dev/draft/<id>`) so the client sees the motion. The canvas thumbnail is static; say so in the message.
2. **Then** the tokens and the `00 · Design system` board, written from the approved page, as the reference for tracks.

A palette, a token board or a type specimen shown on its own reads as "dummy samples": clients judge the page, so they need a page to judge.

## 2. The composition recipe

A hero and every second section have these parts:

| Part | What it is | How |
|---|---|---|
| The product | The real thing, cut out: app screenshots in a device frame, a product photo with a transparent background, or the object drawn as shaded SVG | `Phone` with an `img('screen-…')` key; product photos through `images.py` and `upload.py`; shaded SVG with gradient stops by class |
| A panel | One rounded panel inset 12 to 20px from the page edge (`rounded-panel`, 32 to 40px radius) in the one dark color | The panel is the frame the product breaks |
| A broken edge | The product crosses the panel's top or bottom edge; objects on cards cross the card's top edge (`-top-[72px]`) | Absolute positioning in a fixed-size stage; the panel never clips (`overflow` stays visible) |
| Annotations | 2 to 4 glass callouts, each joined by a hairline leader line to a dot on the real UI element it names; real product facts as text | `Callout` + `Leads`; dot positions from screenshot fractions (section 6) |
| Depth | 1 to 3 floating objects around the product, one slightly blurred (`blur-[1.5px]`) as if out of focus; a soft halo behind a dark product | Decorative, `aria-hidden` |
| Copy | Headline, one sentence, one primary action and one text link, from the client's real sources | `content/*.ts`; invented copy only in `<Ph>` |

Between product sections, give one section to quiet type on paper (a statement, privacy, a quote): contrast between rich and calm is what makes the rich sections read as premium.

## 3. The color recipe

- Paper (an off-white) as the page, ink for text, **one** dark panel color, **one** accent.
- The accent appears on the primary action, the leader-line dots and at most one more small thing per screen.
- Atmosphere comes from the product and from photography, never from several flat gradients or a color per section. A coherent photograph (a dusk sky, a room at dawn) may carry many hues; CSS bands may not.
- Every pair is declared and checked (`contrast.py`). If the brand's bright color fails as text, it stays graphics-only and a darker step carries text and buttons.

## 4. The motion recipe

The template already implements this table in `motion/product.ts`: add the hooks (`data-sig-stage`, `data-tilt`, `data-sig-halo`, `data-thing`, `data-lead`, `data-dot`, `data-callout`, `data-sig-rise`, `data-sig-lean`, `data-sig="cards"`, `data-sig-drift`, `data-sig-seam`; `data-edge` comes with `Edge`) and the motion follows. Brand-specific devices stay in `motion/signature.ts`.

| Device | Motion | Settings |
|---|---|---|
| Scroll | Lenis smooth scroll, ScrollTrigger listening | config `"lenis": "1.3.26"`; `lerp: 0.085`; `lenis.on('scroll', ScrollTrigger.update)`; drive it from `gsap.ticker` with `lagSmoothing(0)` |
| Hero product | Rises out of the panel on load | `y: 180 → 0`, `expo.out`, 1.4 to 1.8s; halo `scale 0.55 → 1` over 2.2s |
| Leader lines | Draw, then their callouts slide in | DrawSVG `0% → 100%`, 0.9s, stagger 0.14; callouts `x: 28 → 0` from 0.35s later |
| Dots | Breathe | `scale 1 → 1.7`, yoyo, 1.6s, through `sdLoop()` |
| Objects | Drift; follow the pointer at different depths | `y ±6 to 14`, `rotation ±4`, 3.5 to 6s yoyo; `gsap.quickTo(x)` with growing distance per object |
| Product tilt | Follows a fine pointer | `rotationX/Y` at most 7 to 9 degrees, `transformPerspective: 1200` |
| Stage | Climbs slower than the page | `y: -70`, scrubbed across the hero |
| Card objects | Drop onto their cards on first view | `y: -70, rotation: -14 → 0`, `power3.out`, stagger 0.09, `once: true` |
| Leaving | Links to another draft fade the page | `opacity 0, y -16`, 0.45s, then `location.assign` |

Everything is slow and eased (`expo.out`, `power3.out`, `sine.inOut`); nothing bounces. The markup is the finished state, and canvas frames (`innerHeight > 1600`) stay static.

## 5. Self-review before showing a page

Look at the 1440 still and answer each question. Every "yes" is a fix before the client sees it.

| Question | The fix |
|---|---|
| Is there a section where only type and boxes appear, with no product or image, other than the one quiet section? | Put the product in it, or make it the quiet section |
| Does every section open with a small uppercase label? | Drop the labels; one at most, in the hero |
| Is a section a grid of equal bordered cards with an icon in a colored circle? | Give each card its object breaking the top edge, or turn it into a typographic list |
| Is there more than one accent color, or a gradient per section? | Back to paper, ink, one panel color, one accent |
| Is the product a drawing where real screenshots or photos exist? | Use the real ones |
| Does a dark screenshot vanish into a dark panel? | Add the halo and the rim (section 6) |
| Does a callout cover the thing it points at? | Move it beside the product and draw a leader line |

## 6. Making the parts

- **Real screenshots**: store or marketing screenshots of the client's app are the best product imagery. Convert to WebP 660px wide, upload as content keys, use the client's own alt text. Leave out any screenshot that shows a real person's name or data.
- **Leader-line coordinates**: put the product in a fixed-size stage (for example 640 x 880). For a frame of width `W` with 10px padding, the screen image is `W - 20` wide and `(W - 20) * h / w` tall. A dot on a UI element at fraction `f` of the screenshot's height sits at `y = top + 10 + f * imageHeight`. Read `f` from the screenshot itself.
- **Dots**: accent fill with a 2px white stroke, on a translucent accent ring. Pure white dots disappear on light screens.
- **Dark product on a dark panel**: a radial halo behind it (accent at 60% fading out) and a 1.5px inner white rim at 22%.
- **Shaded SVG objects**: gradient stops get their color from classes in `styles.css` (`.st-white { stop-color: theme('colors.white') }`), so components keep no hex. Give every gradient id a `useId()` suffix: the same object twice on a page otherwise fails the duplicate-id check.
- **Notched corners**: `NotchCard` cuts a quarter-circle bite from a card's lower right corner (a CSS mask) and seats a round action in it, flush with the outer edges; the button's size is `2 * (notch - gap) / (1 + √2)`, so the gap stays even. Use it for plan cards and the corner of a bento of photographs. The joints where the bite meets the straight edges stay crisp; for rounded joints draw the card as an SVG path instead.
- **Split fields and shaped edges**: `components/Sections.tsx` has `Split` (two color fields, straight or slanted seam, an object across it) and `Edge` (tilt, zigzag, wave, curve or blob between two sections, drawn in the neighbor's color). See `inspiration.md` sections 8 and 9 for when each fits.
- **Typographic cutout**: a large number or word cut out of a dark panel with an SVG `<mask>` (white rect, black `<text>`), with a gradient or photograph showing through.
- **Pinned or scrubbed copy**: move it out (`y`) instead of fading it to 0. Content at opacity below 0.05 after scrolling fails `proto_test.js`.
- **Tap targets**: text links and footer links get `inline-flex min-h-11 items-center` (and `min-w-11` for short words) to pass `TARGET=44`.
