#!/usr/bin/env python3
"""WCAG 2.2 contrast check for every text and background pair a Superdesign draft uses.

The palette comes straight from the drafts' single token source: src/tokens.json (--tokens), the
Tailwind config in a head partial (--head), or a flat JSON palette (--palette), so the check always
matches what the drafts render.
Run it while writing design-system.md and again whenever a token changes. Exit 1 if any pair
fails the level it is declared for.

Usage:
  contrast.py --tokens src/tokens.json --pairs src/contrast-pairs.txt
  contrast.py --tokens src/tokens.json --pairs src/contrast-pairs.txt --theme all     # light and dark
  contrast.py --head src/partials/head.html --pairs src/contrast-pairs.txt
  contrast.py --head src/partials/head.html --pair "white on pink-600 text" --pair "pink-500 on white large"
  contrast.py --palette palette.json --pairs pairs.txt --format markdown
  contrast.py --head src/partials/head.html --pairs pairs.txt --json-out src/contrast-pairs.json

Pairs, text format (one per line, # starts a comment, "where" after a second #):
  white on navy-900 text          # body text on dark bands
  ink-500 on white ui             # input borders
  white/70 on navy-900 text       # Tailwind opacity: composited over the background
  #E9A800 on white decorative     # literal colors work too
Themes: tokens.json may hold "semantic": {"light": {"text": "ink-900", ...}, "dark": {...}}. A pair
that names a semantic token ("text on surface text") is checked once per theme (--theme light, dark
or all; default all); a pair of primitives is checked once. Semantic values are primitive names,
"name/70" opacities or literal hex.
Pairs, JSON format: the contrast-pairs.json shape, so the same list carries
into the app build: {"pairs": [{"fg": "white", "bg": "pink-600", "use": "text", "where": "..."}]}.
--json-out writes that shape (with the measured ratio) from whatever you passed in.

Uses and their minimum ratio:
  text 4.5 (SC 1.4.3) | large 3.0 (24px+, or 18.66px+ bold) | ui 3.0 (SC 1.4.11: icons, borders,
  focus rings) | text-aaa 7.0 | large-aaa 4.5 | decorative 1.0 (recorded, no requirement)
Ratios are truncated to two decimals for display and compared unrounded (4.499 fails 4.5).
Luminance uses the sRGB 0.04045 threshold. A semi-transparent background is composited over
--backdrop (white by default).

Standard library only.
"""
import argparse
import json
import math
import re
import sys

LEVELS = {"text": 4.5, "large": 3.0, "ui": 3.0, "text-aaa": 7.0, "large-aaa": 4.5, "decorative": 1.0}


def palette_from_head(path):
    """Flatten tailwind.config theme.extend.colors in a head partial into {slug: '#RRGGBB'}."""
    text = open(path, encoding="utf-8").read()
    start = text.find("colors:")
    if start < 0:
        sys.exit(f"no 'colors:' block in {path}")
    i = text.index("{", start)
    depth, j = 0, i
    while True:
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1
    body = text[i + 1:j]
    pal = {}
    key = r"""(?:'([^']+)'|"([^"]+)"|([\w-]+))"""
    for m in re.finditer(key + r"""\s*:\s*(\{[^{}]*\}|'[^']*'|"[^"]*")""", body):
        name = m.group(1) or m.group(2) or m.group(3)
        val = m.group(4)
        if val.startswith("{"):
            for sm in re.finditer(key + r"""\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]""", val):
                step = sm.group(1) or sm.group(2) or sm.group(3)
                pal[name if step == "DEFAULT" else f"{name}-{step}"] = sm.group(4)
        else:
            pal[name] = val.strip("'\"")
    return pal


def flatten_colors(colors):
    pal = {}
    for name, val in colors.items():
        if name.startswith("_"):
            continue
        if isinstance(val, dict):
            for step, hexv in val.items():
                pal[name if step == "DEFAULT" else f"{name}-{step}"] = hexv
        else:
            pal[name] = val
    return pal


def tokens_file(path):
    """src/tokens.json -> (palette, semantic themes)."""
    data = json.load(open(path, encoding="utf-8"))
    sem = {k: v for k, v in (data.get("semantic") or {}).items() if not k.startswith("_")}
    return flatten_colors(data.get("colors", {})), sem


def parse_hex(value):
    h = value.lstrip("#")
    if len(h) in (3, 4):
        h = "".join(c * 2 for c in h)
    if len(h) not in (6, 8):
        raise ValueError(value)
    rgb = [int(h[k:k + 2], 16) for k in (0, 2, 4)]
    a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return rgb, a


def resolve(token, pal, sem=None, depth=0):
    """'navy-900', 'white/70', 'pink-500@0.4', '#E9A800', a semantic name -> ([r, g, b], alpha)."""
    alpha = 1.0
    m = re.fullmatch(r"(.+?)(?:/(\d{1,3})|@(0?\.\d+|1(?:\.0+)?))", token)
    if m:
        token = m.group(1)
        alpha = int(m.group(2)) / 100 if m.group(2) else float(m.group(3))
    if sem and token in sem and depth < 4:
        rgb, a = resolve(sem[token], pal, None, depth + 1)
        return rgb, a * alpha
    value = token if token.startswith("#") else pal.get(token)
    if value is None:
        raise KeyError(token)
    rgb, a = parse_hex(value)
    return rgb, a * alpha


def base_name(token):
    return re.split(r"[/@]", token, maxsplit=1)[0]


def over(fg, a, bg):
    return [round(f * a + b * (1 - a)) for f, b in zip(fg, bg)]


def luminance(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (ch(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def read_pairs(path):
    text = open(path, encoding="utf-8").read()
    if path.endswith(".json"):
        data = json.loads(text)
        return data["pairs"] if isinstance(data, dict) else data
    return [p for p in (parse_line(line) for line in text.splitlines()) if p]


def parse_line(line):
    where = ""
    if "#" in line:
        # a leading '#hex' is a color; a ' #' later starts a comment
        cut = re.search(r"\s#\s|\s#$|^#\s|^#$", line)
        if cut:
            where = line[cut.end():].strip()
            line = line[:cut.start()]
    line = line.strip()
    if " on " not in line:
        return None
    fg, rest = [s.strip() for s in line.split(" on ", 1)]
    parts = rest.split()
    return {"fg": fg, "bg": parts[0], "use": parts[1] if len(parts) > 1 else "text", "where": where}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tokens", help="src/tokens.json (colors + optional semantic themes)")
    ap.add_argument("--theme", default="all", help="light, dark or all (semantic pairs only)")
    ap.add_argument("--head", help="partials/head.html with the Tailwind config")
    ap.add_argument("--palette", help="flat JSON palette {name: '#hex'} (alternative to --head)")
    ap.add_argument("--pairs", help="pairs file (.txt lines or .json)")
    ap.add_argument("--pair", action="append", default=[], help='"fg on bg [use]" (repeatable)')
    ap.add_argument("--backdrop", default="#FFFFFF")
    ap.add_argument("--format", choices=["text", "markdown", "json"], default="text")
    ap.add_argument("--json-out", help="write the pairs with ratios in contrast-pairs.json shape")
    ap.add_argument("--list", action="store_true", help="print the parsed palette and stop")
    a = ap.parse_args()

    pal, sem = {}, {}
    if a.tokens:
        p, sem = tokens_file(a.tokens)
        pal.update(p)
    if a.head:
        pal.update(palette_from_head(a.head))
    if a.palette:
        pal.update(json.load(open(a.palette)))
    pal.setdefault("white", "#FFFFFF")
    pal.setdefault("black", "#000000")
    if a.list:
        for k, v in pal.items():
            print(f"{k:<14} {v}")
        for theme, m in sem.items():
            print(f"\n[{theme}]")
            for k, v in m.items():
                print(f"{k:<14} {v}")
        return 0

    pairs = (read_pairs(a.pairs) if a.pairs else []) + [parse_line(p) for p in a.pair]
    pairs = [p for p in pairs if p]
    if not pairs:
        sys.exit("no pairs: pass --pairs FILE or --pair 'fg on bg use'")

    backdrop, _ = parse_hex(a.backdrop)
    themes = [t for t in sem if a.theme in ("all", t)]
    if sem and not themes:
        sys.exit(f"no theme '{a.theme}' in tokens semantic ({', '.join(sem)})")
    rows, failed = [], 0
    for p in pairs:
        use = p.get("use", "text")
        semantic = bool(sem) and any(base_name(p[k]) in m for k in ("fg", "bg") for m in sem.values())
        for theme in (themes if semantic else [None]):
            st = sem.get(theme) if theme else None
            row = {**p, "use": use}
            if theme:
                row["theme"] = theme
            try:
                bg_rgb, bg_a = resolve(p["bg"], pal, st)
                fg_rgb, fg_a = resolve(p["fg"], pal, st)
            except (KeyError, ValueError) as e:
                rows.append({**row, "ratio": None, "need": LEVELS.get(use), "pass": False, "error": f"unknown color {e}"})
                failed += 1
                continue
            bg = over(bg_rgb, bg_a, backdrop) if bg_a < 1 else bg_rgb
            fg = over(fg_rgb, fg_a, bg) if fg_a < 1 else fg_rgb
            r = ratio(fg, bg)
            need = LEVELS.get(use, 4.5)
            ok = r >= need
            failed += 0 if ok else 1
            rows.append({**row, "ratio": math.floor(r * 100) / 100, "need": need, "pass": ok})

    if a.format == "json":
        print(json.dumps(rows, indent=1))
    else:
        md = a.format == "markdown"
        if md:
            print("| Foreground | Background | Theme | Use | Ratio | Needs | Result | Where |\n|---|---|---|---|---|---|---|---|")
        for r in rows:
            verdict = "ERROR " + r["error"] if r.get("error") else ("PASS" if r["pass"] else "FAIL")
            ratio_s = f"{r['ratio']:.2f}" if r["ratio"] is not None else "-"
            if md:
                print(f"| {r['fg']} | {r['bg']} | {r.get('theme', '')} | {r['use']} | {ratio_s} | {r['need']} | {verdict} | {r.get('where', '')} |")
            else:
                th = f"[{r['theme']}] " if r.get("theme") else ""
                print(f"{r['fg']:>16} on {r['bg']:<12} {r['use']:<10} {ratio_s:>6}  {verdict}  {th}{r.get('where', '')}")
        print(f"\n{len(rows)} pairs, {failed} failing")

    if a.json_out:
        out = [{"fg": r["fg"], "bg": r["bg"], "use": r["use"], "where": r.get("where", ""), "ratio": r["ratio"],
                **({"theme": r["theme"]} if r.get("theme") else {})} for r in rows]
        json.dump({"pairs": out}, open(a.json_out, "w"), indent=1)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
