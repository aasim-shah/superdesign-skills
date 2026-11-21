# Intake, crawl, audit and plan

Phases 0 to 2: find out what exists, crawl the live site, and write the plan every later phase follows. Tools: `scripts/crawl.js`. Template: `templates/PLAN.md`.

## Contents

1. Intake
2. Set up the project folder
3. Crawl
4. Audit tables
5. Journeys and sitemap
6. The plan (PLAN.md, Claude Doc on request)

## 1. Intake

| Ask or find | Why |
|---|---|
| Existing work: memory, `PLAN.md`, `.superdesign/`, the Superdesign project (`fetch-design-nodes --project-id <id> --json`) | Joining a redesign in progress is common; never start a second canvas |
| Live site URL, reference sites the client admires | Crawl targets |
| Constraints: own model only (no credits), agent cap (default 5), deadline | "By end of play" means design-complete with placeholders; the build waits on client content. Say so plainly |
| The target app: Next.js (App Router) or Vite + React Router; an existing codebase or a new one | Sets `config.json` `app`, the route format in each page's `meta`, and how the handoff README maps links and images |
| Locale (US or UK English), brand fonts and colors, logo files | Design system inputs |
| What the client asked to keep or drop | Recorded in the plan so nobody adds it back |

When the user asks "how about the rest?", list the gap and start building. Ask only for real decisions.

## 2. Set up the project folder

```bash
SKILL="<base directory of this skill>"   # the folder holding SKILL.md, e.g. .claude/skills/de-superdesign-react-skill
mkdir -p .superdesign/{research,src,tmp,tools,handoff}
cp "$SKILL"/scripts/* .superdesign/tools/
cp -R "$SKILL"/templates/src/. .superdesign/src/
cp "$SKILL"/templates/config.example.json .superdesign/src/config.json
cp "$SKILL"/templates/links.example.json .superdesign/src/links.json
cp "$SKILL"/templates/titles.example.json .superdesign/src/titles.json
cd .superdesign/tools && npm install
```

`npm install` pins esbuild, React 19, Tailwind 3, lucide-react and Playwright 1.48.2 (it drives the system Chrome; set `DD_SD_CHANNEL=` to use Playwright's own Chromium). Set `project_id` and `prefix` in `config.json`. Keep `research/`, `tmp/` and `tools/node_modules/` out of git. The Superdesign CLI is found by `sdcli.py`: `$SUPERDESIGN_CLI`, a `superdesign` binary, else `npx --yes @superdesign/cli@latest`.

## 3. Crawl

```bash
node crawl.js --out ../research --sitemap https://example.com/sitemap.xml --max 60
node crawl.js --out ../research --no-shots --widths 1440 --cards "article.location-card" https://example.com/locations/
```

| Output | Use it for |
|---|---|
| `shots/<page>-1440(-fold).png`, `-390` | The audit and the before and after story. Read them |
| `crawl.json` | Per page: title, description, H1 count, headings, computed type per role, colors, links, images, JSON-LD |
| `content-dump.md` | Real copy for `content/site.ts` and the pages; tracks grep it for their page |
| `images.json` | Image inventory (src, pages, alt, size); pick keys for `img-sources.json` |
| `tokens-seen.json` | Fonts by weight and text colors and backgrounds by use: the live palette in numbers |
| `structured.json`, `cards.json` | Phones, emails, addresses, JSON-LD and card records (locations, offices, team) |

A bot challenge prints BLOCKED. Never solve or bypass it: audit from public listings and ask the client for screenshots. The crawl output holds personal data (names, emails, phones): say so before sharing it.

## 4. Audit tables

One table per area, each row a finding with where it is and the fix (a screen number when the redesign fixes it). Lead with the point and a number.

| Area | What to look for |
|---|---|
| Critical issues | Links to private or password-protected pages, empty pages, template filler, wrong facts (one location showing another's address), another company's brand, assets on third-party domains |
| UX and IA | Steps between "I want this" and the booking or checkout; prices hidden behind selectors; competing nav bars; different chrome on sub-sites; long anchor forms |
| Visual design and typography | Font count and roles, body size and negative tracking, system-only fonts, ALL-CAPS headings, contrast of brand pairs (white on a bright brand color is often near 3.5:1) |
| Technical, SEO, accessibility | Missing descriptions, duplicate titles, page weight, images without alt, H1 count, focus states, motion that cannot be paused, client-side-only rendering that hides content from crawlers |

## 5. Journeys and sitemap

Name 2 to 4 journeys, each with an end state (a pet salon: Pamper, find my salon to booking; Join, membership price to first visit; Own, franchise story to inquiry; Work, careers to applying). Tag every sitemap row and every screen with its journey. The sitemap lives in design-system.md section 1 as a tree (`Section /route purpose`); its routes become each page's `meta.route`.

Pages to draw: every header and footer link target, every sitemap row, plus the in-between states a journey needs (confirmation after a form, search and 404, the open mobile menu, a coming-soon state). Number them in sitemap order: `pages/NN-slug.tsx`, title `NN · Name` in `titles.json`; `00` is the design-system board, phone drafts (`NN-mobile-*`) come last.

## 6. The plan

Write `PLAN.md` at the project root from `templates/PLAN.md`: lead (the problem and the plan in two sentences), the screen table (filled after import), the four audit tables, strategy (positioning, journeys, sitemap pointer), design system summary, feature specs for the app build, open questions, placeholder content, personal data noted, sources.

Make a Claude Doc only when the user asks for one. Then create it first (skeleton with pending sections), open it, and fill one section per call, as the Claude Docs instructions say. Either way, findings go in the plan, not the chat.

Every track report adds to four lists in the plan: open questions for the client, PLACEHOLDER content, personal data noted, component changes wanted.
