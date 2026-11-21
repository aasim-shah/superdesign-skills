#!/usr/bin/env python3
"""tokens_export.py: write the React Native theme from src/tokens.json, so the app and the drafts share one
token source. The output is a plain TypeScript module with no dependencies:

  palette            every primitive: palette['ink-900'] = '#111827'
  colors.light/dark  every semantic name resolved to a hex or rgba string (useColorScheme picks one)
  fonts              the first family of each font role (load the files with expo-font)
  type               every role as a TextStyle: fontFamily, fontSize, lineHeight, fontWeight, letterSpacing
                     (points, exactly the numbers the drafts use; React Native scales them with the user's text size)
  radius, space      numbers in points
  shadow             iOS shadow props plus an Android elevation approximation (check on device)

Usage (from .superdesign/tools):
  python3 tokens_export.py ../src/tokens.json --out ../handoff/theme/tokens.ts
  python3 tokens_export.py ../src/tokens.json            # print to stdout

Re-run after every token change; never edit the output by hand. Standard library only.
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import tokens as tk  # noqa: E402


def camel(name):
    return re.sub(r"-([a-z0-9])", lambda m: m.group(1).upper(), name)


def key(name):
    return name if re.fullmatch(r"[A-Za-z_$][\w$]*", name) else json.dumps(name)


def color_str(rgb, a):
    return "#%02X%02X%02X" % rgb if a >= 1 else f"rgba({rgb[0]}, {rgb[1]}, {rgb[2]}, {a:g})"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tokens")
    ap.add_argument("--out")
    a = ap.parse_args()
    t = tk.load(a.tokens)
    pal = tk.flatten(t.get("colors", {}))
    sem = tk.semantic(t)
    fams = {k: v[0].strip('"') for k, v in (t.get("fonts") or {}).items() if isinstance(v, list) and v}
    L = ["// Generated from .superdesign/src/tokens.json by tokens_export.py. Do not edit: change tokens.json and re-run.", ""]
    L.append("export const palette = {")
    L += [f"  {key(n)}: '{h.upper()}'," for n, h in pal.items()]
    L.append("} as const;\n")
    L.append("export const colors = {")
    for theme, m in sem.items():
        L.append(f"  {theme}: {{")
        L += [f"    {key(camel(n))}: '{color_str(*v)}'," for n, v in m.items()]
        L.append("  },")
    L.append("} as const;\n")
    if sem:
        first = next(iter(sem))
        L.append(f"export type ColorName = keyof typeof colors.{first};")
        L.append("export type Theme = keyof typeof colors;\n")
    L.append("export const fonts = {")
    L += [f"  {key(n)}: '{f}'," for n, f in fams.items()]
    L.append("} as const;\n")
    L.append("export const type = {")
    for name, r in (t.get("type") or {}).items():
        parts = []
        if r.get("font") in fams:
            parts.append(f"fontFamily: fonts.{r['font']}")
        parts.append(f"fontSize: {r.get('size', 17)}")
        if r.get("lh"):
            parts.append(f"lineHeight: {r['lh']}")
        parts.append(f"fontWeight: '{r.get('weight', 400)}'")
        if r.get("track"):
            parts.append(f"letterSpacing: {r['track']}")
        if r.get("tabular"):
            parts.append("fontVariant: ['tabular-nums']")
        if r.get("case") == "upper":
            parts.append("textTransform: 'uppercase'")
        L.append(f"  {key(camel(name))}: {{ {', '.join(parts)} }},")
    L.append("} as const;\n")
    L.append("export const radius = {")
    L += [f"  {key(camel(n))}: {v}," for n, v in (t.get("radius") or {}).items()]
    L.append("} as const;\n")
    L.append(f"export const space = {json.dumps(t.get('space') or [0, 4, 8, 12, 16, 20, 24, 32, 40, 48])} as const;\n")
    L.append("export const shadow = {")
    for n, s in (t.get("shadow") or {}).items():
        rgb, _ = tk.resolve(s.get("color", "#000000"), pal)
        L.append(f"  {key(camel(n))}: {{ shadowColor: '{color_str(rgb, 1)}', shadowOffset: {{ width: 0, height: {s.get('y', 0)} }}, "
                 f"shadowOpacity: {s.get('opacity', 0.1)}, shadowRadius: {round(s.get('blur', 0) / 2, 1):g}, elevation: {max(1, round(s.get('blur', 0) / 3))} }},")
    L.append("} as const;")
    text = "\n".join(L) + "\n"
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text)
        print(f"wrote {a.out}: {len(pal)} primitives, {sum(len(m) for m in sem.values())} semantic colors in {len(sem)} themes, {len(t.get('type') or {})} type roles")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
