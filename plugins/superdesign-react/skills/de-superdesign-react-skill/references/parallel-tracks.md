# Parallel tracks

Phase 7: the remaining pages, built by up to five agents at once from one shared brief. Templates: `templates/TRACKS.md`, `templates/track-prompts.md`. On a 30-page site this ran as five tracks of four to six pages, then a round for the board and the phone drafts: 30 drafts in a day.

## Contents

1. Before launching
2. Splitting into tracks
3. The shared brief and short prompts
4. File ownership
5. Collecting the reports
6. Later rounds

## 1. Before launching

Tracks start only when these exist and are stable, because every track reads them and none may change them:

- `design-system.md`, `tokens.json`, `styles.css`, every chrome component, `content/site.ts`, `asset-map.json` (all images uploaded).
- `pages/01-home.tsx`, the anchor page, finished and passing both contracts with no console errors.
- `TRACKS.md` written for this project, `titles.json` covering every page, `links.json` covering every hash.

## 2. Splitting into tracks

Group pages by journey so each track reads the same reference pages. Four to six pages per track; at most five tracks at once (the user's cap wins).

| Example track | Pages | Reads first |
|---|---|---|
| A Pamper and Join | 02 services, 03 memberships, 04 find a salon, 10 book a visit | home |
| B Location sub-site | 05 location home, 06 services and pricing, 07 memberships, 08 policies, 09 coming soon | home, services |
| C Own | 12 franchise, 13 business model, 14 leadership, 15 inquiry, 16 inquiry received | home franchise band |
| D Company | 11 about, 17 training, 18 products, 19 software, 20 careers, 21 contact | home, franchise |
| E Help and content | 22 FAQ, 23 tips, 24 tip article, 25 legal, 26 search and 404 | home, services |
| Round 2 | 00 board, 27 phone home, 28 phone location, 29 phone menu (390) | home, location, design-system.md |

Launch every track of a round in one message. Forks inherit context; fresh agents get the folder path.

## 3. The shared brief and short prompts

Everything shared goes in `src/TRACKS.md` once: read order, page skeleton, the runtime, the handoff contract, assets and icons, the hash list for links, brand rules, motion hooks, the build-render-measure commands, the rules and the report format. Each track prompt is then a few lines: track letter, pages with one or two lines each, which existing pages to read, which block names to reuse. A rule written once in the brief is followed by every track; a rule repeated in seven prompts drifts.

## 4. File ownership

| Owner | Files |
|---|---|
| Each track | its own `src/pages/NN-*.tsx` only; page-only blocks live inside the page file |
| Main session | `tokens.json`, `styles.css`, `lib/`, `components/`, `blocks/`, `content/`, `motion/`, tools, config, links.json, drafts.json, heights.json, design-system.md, TRACKS.md, PLAN.md, memory, every import |
| A named layer track (later rounds) | the files the prompt names, for example `motion/signature.ts` or a new `blocks/price-finder.tsx` |

- Tracks never import and never edit shared files. A track that needs a component, token or content change says so in its report; until it lands, it builds the piece inside its page.
- When a rule changes mid-round, message the running tracks (SendMessage) in one line, then fix the finished pages yourself and add the rule to TRACKS.md.
- Builds are safe to run in parallel: each track builds only its own pages (`node build.mjs 05-salon 06-salon-services`), and the shared `tmp/` files are per page.

## 5. Collecting the reports

Each report gives, per page: file, still height, a one-line "what it shows", journey, blocks used (and new names), PLACEHOLDER content invented, client questions, personal data used, component or token changes wanted. The main session then:

1. Copies every PLACEHOLDER, client question and personal-data item into `PLAN.md`. Nothing stays only in a report.
2. Decides on new block names (reuse an existing name when the content is the same kind), promotes blocks used on two pages into `src/blocks/` with typed props, and makes component changes once.
3. Rebuilds everything, renders the new pages at 1440 and 390, and reads the sheets before importing (qa.md).

## 6. Later rounds

Cross-cutting rounds (motion, prototype links, chrome changes) touch many pages at once, so the layer files have one owner each and nobody imports until every track is done. The main session rebuilds once and pushes with `import_drafts.py update`. Heights must not change in these rounds (canvas-import.md).
