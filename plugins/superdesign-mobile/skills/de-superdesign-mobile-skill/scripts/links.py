#!/usr/bin/env python3
"""Prototype links: turn #hash placeholders into live Superdesign draft links.

Pages and partials keep readable placeholders (href="#services"). At build time build.py calls
apply(), which rewrites every <a href="#..."> whose target page already has a draft to
https://p.superdesign.dev/draft/<id> (the preview iframe follows plain links; never add a target).
A link to the page it sits on keeps its #hash when that anchor exists on the page, otherwise it
becomes a link to the page itself and header, menu and footer links get aria-current="page".

links.json (templates/links.example.json): base, id, page, hash, prefix, mobile, buttons. Lookup
order: id (anchor id) > page (per-page override) > hash > prefix. An id mapped to null keeps the
hash on purpose and is never reported as a dead end.
Dark twins: a page named <page>--dark links to <target>--dark when that draft exists.
mobile.pages link to the mobile twin of a target when mobile.map has one (web-plus-phone projects).
buttons: {page: {"button label": "target-page"}} adds an onclick to that <button>.

CLI, to find dead ends in a journey (hashes that resolve to no draft yet); exit 1 when any exist:
  python3 links.py --src .superdesign/src --built .superdesign/tmp [--page 01-today] [--allow-dead]

Standard library only.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

CURRENT_ID = re.compile(r'\bid="(hdr|mm|ftr|nav|m|util|sal|mob|tab|bar)-')


def load(src):
    src = Path(src)
    cfg = json.loads((src / "links.json").read_text())
    for key in ("id", "page", "hash", "prefix", "buttons"):
        cfg.setdefault(key, {})
    cfg.setdefault("mobile", {"pages": [], "map": {}})
    drafts_path = src / "drafts.json"
    drafts = json.loads(drafts_path.read_text()) if drafts_path.exists() else {}
    return cfg, drafts


KEEP = object()  # an id mapped to null: keep the hash on purpose


def target_for(cfg, page, anchor_id, href):
    if anchor_id and anchor_id in cfg["id"]:
        return KEEP if cfg["id"][anchor_id] is None else cfg["id"][anchor_id]
    page_map = cfg["page"].get(page[:-6] if page.endswith("--dark") else page, {})
    if href in page_map:
        return page_map[href]
    if href in cfg["hash"]:
        return cfg["hash"][href]
    for prefix, dest in cfg["prefix"].items():
        if href.startswith(prefix):
            return dest
    return None


def resolve(cfg, drafts, page, dest):
    if dest is KEEP:
        return None
    if dest and page in cfg["mobile"].get("pages", []):
        dest = cfg["mobile"].get("map", {}).get(dest, dest)
    if dest and page.endswith("--dark") and dest + "--dark" in drafts:
        dest = dest + "--dark"
    if not dest or dest not in drafts:
        return None
    return cfg["base"] + drafts[dest]


def apply(page, html, cfg, drafts):
    """Return (html, stats). stats: wired, kept, dead (Counter of hashes with no draft)."""
    stats = {"wired": 0, "kept": 0, "dead": Counter()}

    def anchor(m):
        tag = m.group(0)
        h = re.search(r'\bhref="(#[^"]*)"', tag)
        if not h:
            return tag
        i = re.search(r'\bid="([^"]+)"', tag)
        href = h.group(1)
        dest = target_for(cfg, page, i.group(1) if i else None, href)
        if dest is KEEP:
            stats["kept"] += 1
            return tag
        base = page[:-6] if page.endswith("--dark") else page
        if dest == base and f'id="{href[1:]}"' in html:
            stats["kept"] += 1
            return tag
        url = resolve(cfg, drafts, page, dest)
        if not url:
            stats["kept"] += 1
            if href != "#" and f'id="{href[1:]}"' not in html:
                stats["dead"][href] += 1
            return tag
        stats["wired"] += 1
        tag = tag.replace(h.group(0), f'href="{url}"', 1)
        if dest == base and "aria-current" not in tag and CURRENT_ID.search(tag):
            tag = tag.replace("<a ", '<a aria-current="page" ', 1)
        return tag

    html = re.sub(r"<a\b[^>]*>", anchor, html)
    for label, dest in cfg["buttons"].get(page[:-6] if page.endswith("--dark") else page, {}).items():
        url = resolve(cfg, drafts, page, dest)
        if not url:
            continue
        pat = re.compile(r"<button\b(?![^>]*onclick)([^>]*)>(?=(?:(?!</button>).)*?" + re.escape(label) + ")", re.S)
        html, n = pat.subn(lambda m: f'<button{m.group(1)} onclick="location.href=\'{url}\'">', html, count=1)
        stats["wired"] += n
    return html, stats


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", required=True, help=".superdesign/src (links.json, drafts.json)")
    ap.add_argument("--built", required=True, help="folder of built drafts (.superdesign/tmp)")
    ap.add_argument("--page", action="append", default=[])
    ap.add_argument("--allow-dead", action="store_true", help="exit 0 even when dead ends exist")
    a = ap.parse_args()
    cfg, drafts = load(a.src)
    # Report on built pages with their live links turned back into hashes is not possible, so
    # re-apply to the built HTML: already-wired links are https and are counted as live.
    files = sorted(Path(a.built).glob("*.html"))
    total_dead = Counter()
    for f in files:
        name = f.stem
        if a.page and name not in a.page:
            continue
        html = f.read_text()
        live = len(re.findall(r'href="https://p\.superdesign\.dev/draft/', html))
        _, stats = apply(name, html, cfg, drafts)
        total_dead.update(stats["dead"])
        dead = ", ".join(f"{k} x{v}" for k, v in stats["dead"].most_common(8))
        print(f"{name}: {live} live draft links, {stats['kept']} hashes kept" + (f", dead ends: {dead}" if dead else ""))
    if total_dead:
        print("\nHashes with no draft (add a draft, map them in links.json, or set them to null):")
        for k, v in total_dead.most_common():
            print(f"  {k:<28} {v}")
        if not a.allow_dead:
            sys.exit(1)


if __name__ == "__main__":
    main()
