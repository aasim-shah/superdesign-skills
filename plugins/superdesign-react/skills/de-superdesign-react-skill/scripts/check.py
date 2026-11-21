#!/usr/bin/env python3
"""check.py: validate built React drafts against two contracts. build.mjs runs it after every build;
it also runs alone.

Draft contract (PROBLEMS, exit 1): what Superdesign's importer and the canvas need.
  doctype; <body> without a class; one root element in <body> (scripts, styles, templates aside) with
  id "<prefix>-root"; a non-empty <title>; unique id on every <a>; hrefs only https://, #hash, mailto:
  or tel:; no nested anchors; no duplicate ids; no config "forbidden" strings in the markup (old brand
  names, the agency's name, lorem; scripts and styles are not searched); every <img> has alt, empty alt
  only with aria-hidden="true", src only https:// or data: (uploaded assets, never relative); no leaked
  render values in visible text ("undefined", "[object Object]", "NaN").

Handoff contract (warnings; errors when config "contract" is "error"; off for config
"reference_pages"): what the React app build needs.
  Built markup: every element child of <main> is a <section data-block="kebab-name"> (the <Block>
  component) with aria-labelledby pointing at an existing id, or aria-label; exactly one <h1>; no
  .eyebrow when config "eyebrows" is false.
  Page source (src/pages/<name>.tsx): no vh or h-screen sizing (frames are up to 10,000px tall); no hex
  colors (tokens only); no dangerouslySetInnerHTML or <script>; links through <A>, sections through
  <Block>, images through img('key'); no window, document or localStorage in a page (components own
  browser code, in effects); no Math.random(), Date.now() or new Date() (server and client renders
  would differ: a hydration error).

Usage:
  python3 check.py [names...] [--src DIR] [--out DIR] [--quiet]
Standard library only.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import htmltree  # noqa: E402

KEBAB = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
VH = re.compile(r"(?<![\w-])(?:h-screen|max-h-screen|min-h-dvh|h-dvh)\b|\[\d+(?:\.\d+)?[dsl]?vh\]|\b\d+(?:\.\d+)?[dsl]?vh\b")
HEX = re.compile(r"-\[#[0-9a-fA-F]{3,8}\]|['\"`]#[0-9a-fA-F]{3,8}['\"`]")
SCRIPTS = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.S | re.I)
LEAKS = re.compile(r"\b(undefined|NaN)\b|\[object Object\]")


def problems(html, doc, cfg):
    out = []
    prefix = cfg.get("prefix", "xyz")
    if not html.lstrip().lower().startswith("<!doctype html>"):
        out.append("missing <!DOCTYPE html>")
    title = doc.find("title")
    if title is None or not title.text().strip():
        out.append("empty <title>: export const meta = { title } from the page")
    body = doc.find("body")
    if body is None:
        return out + ["no <body>"]
    if "class" in body.attrs:
        out.append("<body> has a class")
    roots = [e for e in body.elements() if e.tag not in ("script", "style", "template", "link", "noscript")]
    if len(roots) != 1:
        out.append(f"<body> needs one root element, found {len(roots)}: {roots[:3]}")
    elif roots[0].attrs.get("id") != f"{prefix}-root":
        out.append(f"root element id is {roots[0].attrs.get('id')!r}, expected '{prefix}-root'")
    for a in doc.find_all("a"):
        if not a.attrs.get("id"):
            out.append(f"<a> without id: {a!r} '{a.text()[:40]}'")
        href = a.attrs.get("href")
        if href is not None and not href.startswith(("#", "https://", "mailto:", "tel:")):
            out.append(f"href must be https://, #hash, mailto: or tel:, got: {href[:60]}")
        if any(p.tag == "a" for p in a.ancestors()):
            out.append(f"nested <a>: {a!r}")
    markup = SCRIPTS.sub("", html)
    ids = Counter(re.findall(r'\bid="([^"]+)"', markup))
    dups = [k for k, v in ids.items() if v > 1]
    if dups:
        out.append(f"duplicate ids: {dups[:8]}")
    for bad in cfg.get("forbidden", []):
        if bad and bad in markup:
            out.append(f"forbidden string: {bad}")
    for img in doc.find_all("img"):
        src = img.attrs.get("src", "")
        if "alt" not in img.attrs:
            out.append(f"<img> without alt: {src[-50:]}")
        elif img.attrs["alt"] == "" and img.attrs.get("aria-hidden") != "true":
            out.append(f"empty alt without aria-hidden: {src[-50:]}")
        if not src.startswith(("https://", "data:")):
            out.append(f"image not from an uploaded URL: {src[:60]}")
    text = body.text()
    for m in sorted(set(x.group(0) for x in LEAKS.finditer(text)))[:3]:
        out.append(f"leaked render value in visible text: {m}")
    return out


def warnings(name, src_text, doc, cfg):
    out = []
    main = doc.find("main")
    if main is None:
        out.append("no <main>: blocks are read from the sections inside <main>")
    else:
        ids = {n.attrs["id"] for n in doc.find_all(attr="id")}
        for el in main.elements():
            if el.tag in ("script", "style", "template"):
                continue
            if el.tag != "section":
                out.append(f"<main> child is not a <section>: {el!r} (wrap it in <Block>)")
                continue
            block = el.attrs.get("data-block")
            label = el.attrs.get("aria-labelledby")
            where = block or label or repr(el)
            if not block:
                out.append(f"section without data-block: {label or el.attrs.get('aria-label') or repr(el)} (use <Block name>)")
            elif not KEBAB.match(block):
                out.append(f"data-block is not kebab-case: {block}")
            if not label and not el.attrs.get("aria-label"):
                out.append(f"section without labelledBy or label: {where}")
            elif label and label not in ids:
                out.append(f"aria-labelledby points at a missing id: {label}")
    h1 = len(list(doc.find_all("h1")))
    if h1 != 1:
        out.append(f"{h1} <h1> elements (one per page, in the first block)")
    if cfg.get("eyebrows") is False and any("eyebrow" in e.classes for e in doc.find_all()):
        out.append("eyebrow used but config eyebrows is false (house rule: no eyebrows)")
    if src_text is None:
        return out
    code = re.sub(r"/\*.*?\*/", "", src_text, flags=re.S)
    code = re.sub(r"(?m)^\s*//.*$", "", code)
    for m in sorted(set(x.group(0) for x in VH.finditer(code)))[:3]:
        out.append(f"viewport-height sizing in a draft ({m.strip()}): frames are up to 10,000px tall")
    hexes = sorted(set(HEX.findall(code)))
    if hexes:
        out.append(f"hex colors in the page, use tokens: {', '.join(hexes[:4])}" + (" ..." if len(hexes) > 4 else ""))
    if "dangerouslySetInnerHTML" in code or re.search(r"<script\b", code):
        out.append("dangerouslySetInnerHTML or <script> in the page: behavior lives in components")
    if re.search(r"<a\s", code):
        out.append("raw <a> in the page: use <A id href> so links wire to drafts and get aria-current")
    if re.search(r"<section\b", code):
        out.append("raw <section> in the page: use <Block name labelledBy>")
    if re.search(r"<img\b[^>]*\bsrc=\s*[\"']", code):
        out.append("literal image src in the page: use img('key') or brand('key')")
    if re.search(r"\b(window|document|localStorage|sessionStorage)\.", code):
        out.append("browser globals in the page: move that code into a component effect")
    if re.search(r"Math\.random\(|Date\.now\(|new Date\(", code):
        out.append("Math.random/Date in the page: server and client renders would differ (hydration error)")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*", default=["all"])
    ap.add_argument("--src")
    ap.add_argument("--out")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()
    src = Path(a.src) if a.src else (Path(".") if Path("config.json").exists() else HERE.parent / "src")
    src = src.resolve()
    out = Path(a.out).resolve() if a.out else src.parent / "tmp"
    cfg = json.loads((src / "config.json").read_text())
    mode = cfg.get("contract", "warn")
    refs = cfg.get("reference_pages")
    names = sorted(p.stem for p in out.glob("*.html") if not p.stem.startswith("_")) if a.names in (["all"], []) else a.names
    n_prob = n_warn = 0
    for name in names:
        f = out / f"{name}.html"
        if not f.exists():
            print(f"{name}: not built ({f})")
            n_prob += 1
            continue
        html = f.read_text()
        doc = htmltree.parse(html)
        page = src / "pages" / f"{name}.tsx"
        src_text = page.read_text() if page.exists() else None
        probs = problems(html, doc, cfg)
        is_ref = name in refs if refs is not None else "design-system" in name
        warns = [] if mode == "off" or is_ref else warnings(name, src_text, doc, cfg)
        if mode == "error":
            probs, warns = probs + warns, []
        n_prob += len(probs)
        n_warn += len(warns)
        if a.quiet and not probs and not warns:
            continue
        if probs or warns:
            print(f"{name}:" + (" PROBLEMS" if probs else "") + (f" {len(warns)} contract warnings" if warns else ""))
        for p in probs:
            print("   -", p)
        for w in warns[:8]:
            print("   ~", w)
        if len(warns) > 8:
            print(f"   ~ ... {len(warns) - 8} more")
    print(f"check: {len(names)} pages, {n_prob} problems, {n_warn} contract warnings")
    sys.exit(1 if n_prob else 0)


if __name__ == "__main__":
    main()
