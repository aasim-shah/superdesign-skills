# Example: WalkAway home (a reference, not a template)

An approved anchor page for an alarm app, made with this skill after four rejected versions. Read it to see the level and how the parts fit together. Do not reuse its look: its navy panels, single orange, Fraunces headlines, phone-in-panel hero and five object cards fit this product and this client. Another product gets its own composition, chosen with `references/inspiration.md` section 1 and `references/creative-direction.md`.

What carries over to every project is the method and the motion. The motion is already generalized in the template: `templates/src/motion/product.ts` (hooks listed at its top).

## Screens

| File | Shows |
|---|---|
| `shots/hero.webp` | The night panel inset in the paper page; real ringing screenshot in a phone frame breaking the panel's top edge; warm halo; three glass callouts with leader lines to the time, the scan button and the emergency stop; QR stickers and an NFC tag around it, one blurred |
| `shots/cards.webp` | Five challenge cards, each with a shaded object (QR sticker, NFC tag, mug, kettlebell, microphone) breaking the top edge; the first card tinted |
| `shots/journey.webp` | A stone panel; the alarm-list phone leaning out of its top edge; four times in a grid |
| `shots/strict.webp` | A second night panel; the Strict Mode phone rising out of its bottom edge; two callouts on its toggles |
| `shots/full.webp` | The whole page at half size, to see the rhythm: rich panel, cards on paper, panel, panel, quiet text, panel |
| `shots/phone-hero.webp` | The hero at 390: copy first, the phone below breaking the panel's bottom edge, no callouts |

## Source

| File | What to learn from it |
|---|---|
| `src/pages/01-home.tsx` | The stage (a fixed 640 x 880 box) that lines up phone, leader lines and callouts; how the phone layout drops the stage; panels as `rounded-panel` blocks inset with `px-3 md:px-5` |
| `src/components/Product.tsx` | The phone frame, the callout and five shaded SVG objects (gradient stops by class, `useId()` ids) |
| `src/components/Art.tsx` | The lens used in the quiet privacy section |
| `src/motion/signature.ts` | The page's motion as first written; `templates/src/motion/product.ts` is the generalized version to use |
| `src/content/home.ts` | Copy taken from the client's live site and app, nothing invented |
| `src/tokens.json`, `src/styles-additions.css` | Paper, ink, stone, one accent, one night panel color; the device styles (`.halo`, `.phone-rim`, `.field-line`, gradient stop classes) |

## The motion, as the client saw it

| Moment | What happens |
|---|---|
| Load | Smooth scroll starts (Lenis). The halo opens, the phone rises out of the panel, the objects arrive and start drifting, the leader lines draw, the callouts slide in, the dots breathe |
| Pointer | The phone tilts a few degrees towards the pointer; each object follows a little further than the last |
| Scroll | The hero stage climbs slower than the page; the card objects drop onto their cards; the journey phone turns upright; the Strict Mode phone rises out of its panel and its leader lines draw |
| Leaving | A link to another draft fades the page out before it navigates |
| Canvas and reduced motion | Everything rests in its finished place; nothing moves |

Not portable as is: the asset keys (`screen-ringing` and others) and the brand mark belong to the client's Superdesign project.
