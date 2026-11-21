# Parallel tracks

Phase 7: the remaining screens and states, built by up to five agents at once from one shared brief. Templates: `templates/TRACKS.md`, `templates/track-prompts.md`. A compact app (12 to 20 screens) is often faster with one author: tracks pay off from about 20 screens.

## Contents

1. Before launching
2. Splitting into tracks
3. The shared brief and short prompts
4. File ownership
5. Collecting the reports

## 1. Before launching

Tracks start only when these exist and are stable:

- `design-system.md`, `tokens.json`, every chrome partial and `head.html`, `CONTENT.md`, `asset-map.json`.
- The anchor screen, light and dark, passing both contracts, the target check and `proto_test.js`.
- `TRACKS.md` for this project, `titles.json` covering every screen, `links.json` covering every hash, `dark_pages` set.

## 2. Splitting into tracks

Group screens by flow so each track reads the same reference screens, and keep a screen with its states. Four to eight drafts per track; at most five tracks at once (the user's cap wins).

| Example track | Screens | Reads first |
|---|---|---|
| A Onboarding | welcome, permissions (asked, denied), first item, handover | home |
| B Core loop | create, edit, the sheet, confirmation, the in-use screen | home, detail |
| C Library | list, empty, search, filters sheet, detail | home |
| D Settings | settings, sub-pages, about, account | home, detail |
| E Paywall and states | paywall, locked feature, offline, error | home |

Launch every track of a round in one message. Forks inherit context; fresh agents get the folder path.

## 3. The shared brief and short prompts

Everything shared goes in `src/TRACKS.md` once: read order, the screen skeleton, the partials and their parameters, the handoff contract, assets and icons, the hash list, native and brand rules, the hooks, the build-render-test commands, the rules and the report format. Each track prompt is a few lines: track letter, screens with one or two lines each (fixed or scroll, which states), which screens to read, which block names to reuse.

## 4. File ownership

| Owner | Files |
|---|---|
| Each track | its own `src/pages/NN-*.html` only |
| Main session | partials (head, chrome, navkit, motion), tokens.json, tools, config, links.json, drafts.json, heights.json, design-system.md, CONTENT.md, TRACKS.md, PLAN.md, memory, every import |

- Tracks never import and never edit shared files. A track that needs a partial, token or class change says so in its report.
- When a rule changes mid-round, message the running tracks (SendMessage) in one line, then fix the finished screens yourself and add the rule to TRACKS.md.

## 5. Collecting the reports

Each report gives, per screen: file, fixed or scroll and its height, light and dark checked, one line "what it shows", flow, blocks used (and new names), placeholders invented, client questions, personal data used, partial or token changes wanted. The main session then copies every placeholder, question and personal-data item into PLAN.md, decides block names and partial changes once, rebuilds everything and runs QA (qa.md) before importing.
