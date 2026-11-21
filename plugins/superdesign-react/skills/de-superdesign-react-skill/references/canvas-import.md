# The Superdesign canvas: full-height import

Phase 9, and every later push. Superdesign is the canvas and review surface only; Claude authors every draft. Tool: `scripts/import_drafts.py` (it calls `measure.js` and finds the CLI through `sdcli.py`).

## Contents

1. Commands you use, and the ones you never use
2. Full-height frames
3. Retries, 5xx and half-created frames
4. Updating without breaking frames
5. Titles, order and preview URLs
6. Replacing a frame

## 1. Commands you use, and the ones you never use

The CLI is `$SUPERDESIGN_CLI`, a `superdesign` binary, or `npx --yes @superdesign/cli@latest`, in that order.

| Use (no credits) | For |
|---|---|
| `fetch-design-nodes --project-id <id> --json` | What is on the canvas (read-only); `import_drafts.py status` wraps it |
| `import-design-draft --project-id <id> --title "01 · Home" --width 1440 --height <h> --html-file tmp/01-home.html --generated-by <model>` | A new full-height frame |
| `import-design-draft --into <draftId> --html-file ... --generated-by <model>` | A new version of a frame (revertible) |
| `get-design --draft-id <id> --output live.html` | What is actually live |
| `revert-design-draft --draft-id <id> --to-version N` | Undo a push |
| `upload-asset ...` | Brand and content images (upload.py) |

Never: `create-design-draft`, `iterate-design-draft`, `execute-flow-pages`, image or video generation. They spend credits. The tools refuse them.

`--generated-by` records who wrote the HTML: pass the id of the model that authored the TSX (`--model` or `DD_SD_MODEL`). The tools have no default, so a wrong author is never recorded silently.

## 2. Full-height frames

The frame's viewport is fixed when the draft is created and frames never scroll. `--device desktop` gives one screen, and the canvas shows only the hero.

- Width from config: `frame_widths[page]`, else `mobile_width` (390) for pages whose name contains `mobile_pattern` (`mobile`), else `frame_width` (1440). Height: the still height from `measure.js`. Never `--device`.
- Maximum height is 10,000px. Over it, tighten that page's section padding (`md:py-32` to `md:py-24`) and re-measure; do not split the page.
- Never size anything with `vh`, `dvh` or `h-screen` in a draft: in a 10,000px frame it becomes 10,000px. `min-h-screen` on the layout root is fine.
- Phones are measured in a 390 x 844 window: phone emulation in a tall window doubles the height.

```bash
cd .superdesign/tools
python3 import_drafts.py status                                 # read-only: canvas vs drafts.json and titles.json
python3 import_drafts.py create --dry-run                       # every built page with a title and no draft
python3 import_drafts.py create --model <id>                    # measures, imports, writes drafts.json and heights.json
python3 import_drafts.py create 27-mobile-home 29-mobile-menu --model <id>
```

## 3. Retries, 5xx and half-created frames

The API returns 5xx under load and sometimes after the frame was created. So:

- Before each create the script looks for the title on the canvas. A frame half-created by an earlier failure is adopted (its id goes into drafts.json and its size into heights.json, from the canvas when it reports one, else from this measurement, flagged to check) instead of duplicated.
- After a transient failure (5xx, timeout, network) it waits with backoff (5s to 160s) and checks the canvas for the title again before retrying, so a retry never creates a second frame.
- `--wait 60` waits up to an hour for the API before starting.
- `status` lists titles that appear twice and drafts with no recorded height. Keep the id in drafts.json and ask the user to delete the others (the CLI cannot delete).
- Store the `draftId` from an import, never the `draft-variant-...` node id it also returns: `fetch-design-nodes` lists draft ids.

## 4. Updating without breaking frames

After the full-height import the page height is frozen. Anything added later (motion, dialogs, dropdowns, link wiring) must be overlays, transforms or opacity.

```bash
node measure.js 1440 ../tmp/*.html --baseline ../src/heights.json      # CHANGED shows the drift
python3 import_drafts.py update --model <id>                            # refuses changed heights and frames with no recorded height
python3 import_drafts.py update 01-home --force --model <id>            # only when you accept the crop or the gap
```

Only the main session imports, once per round, after every track has finished.

## 5. Titles, order and preview URLs

- Titles `NN · Name` from `titles.json` (`00 · Design system`, `01 · Home`, `27 · Mobile · Home`), numbered in sitemap order, phone drafts after desktop. The number matches the file `NN-slug.tsx`.
- Share `https://superdesign.dev/preview/draft/<id>`: a full-screen iframe of `https://p.superdesign.dev/draft/<id>` whose sandbox blocks top navigation. Links between drafts therefore use `https://p.superdesign.dev/draft/<id>` with no `target` (`<A>` never sets one); the iframe navigates and the address bar keeps the first URL.
- Thumbnails are taken at load at full frame height; the server markup is complete before any script runs, so the thumbnail is the finished page even if hydration is slow.

## 6. Replacing a frame

A frame with the wrong size needs a new draft: `--into` cannot change width or height. Create the new frame, then overwrite the old one with a "Replaced, safe to delete" card linking to the new draft:

```bash
cp ../src/drafts.json ../research/drafts-old.json      # before create --force
python3 import_drafts.py create 01-home --force --model <id>
python3 import_drafts.py supersede ../research/drafts-old.json --model <id>
```

Rebuild (links read drafts.json), update the plan's screen table, and ask the user to delete the old frames.
