# Motion on app screens

Phase 11. App motion explains navigation and confirms actions; it is short, interruptible and never decorative for long. On the canvas it must never show up half-done. Partials: `templates/partials/motion.html` (transitions), the sheet, press and switch transitions in `head.html`, the navigation flag in `navkit.html`.

## Contents

1. Rules
2. What moves, and when
3. The React Native mapping
4. Verify and record

## 1. Rules

1. **Static on load.** A screen loads finished: no entrance animation on a fresh load, so every canvas thumbnail is the finished screen.
2. **Motion follows a tap.** navkit records how the user arrived (push, back, tab) when they tap a link to another draft; `motion.html` plays that one transition on the next screen and clears the flag.
3. **Reduced motion gets nothing.** `prefers-reduced-motion: reduce` skips the transitions and the sheet slide (the CSS checks it too).
4. **Layout never moves.** Transforms and opacity only; a screen's height after motion equals its frame height.
5. **No loops.** Nothing moves on its own for more than five seconds. If a screen needs a live element (a ringing alarm, a recording meter), it has a stop control and it rests in a meaningful still frame for the thumbnail.

## 2. What moves, and when

| Moment | Draft | Timing |
|---|---|---|
| Push (a row, a button) | the new screen's `<main>` slides in from 36pt right and fades from 0.35 | 320ms, `cubic-bezier(.2,.8,.2,1)` |
| Back (`#nav-back`) | slides in from 36pt left | 320ms |
| Tab | cross-fade | 180ms |
| Sheet open | the sheet rises from the bottom, the scrim fades in | 320ms and 240ms |
| Press | buttons scale to 0.97 while pressed | 150ms |
| Switch | the thumb slides, the track recolors | 200ms |
| Toast | fades in, holds 2.4s, fades out | 200ms |

## 3. The React Native mapping

| Draft | App |
|---|---|
| Push and back | The native stack's default transition (expo-router Stack); no custom code |
| Tab cross-fade | Tabs with `animation: 'fade'` (or none, per platform convention) |
| Sheet | `presentation: 'formSheet'` with detents, or @gorhom/bottom-sheet when it needs custom content |
| Press 0.97 | Pressable + Reanimated `withTiming(0.97, { duration: 150 })`, or the platform's own highlight |
| Switch | the native `Switch` |
| Toast | a toast library with an accessibility announcement |
| Haptics (not drawn) | note them in design-system.md section 7: success on save, warning on destructive confirm (expo-haptics) |
| Reduce Motion | `AccessibilityInfo.isReduceMotionEnabled()` / Reanimated `useReducedMotion()` turns custom motion off |

## 4. Verify and record

- `proto_test.js` on every interactive screen: controls, sheets, toasts, nothing hidden, same height, the canvas pass.
- `measure.js --baseline ../src/heights.json` before every push: motion must not change a height.
- Update design-system.md section 7 with what shipped: each moment, duration, easing and its app mapping.
