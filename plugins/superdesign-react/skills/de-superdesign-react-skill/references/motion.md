# Motion on the canvas

Phase 11. Asked as "give it gsap.com touches", "make it feel alive", "a wow effect". Two layers in `src/motion/`: a site-wide GSAP layer and a brand signature layer, started once after hydration by `components/Motion.tsx`. Test: `scripts/proto_test.js`. The app re-implements both as `useGSAP()` hooks inside the components that own the hooks (de-gsap-skill).

## Contents

1. The two layers
2. Non-negotiables
3. Motion and React
4. The site-wide layer
5. The signature layer
6. Pause animation
7. Verify and record

## 1. The two layers

| Layer | File | Owns |
|---|---|---|
| Site-wide | `motion/motion.ts` | Hero intro, heading line reveals, scroll reveals, count-ups, parallax, magnetic buttons, card lift, Flip for filters |
| Signature | `motion/signature.ts` (rename after the device) | The brand's own devices: bubbles that drift and pop, a cutout rising from a shape, a fill that tracks the scroll, a trail, pins that drop |

GSAP loads from jsDelivr, pinned to `config.json` `gsap` (core, ScrollTrigger, SplitText, Flip; all free), before the page script, because a draft is one HTML file and the CDN keeps it small. `config.json` `"motion": false` drops both layers and the head guard. The app imports GSAP from npm.

## 2. Non-negotiables

1. **Never left hidden.** Animate from a visible resting state where possible; hidden start states only after GSAP has loaded; a reveal-all runs at the end of the page; the head guard (`sd-pre`) gives up after 2.2s; `onerror` on each script shows the page as authored.
2. **Opacity, never visibility.** `autoAlpha` sets `visibility: hidden`, which removes links from the tab order. Reveal with opacity, and reveal whatever receives focus at once (`focusin`).
3. **Canvas frames are static.** When `innerHeight > 1600` (a full-height frame) the layers run a quick intro and leave every device in its resting place: no scroll reveals, no loops, no parallax. Thumbnails then show the finished page.
4. **Reduced motion gets nothing.** `prefers-reduced-motion: reduce` returns before any tween.
5. **Layout never moves.** Transforms, opacity and clip-path only. A heading whose line split changes its height by even 0.01px gets a fade instead. Count-ups start from a number with the same digit count. Page height after motion equals the frozen frame height.
6. **Loops can be stopped.** Anything that moves on its own for more than five seconds is registered with `sdLoop()` and obeys Pause animation (WCAG 2.2.2).

## 3. Motion and React

- The layers start in an effect, after hydration, and work on `data-*` hooks in the DOM. Components render the finished state; motion only animates towards it.
- SplitText and count-ups rewrite text nodes for a moment. Use them only on text React does not update (headings and numbers that come from constants, not state). An animated element whose text depends on state gets a fade.
- Never put GSAP inline styles on an element whose `style` prop React also sets.
- Components that need motion (filters) talk to the layer through globals the layer defines: `sdFlipState(elements)` before a state change and `sdFlipPlay(state)` in a layout effect after it (`useFilter` does this). Without the layer they do nothing.

## 4. The site-wide layer

| Moment | What | Timing |
|---|---|---|
| Load | Utility bar and header drop in; the H1 rises line by line from a mask; hero items stagger up; large hero images unmask from the bottom | `power3.out` and `expo.out`, 0.7 to 1.3s, stagger up to 0.5s total |
| Scroll | H2s split by line; leads, cards, list items fade up 32px (batched); counts run | ScrollTrigger `top 88%`, once |
| Hover | Magnetic `.btn-primary`, icons with `data-nudge` move 5px, cards lift 6px | 0.2 to 0.45s, pointer devices only |
| Filters | Flip glides cards to their new places | 0.6s |

Hooks: `data-count`, `data-parallax`, `data-reveal`, `data-skip`, `data-nudge`. Pinned or horizontal scroll sections are allowed on desktop only and never run on the canvas (they are motion-only layouts; measure still).

## 5. The signature layer

Pick two to four devices from design-system.md section 5 and give each a hook, a hero moment and a scroll moment. The template ships three:

| Hook | Hero | Scroll | Interaction |
|---|---|---|---|
| `[data-sig="rise"]` | rises into place | | |
| `.sticker` | slaps on with a rotation | | |
| `[data-sig-float] > *` (decorative, `aria-hidden`) | | drift forever (a loop: `sdLoop`) | |
| `[data-sig-trail] > *` | | appear in sequence when reached | |

Rename them after the brand (a pet salon used bubbles that pop on click, a dog rising from a tub, a bath that fills with the scroll, a paw trail). The authored markup is the finished state: items in a fill checklist render as done, and the layer removes that state only while animating.

## 6. Pause animation

`MotionToggle` in the utility bar: it sets `html.sd-still`, stores the choice in localStorage (`sd-motion:<prefix>`), relabels itself "Play animation" and dispatches `sd-motion`; the layer pauses every registered loop and finishes running entrances; CSS loops stop through `.sd-still .marquee { animation-play-state: paused }`. The head guard reads the stored choice before first paint. The button renders "Pause animation" on the server and corrects itself in an effect, so hydration matches.

## 7. Verify and record

- `proto_test.js` on the home page and two others: intro and settled screenshots, menu, palette, clicks, scroll to the end with nothing left hidden, Pause works, no console errors, and the canvas pass (full frame height, nothing hidden, same height).
- `measure.js --baseline ../src/heights.json` on every page before the push: motion must not change a height.
- Update design-system.md section 7 with what shipped: eases, durations, each hook and what it does. The handoff README lists the hooks and the component that owns each.
