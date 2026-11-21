#!/usr/bin/env python3
"""Build mobile app screen drafts from pages and partials, wire prototype links, and validate them
against the Superdesign draft contract (problems: the import would break) and the React Native
handoff contract (warnings: the bridge to the app gets harder).

Usage:
  python3 build.py [names... | all] [--src DIR] [--out DIR] [--quiet]
    --src   folder with config.json, tokens.json, pages/ and partials/ (default: the current folder
            if it has config.json, else ../src next to this script)
    --out   where built drafts go (default: <src>/../tmp)

  python3 build.py all                       # from .superdesign/src
  python3 build.py 01-today 02-alarms --src ../src

Template tags (pages and partials):
  {{> name}}                 partials/name.html (nested up to 4 deep)
  {{> name key="value" ...}} the same, with parameters: {{@key}} inside the partial (or
                             {{@key|default}}) becomes the value
  {{title}}                  from <!-- title: ... --> on the page's first line (else config default_title)
  {{tokens}}                 tokens.json as the Tailwind config, light and dark custom properties, the
                             .t-<role> type classes (rem) and the device metrics (tokens.py)
  {{fonts}}                  the font <link>s from tokens.json
  {{lang}} {{theme}}         config lang; "light" or "dark" (the html class)
  {{prefix}}                 config prefix (the root id is {{prefix}}-root)
  {{board:colors}}           the board's swatches: every semantic token in light and dark, then primitives
  {{board:type}}             the board's type specimen: every .t-<role> with its points
  {{img:key}}                uploaded content asset URL from asset-map.json (unknown key = hard stop)
  {{brand-key}}              config.json brand_urls (logo, app-icon ...)
Then config.json "inject" partials go just before </body>, links.json turns #hash placeholders into
draft links (links.py), and every <iconify-icon> gets `noobserver`.

Dark twins: pages listed in config "dark_pages" (or "all") are also built as <page>--dark.html with
<html class="dark">; their canvas title is the page's title + " · Dark" and their links go to dark twins.

Draft contract (PROBLEMS, exit 1): doctype; <body> without a class; one root element in <body>
(scripts, styles and templates aside) and it carries class "screen" and data-screen="fixed" or
"scroll"; unique id on every <a>; hrefs only https://, #hash, mailto: or tel:; no nested anchors; no
duplicate ids; no unrendered {{tags}}; no forbidden strings; images only from uploaded URLs; every
<img> has alt, empty alt only with aria-hidden="true".

Handoff contract (warnings; errors when config "contract" is "error"; off for config
"reference_pages", default any page with "design-system" in its name): every element child of
<main> is a <section> with data-block="kebab-name" and aria-labelledby (pointing at an existing id)
or aria-label; exactly one <h1> (the screen title); no vh, dvh or h-screen sizing (use the device
metrics); no arbitrary hex colors (tokens only); no inline <script> in page sources; no .eyebrow when
config "eyebrows" is false; no bare text inside layout elements (React Native renders text only
inside <Text>: wrap it in p, span, a heading, label or button).

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
import tokens as tk  # noqa: E402

KEBAB = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
VH = re.compile(r"(?<![\w-])(?:h-screen|max-h-screen|min-h-screen|h-dvh|min-h-dvh|h-svh|h-lvh)\b|\[\d+(?:\.\d+)?[dsl]?vh\]|:\s*\d+(?:\.\d+)?[dsl]?vh\b")
HEX_CLASS = re.compile(r"\b[\w:-]+-\[#[0-9a-fA-F]{3,8}\]")
PARTIAL = re.compile(r"\{\{>\s*([\w-]+)((?:\s+[\w-]+=\"[^\"]*\")*)\s*\}\}")
PARAM = re.compile(r"\{\{@([\w-]+)(?:\|([^}]*))?\}\}")
TEXT_OK = {"p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "button", "a", "strong", "em", "b", "i", "small",
           "time", "figcaption", "blockquote", "dt", "dd", "li", "td", "th", "legend", "option", "kbd", "mark", "sup",
           "sub", "code", "summary", "caption", "q", "abbr", "cite", "output", "title", "textarea", "s", "u", "del", "ins"}
LAYOUT = {"div", "section", "main", "article", "header", "footer", "nav", "aside", "ul", "ol", "figure", "form", "dl", "fieldset", "details"}


class Builder:
    def __init__(self, src, out):
        self.src = Path(src)
        self.out = Path(out)
        self.cfg = json.loads((self.src / "config.json").read_text())
        tok = self.src / "tokens.json"
        if not tok.exists():
            raise SystemExit(f"no tokens.json in {self.src}: copy templates/tokens.example.json")
        self.tokens = tk.load(tok)
        self.head_tokens = tk.head_block(self.tokens, self.cfg)
        self.fonts = tk.font_links(self.tokens)
        amap = self.src / "asset-map.json"
        self.assets = json.loads(amap.read_text()) if amap.exists() else {}
        self.links = None
        if (self.src / "links.json").exists():
            import links  # noqa: E402  (this folder)

            self.links = links
            self.link_cfg, self.drafts = links.load(self.src)

    # rendering ---------------------------------------------------------------
    def render(self, text, theme="light", depth=0, params=None):
        if depth > 4:
            raise SystemExit("partial recursion too deep (more than 4 levels)")
        if params is not None:
            text = PARAM.sub(lambda m: params.get(m.group(1), m.group(2) if m.group(2) is not None else ""), text)

        def partial(m):
            p = self.src / "partials" / f"{m.group(1)}.html"
            if not p.exists():
                raise SystemExit(f"unknown partial: {m.group(1)} (looked for {p})")
            args = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(2) or ""))
            return self.render(p.read_text(), theme, depth + 1, args)

        text = PARTIAL.sub(partial, text)

        def img(m):
            key = m.group(1)
            if key not in self.assets:
                raise SystemExit(f"unknown image key: {key} (not in asset-map.json)")
            return self.assets[key]

        text = re.sub(r"\{\{img:([\w-]+)\}\}", img, text)
        for k, v in self.cfg.get("brand_urls", {}).items():
            text = text.replace("{{" + k + "}}", v)
        if "{{board:" in text:
            text = text.replace("{{board:colors}}", self.board_colors()).replace("{{board:type}}", self.board_type())
        text = (text.replace("{{tokens}}", self.head_tokens).replace("{{fonts}}", self.fonts)
                .replace("{{lang}}", self.cfg.get("lang", "en")).replace("{{theme}}", theme)
                .replace("{{prefix}}", self.cfg.get("prefix", "xyz")))
        return re.sub(r"<iconify-icon (?!noobserver)", "<iconify-icon noobserver ", text)

    # the board, generated from tokens.json so it cannot drift ---------------------
    def board_colors(self):
        pal = tk.flatten(self.tokens.get("colors", {}))
        sem = self.tokens.get("semantic") or {}
        out = ['<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">']
        for theme, m in sem.items():
            cls = "dark" if theme == "dark" else ""
            out.append(f'<div class="{cls} rounded-xl bg-bg p-6 text-fg"><p class="t-headline">{theme.title()} theme</p><ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" role="list">')
            for name, val in m.items():
                out.append(f'<li class="overflow-hidden rounded-lg bg-surface shadow-card"><span class="block h-14 border-b border-line bg-{name}"></span>'
                           f'<span class="block px-3 py-2"><span class="block t-footnote font-semibold">{name}</span><span class="block t-caption text-fg-muted">{val}</span></span></li>')
            out.append("</ul></div>")
        out.append('</div><ul class="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-8" role="list">')
        for name, hexv in pal.items():
            out.append(f'<li><span class="block h-10 rounded-md border border-line" style="background:{hexv}"></span><span class="mt-1 block t-caption">{name}</span>'
                       f'<span class="block t-caption text-fg-muted">{hexv}</span></li>')
        out.append("</ul>")
        return "\n".join(out)

    def board_type(self):
        out = ['<ul class="space-y-5" role="list">']
        for name, r in (self.tokens.get("type") or {}).items():
            out.append(f'<li class="grid grid-cols-1 items-baseline gap-2 sm:grid-cols-4"><span class="t-footnote text-fg-muted"><span class="block font-semibold text-fg">.t-{name}</span>'
                       f'{r.get("size")}/{r.get("lh")} pt · {r.get("weight", 400)}</span><span class="t-{name} sm:col-span-3">Clear type on every screen</span></li>')
        out.append("</ul>")
        return "\n".join(out)

    def build(self, name, theme="light"):
        page = name[:-6] if name.endswith("--dark") else name
        src = (self.src / "pages" / f"{page}.html").read_text()
        m = re.match(r"\s*<!--\s*title:\s*(.*?)\s*-->\s*", src)
        title = m.group(1) if m else self.cfg.get("default_title", "Untitled")
        body = src[m.end():] if m else src
        html = self.render(body, theme).replace("{{title}}", title)
        for part in self.cfg.get("inject", []):
            layer = self.render((self.src / "partials" / f"{part}.html").read_text(), theme)
            cut = html.rfind("</body>")
            html = html[:cut] + layer + "\n" + html[cut:] if cut > -1 else html + layer
        stats = None
        if self.links:
            html, stats = self.links.apply(name, html, self.link_cfg, self.drafts)
        return src, html, stats

    def dark_pages(self, pages):
        d = self.cfg.get("dark_pages", [])
        return list(pages) if d == "all" else [p for p in pages if p in d]

    # draft contract ------------------------------------------------------------
    def problems(self, html, doc):
        out = []
        if not html.lstrip().lower().startswith("<!doctype html>"):
            out.append("missing <!DOCTYPE html>")
        body = doc.find("body")
        if body is None:
            out.append("no <body>")
        else:
            if "class" in body.attrs:
                out.append("<body> has a class")
            roots = [e for e in body.elements() if e.tag not in ("script", "style", "template", "link", "noscript")]
            if len(roots) != 1:
                out.append(f"<body> needs one root element, found {len(roots)}: {roots[:3]}")
            elif "screen" not in roots[0].classes or roots[0].attrs.get("data-screen") not in ("fixed", "scroll"):
                out.append('root element needs class "screen" and data-screen="fixed" or "scroll"')
        anchors = list(doc.find_all("a"))
        for a in anchors:
            if not a.attrs.get("id"):
                out.append(f"<a> without id: {a!r} '{a.text()[:40]}'")
            href = a.attrs.get("href")
            if href is not None and not href.startswith(("#", "https://", "mailto:", "tel:")):
                out.append(f"href must be https://, #hash, mailto: or tel:, got: {href[:60]}")
            if any(p.tag == "a" for p in a.ancestors()):
                out.append(f"nested <a>: {a!r}")
        ids = Counter(re.findall(r'\bid="([^"]+)"', html))
        dups = [k for k, v in ids.items() if v > 1]
        if dups:
            out.append(f"duplicate ids: {dups[:8]}")
        if "{{" in html:
            i = html.index("{{")
            out.append("unrendered template tag: " + html[i:i + 40])
        for bad in self.cfg.get("forbidden", []) + ['src="/', 'src="./']:
            if bad in html:
                out.append(f"forbidden string: {bad}")
        for img in doc.find_all("img"):
            if "alt" not in img.attrs:
                out.append(f"<img> without alt: {img.attrs.get('src', '')[-50:]}")
            elif img.attrs["alt"] == "" and img.attrs.get("aria-hidden") != "true":
                out.append(f"empty alt without aria-hidden: {img.attrs.get('src', '')[-50:]}")
        return out

    # handoff contract (React Native readiness) -----------------------------------
    def warnings(self, name, page_src, doc):
        refs = self.cfg.get("reference_pages")
        base = name[:-6] if name.endswith("--dark") else name
        if refs is None:
            refs = [n for n in [base] if "design-system" in n]
        if base in refs:
            return []
        out = []
        main = doc.find("main")
        if main is None:
            out.append("no <main>: screen sections are read from inside <main>")
        else:
            ids = {n.attrs["id"] for n in doc.find_all(attr="id")}
            for el in main.elements():
                if el.tag in ("script", "style", "template"):
                    continue
                if el.tag != "section":
                    out.append(f"<main> child is not a <section>: {el!r} (wrap it in a block)")
                    continue
                block = el.attrs.get("data-block")
                label = el.attrs.get("aria-labelledby")
                where = block or label or repr(el)
                if not block:
                    out.append(f"section without data-block: {label or el.attrs.get('aria-label') or repr(el)}")
                elif not KEBAB.match(block):
                    out.append(f"data-block is not kebab-case: {block}")
                if not label and not el.attrs.get("aria-label"):
                    out.append(f"section without aria-labelledby or aria-label: {where}")
                elif label and label not in ids:
                    out.append(f"aria-labelledby points at a missing id: {label}")
        h1 = len(list(doc.find_all("h1")))
        if h1 != 1:
            out.append(f"{h1} <h1> elements (one per screen: its title)")
        for m in sorted(set(VH.findall(page_src)))[:3]:
            out.append(f"viewport sizing in a draft ({m.strip()}): use the device metrics (.screen, --status-h, --home-h)")
        hexes = sorted(set(HEX_CLASS.findall(page_src)))
        if hexes:
            out.append(f"arbitrary hex colors in page markup, use tokens: {', '.join(hexes[:4])}" + (" ..." if len(hexes) > 4 else ""))
        if re.search(r"<script\b", page_src):
            out.append("inline <script> in the page: move behavior to a partial behind a data-* hook")
        if self.cfg.get("eyebrows") is False and re.search(r'class="[^"]*\beyebrow\b', page_src):
            out.append("eyebrow used but config eyebrows is false (house rule: no eyebrows)")
        bare = []
        root = doc.find("body")
        for n in (root.iter() if root is not None else []):
            if n.tag == "#text" and n.data.strip() and n.parent is not None and n.parent.tag in LAYOUT:
                if any(a.tag in ("script", "style", "template", "noscript") for a in n.ancestors()):
                    continue
                bare.append(f"{n.parent!r} '{n.data.strip()[:30]}'")
        if bare:
            out.append(f"bare text in a layout element ({len(bare)}): wrap it in <span> or <p> (React Native needs <Text>): {bare[0]}")
        return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*", default=["all"])
    ap.add_argument("--src")
    ap.add_argument("--out")
    ap.add_argument("--quiet", action="store_true", help="only print pages with problems or warnings")
    a = ap.parse_args()
    if a.src:
        src = Path(a.src)
    elif Path("config.json").exists():
        src = Path(".")
    else:
        src = HERE.parent / "src"
    src = src.resolve()
    out = Path(a.out).resolve() if a.out else src.parent / "tmp"
    out.mkdir(parents=True, exist_ok=True)
    b = Builder(src, out)
    strict = b.cfg.get("contract", "warn")
    pages = sorted(p.stem for p in (src / "pages").glob("*.html"))
    names = pages if a.names in (["all"], []) else a.names
    jobs = [(n, "light") for n in names] + [(n + "--dark", "dark") for n in b.dark_pages(names)]
    n_prob = n_warn = 0
    for name, theme in jobs:
        page_src, html, stats = b.build(name, theme)
        doc = htmltree.parse(html)
        probs = b.problems(html, doc)
        warns = [] if strict == "off" else b.warnings(name, page_src, doc)
        if strict == "error":
            probs, warns = probs + warns, []
        n_prob += len(probs)
        n_warn += len(warns)
        (out / f"{name}.html").write_text(html)
        if a.quiet and not probs and not warns:
            continue
        links = f", {stats['wired']} links wired" if stats else ""
        dead = f", dead ends: {', '.join(f'{k} x{v}' for k, v in stats['dead'].most_common(6))}" if stats and stats["dead"] else ""
        imgs = len(list(doc.find_all("img")))
        print(f"{name}: {len(html) // 1024}KB, {len(list(doc.find_all('a')))} links{links}, {imgs} imgs{dead}"
              + ("  PROBLEMS:" if probs else "") + (f"  {len(warns)} contract warnings" if warns else ""))
        for p in probs:
            print("   -", p)
        for w in warns[:6]:
            print("   ~", w)
        if len(warns) > 6:
            print(f"   ~ ... {len(warns) - 6} more")
    print(f"\n{len(jobs)} drafts -> {out}  |  {n_prob} problems, {n_warn} contract warnings")
    sys.exit(1 if n_prob else 0)


if __name__ == "__main__":
    main()
