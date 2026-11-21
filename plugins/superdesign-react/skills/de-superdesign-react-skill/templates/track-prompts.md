# Track prompts

Short on purpose: the shared rules live in `src/TRACKS.md` (templates/TRACKS.md). Launch every track of a
round in one message, at most 5 at once (the user's cap wins if lower). Forks inherit context; fresh agents
need the folder path.

## Round 1: new pages (no import)

```
You are track {X} of {N} building {Brand} Superdesign drafts in React.
Read {abs path}/.superdesign/src/TRACKS.md first and follow it exactly.
Your pages (write only these files):
- src/pages/{NN-slug}.tsx → "{NN · Name}" (route {/route}). {One or two lines: what the page must contain,
  which journey it serves, which existing page to borrow from.} Desktop.
- src/pages/{NN-slug}.tsx → "{NN · Name}" (route {/route}). {...} Desktop.
Closest existing pages to read: {01-home, NN-...}.
Reuse these blocks where they fit: {hero, cards, steps, faq, cta-band; src/blocks/PriceFinder}.
Report as TRACKS.md says. Do not import.
```

## Phone drafts (no import)

```
You are track M building the {Brand} phone drafts at 390px. Read .../src/TRACKS.md.
Pages: src/pages/{NN-mobile-home}.tsx (the phone version of 01-home: same Block names, re-composed for a thumb:
a dock of the two main actions under the hero, snap rails instead of grids, one review),
src/pages/{NN-mobile-menu}.tsx (the open menu as a full page, meta.route null). Render and measure at 390 only
(STILL=1 node render.js <dir> 390 ...; height.js 390). Phones never use a tall window. Report as TRACKS.md says.
```

## Cross-cutting layer (motion, links, chrome): no import

```
Track {L}: {goal, quoting the user's words}.
You own: {files, e.g. src/motion/signature.ts and src/components/Header.tsx}. Track {K} owns {files};
do not touch them. If you must edit a tool, re-read it right before editing.
{Spec of the layer.}
Heights must not change: overlays, transforms, opacity and clip-path only. Check every page with
`node measure.js 1440 ../tmp/*.html --baseline ../src/heights.json` (and 390 for phone drafts).
Verify with `node proto_test.js ../tmp/{page}.html ../research/shots-{L}/{page}` on {three pages} and look at
the screenshots. Rebuild all with no PROBLEMS and no console errors.
DO NOT import: the main session pushes everything once every track is done.
Report briefly: what you did where, pages skipped, verification results.
```

## When a rule changes mid-round

Message the running tracks (SendMessage) with the new rule in one line, then fix the pages that already
finished yourself. Add the rule to TRACKS.md so the next round starts with it.
