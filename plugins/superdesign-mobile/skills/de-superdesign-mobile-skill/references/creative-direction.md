# Creative direction: the anchor screens

Read this before the design system (phase 4) and again before the anchor screen (phase 6). It says what the client approves first and what a screen looks like when it reads as designed rather than generated.

## 1. What the client approves first

The first approval is two or three real screens of the main flow, not a board: the screen people see most (home or today), the moment that matters most (for an alarm app, the ringing screen), and one setup screen. They carry the client's real copy and data shapes, in both themes, imported and sent as live preview links. The `00 · Design system` board follows from the approved screens, as the reference for tracks.

A palette, a token board or a component sheet shown on its own reads as "dummy samples": clients judge screens, so they need screens to judge.

## 2. The screen recipe

| Part | What it is |
|---|---|
| One hero element | Each screen has one thing that is clearly the largest: a time, a number, a photo, a map. Everything else steps back in size and weight |
| Few elements | One primary action, one secondary at most. Group the rest; a screen of ten equal cards reads as generated |
| Color in one place | Paper or a neutral background, ink text, one accent for the primary action and the active state. Atmosphere comes from one large element (a photo, a single gradient behind the hero element), never from a color per card or section |
| Type that carries | A display face for the hero element at a large size; the text face for everything else; sentence case; no small uppercase label above every group |
| Depth over borders | Separate groups with space and one surface step; hairlines only where a list needs them; shadows rare |
| Real content | The client's real names for things, real times, real counts; invented values in `data-placeholder` |

## 3. Self-review before showing a screen

Look at the still and answer each question. Every "yes" is a fix first.

| Question | The fix |
|---|---|
| Are there more than three cards of the same shape stacked on one screen? | Turn them into a list, or promote one and drop the rest a level |
| Does every group open with a small uppercase label? | Drop the labels; let the hero element and spacing group things |
| Is there more than one accent, or a colored background per section? | Neutral background, one accent |
| Is the hero element smaller than the navigation bar title? | Make it the largest thing on the screen |
| Would the screen look the same in any other app? | Bring in the brand device (the clock, the mark, the photo) where it matters most |

## 4. Motion

Screens are static on load (thumbnails must show the finished screen). Transitions run after a tap, slow and eased (`expo.out`, 0.45 to 0.6s), never bouncy: push and back slide, sheets rise, the hero element can scale from its source on the previous screen. Record each in the handoff as its Reanimated equivalent (`references/motion.md`).
