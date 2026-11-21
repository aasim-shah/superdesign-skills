#!/usr/bin/env bash
# smoke.sh: set up a throwaway project with one skill, exactly as its SKILL.md says, then build,
# check and render the template drafts. Nothing touches Superdesign.
#
#   .github/scripts/smoke.sh mobile|react [workdir]
#
# The setup commands are read from the first ```bash block under "### 0. Intake and setup" in
# SKILL.md, so the documented setup is what gets tested. Needs Node 20+, Python 3 and Google Chrome.
set -euo pipefail

edition="${1:?usage: smoke.sh mobile|react [workdir]}"
case "$edition" in mobile|react) ;; *) echo "unknown edition: $edition" >&2; exit 2 ;; esac

repo="$(cd "$(dirname "$0")/../.." && pwd)"
SKILL="$repo/plugins/superdesign-$edition/skills/de-superdesign-$edition-skill"
work="${2:-$(mktemp -d)}"
mkdir -p "$work" && cd "$work"
echo "== $edition: setup in $work"

setup="$(awk '
  /^### 0\. Intake and setup/ { in_sec = 1; next }
  in_sec && /^```bash$/        { in_block = 1; next }
  in_block && /^```$/          { exit }
  in_block && !/^SKILL=/       { print }
' "$SKILL/SKILL.md")"
[ -n "$setup" ] || { echo "no setup block found in $SKILL/SKILL.md" >&2; exit 1; }
export SKILL
( set -x; eval "$setup" )

sd="$work/.superdesign"
cd "$sd/tools"

if [ "$edition" = mobile ]; then
  echo "== mobile: build"
  (cd ../src && python3 -I ../tools/build.py all --quiet)
  echo "== mobile: contrast (light and dark)"
  cp "$SKILL/templates/contrast-pairs.example.txt" ../src/contrast-pairs.txt
  python3 -I contrast.py --tokens ../src/tokens.json --pairs ../src/contrast-pairs.txt
  echo "== mobile: tokens.ts export"
  python3 -I tokens_export.py ../src/tokens.json --out ../handoff/theme/tokens.ts
  echo "== mobile: render at 390 with 44pt targets, both themes, and at 130% text"
  STILL=1 TARGET=44 node render.js ../research/shots 390 ../tmp/01-home.html ../tmp/01-home--dark.html ../tmp/02-detail.html
  STILL=1 TEXT_SCALE=1.3 node render.js ../research/shots-big 390 ../tmp/01-home.html
  echo "== mobile: import-grade heights (screens only; the board is 1440 wide)"
  node measure.js 390 ../tmp/01-home.html ../tmp/01-home--dark.html ../tmp/02-detail.html --min 844 --json ../research/heights-390.json
  echo "== mobile: prototype test"
  node proto_test.js ../tmp/01-home.html ../research/proto
else
  echo "== react: build"
  # Real projects get image keys and brand URLs from upload.py (phase 3). Here a 1 x 1 PNG data URI
  # stands in for the hero image and the logos, so the build and render run offline.
  python3 -I - ../src <<'PY'
import json, pathlib, sys
src = pathlib.Path(sys.argv[1])
dot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
(src / "asset-map.json").write_text(json.dumps({"hero": dot}))
cfg = json.loads((src / "config.json").read_text())
cfg["brand_urls"] = {k: dot for k in cfg.get("brand_urls", {})}
(src / "config.json").write_text(json.dumps(cfg, indent=1))
PY
  node build.mjs all --quiet
  echo "== react: render at 1440 and 390"
  STILL=1 node render.js ../research/shots 1440 ../tmp/01-home.html
  STILL=1 node render.js ../research/shots-m 390 ../tmp/01-home.html
  echo "== react: import-grade heights"
  node measure.js 1440 ../tmp/*.html --json ../research/heights-1440.json
  echo "== react: prototype test"
  node proto_test.js ../tmp/01-home.html ../research/proto
fi

echo "== $edition: smoke test passed"
