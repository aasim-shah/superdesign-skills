# The Superdesign canvas: screen import

Phase 9, and every later push. Superdesign is the canvas and review surface only; Claude authors every screen. Tool: `scripts/import_drafts.py` (it calls `measure.js` and finds the CLI through `sdcli.py`).

## Contents

1. Commands you use, and the ones you never use
2. Screen frames
3. Retries, 5xx and half-created frames
4. Updating without breaking frames
5. Titles, order and preview URLs
6. Replacing a frame

## 1. Commands you use, and the ones you never use

The CLI is `$SUPERDESIGN_CLI`, a `superdesign` binary, or `npx --yes @superdesign/cli@latest`, in that order.

| Use (no credits) | For |
|---|---|
| `fetch-design-nodes --project-id <id> --json` | What is on the canvas (read-only); `import_drafts.py status` wraps it |
| `import-design-draft --project-id <id> --title "01 · Home" --width 390 --height <h> --html-file tmp/01-home.html --generated-by <model>` | A new screen frame |
| `import-design-draft --into <draftId> --html-file ... --generated-by <model>` | A new version of a frame (revertible) |
| `get-design --draft-id <id> --output live.html` | What is actually live |
| `revert-design-draft --draft-id <id> --to-version N` | Undo a push |
| `upload-asset ...` | Brand and content images (upload.py) |

Never: `create-design-draft`, `iterate-design-draft`, `execute-flow-pages`, image or video generation. They spend credits; the tools refuse them. `--generated-by` is the model that wrote the HTML (`--model` or `DD_SD_MODEL`); there is no default.

## 2. Screen frames

The frame's viewport is fixed when the draft is created and frames never scroll.

- Width: config `frame_widths[page]` (the board: 1440), else `frame_width` (390). Never `--device`.
- Height: the still height from `measure.js`, never less than `device.height`. A `fixed` screen must measure exactly `device.height`, or `create` skips it with the reason. A `scroll` screen is its full length, at most 10,000px.
- Never size anything with `vh` or `h-screen`: in a 3,000px frame it becomes 3,000px. Use the device metrics.

```bash
cd .superdesign/tools
python3 import_drafts.py status                                 # read-only: canvas vs drafts.json and titles.json
python3 import_drafts.py create --dry-run                       # every built screen (and dark twin) with a title and no draft
python3 import_drafts.py create --model <id>
python3 import_drafts.py create 05-home-empty 05-home-empty--dark --model <id>
```

## 3. Retries, 5xx and half-created frames

- Before each create the script looks for the title on the canvas; a frame half-created by an earlier failure is adopted, with its size (from the canvas when it reports one, else this measurement, flagged to check).
- After a transient failure it waits with backoff (5s to 160s) and checks the canvas for the title before retrying, so a retry never creates a second frame. `--wait 60` waits for the API before starting.
- `status` lists duplicate titles and drafts with no recorded height. Keep the id in drafts.json and ask the user to delete the others (the CLI cannot delete).
- Store the `draftId`, never the `draft-variant-...` node id an import also returns.

## 4. Updating without breaking frames

After import a screen's height is frozen. Changes must keep it: overlays (sheets, toasts) are fixed and closed by default, transitions are transforms and opacity.

```bash
node measure.js 390 ../tmp/*.html --min 844 --baseline ../src/heights.json
python3 import_drafts.py update --model <id>                    # refuses changed heights and frames with no recorded height
python3 import_drafts.py update 01-home --force --model <id>    # only when you accept the crop or the gap
```

Only the main session imports, once per round, after every track has finished.

## 5. Titles, order and preview URLs

- Titles `NN · Name` from `titles.json` (`00 · Design system`, `01 · Home`, `05 · Home · Empty`), numbered in flow order with states next to their screen. Dark twins are titled automatically: `01 · Home · Dark`.
- Share `https://superdesign.dev/preview/draft/<id>`: a full-screen iframe of `https://p.superdesign.dev/draft/<id>` whose sandbox blocks top navigation. Links between screens use `https://p.superdesign.dev/draft/<id>` with no `target`.
- Thumbnails are taken at load: screens are static on load (motion plays only after a tap), so the thumbnail is the finished screen.
- Arrange the canvas by flow (the user can drag frames): light row, dark row under it.

## 6. Replacing a frame

A frame with the wrong size needs a new draft: `--into` cannot change width or height.

```bash
cp ../src/drafts.json ../research/drafts-old.json
python3 import_drafts.py create 02-detail --force --model <id>
python3 import_drafts.py supersede ../research/drafts-old.json --model <id>
```

Rebuild (links read drafts.json), update the plan's screen table, and ask the user to delete the old frames.
