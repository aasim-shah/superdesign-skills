# {App} screen design: audit and plan

{Date}

**The problem:** {one sentence: what the app makes hard today, with a number (taps to the core action, a rating, a drop-off)}.
**This plan** {one sentence: what the new screens do, on which canvas, in which tokens, and the cleaner path they create}.

<!-- PLAN.md at the project root, or .superdesign/PLAN.md when the root already has an unrelated PLAN.md (never
     overwrite it). Make a Claude Doc only when the user asks. Lead every section with its point and a number.
     Tables over paragraphs. Never name the agency. -->

## The new screens

Superdesign project: {project URL}. Tap-through starts at {preview URL of 01 · Home}.

| # | Screen | Flow | Kind | Dark | What it shows |
|---|---|---|---|---|---|
| 00 | [Design system]({preview url}) | All | board | in board | Tokens, type, components, states |
| 01 | [Home]({preview url}) | {Flow} | scroll | [dark]({url}) | {one line from the track report} |

## Critical issues

| Finding | Where | Fix |
|---|---|---|
| {Dead ends, lost data, permission asked too early, gated safety feature} | {screen} | {screen number that fixes it} |

## UX and navigation

| Finding | Fix |
|---|---|
| {Taps to the core action, tab structure, hidden features, onboarding length, empty states} | {the new path, with screen numbers} |

## Visual design and type

| Finding | Decision |
|---|---|
| {Type sizes against the platform scale, contrast in light and dark, mixed icon styles} | {the design-system decision} |

## Platform and accessibility

| Finding | Fix in the app build |
|---|---|
| {Targets under 44pt, fixed font sizes, unlabeled icon buttons, motion without Reduce Motion, safe areas, Android back} | {what the build does} |

## Strategy

Flows (every screen is tagged with one):
1. **{Name}** · {start} → {middle} → {end state}.
2. **{Name}** · ...

Navigation: {tabs; stacks under each tab; modals and sheets}. Full map: `.superdesign/design-system.md` section 1.

## Design system

"{Name}": `.superdesign/design-system.md`, `src/tokens.json` and the `00 · Design system` draft. {Two lines: colors in
both themes, type, devices, motion.}

## Feature specs (for the app build)

- **{Feature}**: {data source, behavior, native APIs involved (permissions, notifications, purchases), states, what must be confirmed}.

## Simulated in the drafts

<!-- Everything the canvas shows working that the app must actually build: scans, purchases, notifications. -->
- {Screen}: {what is simulated}.

## Open questions for {Client}

- [ ] {Question}

## Placeholder content

| Screen | Placeholder | Needs |
|---|---|---|
| {NN} | {invented value or string} | {who confirms it} |

## Personal data noted

{Real names, photos, reviews, contact details in research and drafts; consent status. "None" is a valid answer.}

## Sources

{App version and commit audited, device screenshots folder (`.superdesign/research/shots/`), store listing date, client documents.}
