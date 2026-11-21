# Track prompts

Short on purpose: the shared rules live in `src/TRACKS.md` (templates/TRACKS.md). Launch every track of a
round in one message, at most 5 at once (the user's cap wins if lower). Forks inherit context; fresh agents
need the folder path.

## Screens (no import)

```
You are track {X} of {N} building {App} app screens for the Superdesign canvas.
Read {abs path}/.superdesign/src/TRACKS.md first and follow it exactly.
Your screens (write only these files):
- src/pages/{NN-slug}.html → "{NN · Name}" ({route}). {fixed|scroll}. {One or two lines: what it shows, which
  flow it serves, where it leads.}
- src/pages/{NN-slug-empty}.html → "{NN · Name · Empty}". fixed. {The empty state of the screen above.}
Screens to read first: {01-home, NN-...}.
Reuse these blocks where they fit: {screen-header, item-list, settings-group, empty-state}.
Dark twins are built for: {list, from config dark_pages}; check them.
Report as TRACKS.md says. Do not import.
```

## Cross-cutting change (chrome, controls, motion): no import

```
Track {L}: {goal, quoting the user's words}.
You own: {files, e.g. src/partials/tabbar.html and src/partials/navkit.html}. Nobody else edits them this round.
{Spec of the change.}
Heights must not change: `node measure.js 390 ../tmp/*.html --min 844 --baseline ../src/heights.json`.
Verify with `node proto_test.js` on {three screens} and STILL=1 TARGET=44 renders of every screen; look at the PNGs.
Rebuild all with no PROBLEMS. DO NOT import.
Report briefly: what you changed where, verification results.
```

## When a rule changes mid-round

Message the running tracks (SendMessage) with the new rule in one line, then fix the screens that already
finished yourself. Add the rule to TRACKS.md so the next round starts with it.
