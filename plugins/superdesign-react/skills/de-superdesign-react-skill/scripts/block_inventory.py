#!/usr/bin/env python3
"""Block inventory: read built React drafts and list every future app component (block), shared
component, route, interaction hook, form and placeholder, so the React app build can be planned.

Every element child of <main> is one block (<Block name>): one React component with typed props in
the app. With the handoff contract in place each one carries data-block="<kebab-name>" and the
inventory is exact; a section without it gets a suggested name from the aria-label or heading.
Routes and shared components come from tmp/_manifest.json (written by build.mjs from each page's
`meta` export and its bundle's imports).

For each block it reports how many times and on which pages it is used, a guessed kind (hero,
cards, steps, faq, form, stats, media-text, ticker, cta-band, content), guessed props (heading and
level, eyebrow, intro, buttons, image, arrays with their item fields, form fields), the surfaces
(background token classes) it sits on and the data-* hooks inside it.

Usage:
  python3 block_inventory.py .superdesign/tmp --src .superdesign/src --out .superdesign/handoff/block-inventory.md
  python3 block_inventory.py .superdesign/tmp --src .superdesign/src --format json --out .superdesign/handoff/block-inventory.json
  python3 block_inventory.py .superdesign/tmp/01-home.html .superdesign/tmp/02-services.html

Options:
  --src DIR        .superdesign/src: config.json (reference_pages) and content/ (PLACEHOLDER count).
  --manifest FILE  build manifest (default: _manifest.json next to the built drafts).
  --format md|json Markdown for people (default) or JSON for scripts.
  --out FILE       Write there instead of stdout.
  --no-pages       Leave out the per-page section tables (Markdown only).

Pages named *design-system* (or listed in config "reference_pages") are reference boards and are
not inventoried. Pages named *mobile* are responsive views: their sections are listed with the
desktop pages but counted separately.

Standard library only.
"""
import argparse
import datetime
import json
import re
import sys
from collections import Counter, OrderedDict, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import htmltree  # noqa: E402

BLOCKISH = {"li", "article", "figure", "div", "a", "section", "details", "tr", "button", "blockquote", "dd", "label"}
SKIP = {"script", "style", "template", "noscript", "br", "iconify-icon", "svg", "i"}
HEADINGS = ("h1", "h2", "h3", "h4", "h5", "h6")
STOP = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at", "your", "our", "is", "it", "its", "you", "we"}


def kebab(text, words=4):
    text = re.sub(r"[’'`]", "", text.lower())
    parts = [w for w in re.split(r"[^a-z0-9]+", text) if w]
    return "-".join(parts[:words])


def heading_words(text, words=3):
    parts = [w for w in re.split(r"[^a-z0-9]+", re.sub(r"[’'`]", "", text.lower())) if w and w not in STOP]
    return "-".join(parts[:words])


def hidden(node):
    return node.attrs.get("aria-hidden") == "true" or any(a.attrs.get("aria-hidden") == "true" for a in node.ancestors())


def is_decorative_img(img):
    return img.attrs.get("alt", "") == "" or hidden(img)


def walk(node, stop=None):
    """Elements under node, not descending into `stop` nodes or hidden or script-like subtrees."""
    for c in node.elements():
        if c.tag in ("script", "style", "template", "noscript"):
            continue
        yield c
        if stop and c in stop:
            continue
        if c.attrs.get("aria-hidden") == "true":
            continue
        yield from walk(c, stop)


NATURAL = {"li", "article", "figure", "details", "tr", "dd", "blockquote", "button", "a", "label"}


def _shape(m):
    """What a repeated item holds: heading level and whether it has an image."""
    h = next((t for t in HEADINGS if m.find(t)), "")
    return (h, bool(m.find("img")))


def repeaters(section, heading_el=None):
    """Groups of 3+ same-tag siblings with content: the repeated markup that becomes an array prop or list data.
    List-like tags count as they are; div and section groups count only when they look alike (same
    first class and the same heading level or image), so layout wrappers are not mistaken for items."""
    groups = []
    for el in [section] + list(walk(section)):
        kids = [c for c in el.elements() if c.tag in BLOCKISH and c.attrs.get("aria-hidden") != "true"]
        by_tag = defaultdict(list)
        for c in kids:
            by_tag[c.tag].append(c)
        for tag, members in by_tag.items():
            members = [m for m in members if m.text() or m.find("img")]
            if heading_el is not None:
                members = [m for m in members if m is not heading_el and heading_el not in list(m.iter())]
            if len(members) < 3:
                continue
            if tag not in NATURAL:
                firsts = Counter((m.classes or [""])[0] for m in members)
                shapes = Counter(_shape(m) for m in members)
                cls, n_cls = firsts.most_common(1)[0]
                shape, n_shape = shapes.most_common(1)[0]
                if n_cls < 3 or n_shape < 3 or shape == ("", False):
                    continue
                members = [m for m in members if (m.classes or [""])[0] == cls]
            groups.append((el, tag, members))
    # keep outermost groups: drop a group whose parent sits inside another group's member
    chosen = []
    member_sets = [set(m) for _, _, m in groups]
    for i, (parent, tag, members) in enumerate(groups):
        if not any(i != j and any(a in ms for a in [parent] + list(parent.ancestors())) for j, ms in enumerate(member_sets)):
            chosen.append((parent, tag, members))
    return chosen


def item_fields(member):
    f = []
    for t in HEADINGS:
        if member.find(t):
            f.append(f"title ({t})")
            break
    imgs = list(member.find_all("img"))
    if any(not is_decorative_img(i) for i in imgs):
        f.append("image")
    elif imgs:
        f.append("icon or avatar")
    if member.find("iconify-icon") and "icon or avatar" not in f:
        f.append("icon")
    if member.find("blockquote") or member.tag == "blockquote":
        f.append("quote")
    if member.find("p"):
        f.append("text")
    if member.find("dl"):
        f.append("stats")
    if member.tag == "a" or member.find("a") or member.find("button"):
        f.append("link")
    if member.tag == "details" or member.find("details"):
        f.append("question and answer")
    head = next((member.find(t) for t in HEADINGS if member.find(t)), None)
    rest = member.text().replace(head.text(), "", 1) if head is not None else member.text()
    if rest.strip() and not {"text", "quote", "question and answer"} & set(f):
        f.append("text")
    return f


def guess_kind(section, index, reps, form, has_heading):
    if index == 0:
        return "hero"
    if not has_heading and any("marquee" in e.classes or any("marquee" in k for k in e.attrs) for e in section.find_all()):
        return "ticker"
    if form is not None and form.attrs.get("role") != "search" and "data-finder" not in form.attrs:
        return "form"
    if len(list(section.find_all("details"))) >= 3:
        return "faq"
    if reps:
        parent, tag, members = max(reps, key=lambda r: len(r[2]))
        if parent.tag == "ol" or (members and all(m.text()[:2].strip().isdigit() for m in members[:3])):
            return "steps"
        if tag in ("article", "figure", "a") or any("card" in m.classes or m.find("article") is not None for m in members):
            return "cards"
        if section.find("table"):
            return "table"
        return "list"
    if section.find("dl"):
        return "stats"
    if section.find("table"):
        return "table"
    big_imgs = [i for i in section.find_all("img") if not is_decorative_img(i)]
    if big_imgs:
        return "media-text"
    if len([a for a in section.find_all("a") if any(c.startswith("btn") for c in a.classes)]) and len(section.text()) < 400:
        return "cta-band"
    return "content"


def surfaces(section):
    out = [c for c in section.classes if re.match(r"^(bg|on)-[a-z]", c) and not c.startswith("bg-gradient") and not c.startswith("bg-[")]
    return out


def form_info(form, doc):
    labels = {lab.attrs.get("for"): lab.text() for lab in doc.find_all("label") if lab.attrs.get("for")}
    fields = []
    for el in form.iter():
        if el.tag in ("input", "select", "textarea") and el.attrs.get("type") not in ("hidden", "submit", "button"):
            key = el.attrs.get("name") or el.attrs.get("id") or el.tag
            typ = el.attrs.get("type", el.tag)
            if fields and fields[-1]["field"] == key and fields[-1]["type"].split(" ")[0] == typ and typ in ("radio", "checkbox"):
                n = int(fields[-1]["type"].split(" x")[-1]) if " x" in fields[-1]["type"] else 1
                fields[-1]["type"] = f"{typ} x{n + 1}"
                continue
            lab = labels.get(el.attrs.get("id"), "") or el.attrs.get("aria-label", "") or el.attrs.get("placeholder", "")
            fields.append({"field": key, "type": typ, "label": lab[:48], "required": "required" in el.attrs})
    if form.attrs.get("role") == "search" or "data-finder" in form.attrs:
        purpose = "search"
    elif [f["type"] for f in fields][:1] == ["email"] and len([f for f in fields if f["type"] in ("text", "tel", "textarea", "select")]) == 0:
        purpose = "newsletter"
    else:
        purpose = "enquiry"
    return {"id": form.attrs.get("id") or form.attrs.get("aria-labelledby") or form.attrs.get("data-form") or "", "purpose": purpose, "fields": fields}


def hooks_in(node):
    names = Counter()
    for el in walk(node):
        for k in el.attrs:
            if k.startswith("data-") and k not in ("data-block", "data-placeholder", "data-repeater"):
                names[k] += 1
    if node.tag != "#document":
        for k in node.attrs:
            if k.startswith("data-") and k not in ("data-block",):
                names[k] += 1
    return names


def analyse_section(sec, index, doc, all_ids):
    label_id = sec.attrs.get("aria-labelledby")
    heading_el = all_ids.get(label_id) if label_id else None
    if heading_el is None:
        for t in HEADINGS:
            heading_el = sec.find(t)
            if heading_el:
                break
    heading = heading_el.text() if heading_el is not None else ""
    if not heading:
        heading = sec.attrs.get("aria-label", "")
    block = sec.attrs.get("data-block")
    comment = sec.prev_comment()
    if block:
        name, source = block, "data-block"
    else:
        label = re.split(r"[:+(—–]| - ", comment)[0].strip() if comment else ""
        if label and len(label) <= 40:
            name, source = kebab(label), "comment"
        elif index == 0:
            name, source = "hero", "first section"
        elif sec.attrs.get("aria-label"):
            name, source = heading_words(sec.attrs["aria-label"]), "aria-label"
        elif heading:
            name, source = heading_words(heading), "heading"
        else:
            name, source = f"section-{index + 1}", "position"
    reps = repeaters(sec, heading_el)
    rep_members = set()
    for _, _, members in reps:
        rep_members.update(members)
    forms = list(sec.find_all("form"))
    form = forms[0] if forms else None
    fields = []
    if heading_el is not None and heading_el.tag in HEADINGS:
        fields.append(f"heading ({heading_el.tag})")
    elif heading:
        fields.append("label (aria-label)")
    top = list(walk(sec, stop=rep_members))
    if any("eyebrow" in e.classes for e in top):
        fields.append("eyebrow")
    if any("lead" in e.classes for e in top):
        fields.append("intro")
    btns = [e for e in top if e.tag in ("a", "button") and any(c.startswith("btn") for c in e.classes)]
    if btns:
        fields.append(f"buttons x{len(btns)}")
    imgs = [e for e in top if e.tag == "img" and not is_decorative_img(e)]
    if imgs:
        fields.append("image" if len(imgs) == 1 else f"images x{len(imgs)}")
    for parent, tag, members in sorted(reps, key=lambda r: -len(r[2]))[:3]:
        name_hint = parent.attrs.get("data-repeater") or "items"
        fields.append(f"{name_hint}[{len(members)}] {tag}: " + ", ".join(item_fields(members[0])))
    for f in forms:
        info = form_info(f, doc)
        fields.append(f"{info['purpose']} form ({len(info['fields'])} fields)")
    placeholders = len(list(sec.find_all(attr="data-placeholder"))) + sec.text().count("PLACEHOLDER")
    return {
        "block": name,
        "source": source,
        "heading": heading[:70],
        "kind": guess_kind(sec, index, reps, form, bool(label_id)),
        "fields": fields,
        "surfaces": surfaces(sec),
        "hooks": sorted(hooks_in(sec)),
        "placeholders": placeholders,
        "id": sec.attrs.get("id", ""),
    }


def guess_route(name, man):
    m = man.get(name) or {}
    if m.get("route"):
        return m["route"] + (f" ({m['template']})" if m.get("template") else "")
    n = name.lower()
    if "mobile" in n:
        return "responsive view (no route)"
    if re.search(r"(^|-)home$", re.sub(r"^\d+-", "", n)):
        return "/ (guessed)"
    if "404" in n or "search" in n:
        return "not-found + /search (guessed)"
    if re.search(r"(sent|thanks|thank-you|confirm|received)$", n):
        return "a state of the form route (guessed)"
    return "/" + re.sub(r"^\d+-", "", n) + " (guessed)"


def components_used(name, man):
    return [c.split("/", 1)[-1] for c in (man.get(name) or {}).get("components", [])]


COMPONENT_KINDS = [
    ("layout", "app layout (Next.js app/layout.tsx or a router layout route)"),
    ("header", "site header: layout component; menu data from CMS or config"),
    ("megamenu", "disclosure menu: client component"),
    ("utility", "utility bar: part of the header (Pause animation)"),
    ("footer", "site footer: layout component; columns from CMS, facts from site config"),
    ("finder", "search dialog: client component + search endpoint or JSON index"),
    ("palette", "search dialog: client component + search endpoint or JSON index"),
    ("motion", "motion layer: useGSAP hooks in the owning components"),
]


def component_kind(name):
    n = name.lower()
    for key, kind in COMPONENT_KINDS:
        if key in n:
            return kind
    return "shared component (props from the block inventory)"


def inventory(files, src, manifest=None):
    cfg = {}
    if src and (src / "config.json").exists():
        cfg = json.loads((src / "config.json").read_text())
    refs = cfg.get("reference_pages")
    mpath = Path(manifest) if manifest else (files[0].parent / "_manifest.json" if files else None)
    man = json.loads(mpath.read_text()) if mpath and mpath.exists() else {}
    pages = OrderedDict()
    blocks = OrderedDict()
    hooks = defaultdict(lambda: {"count": 0, "pages": []})
    forms = []
    marked = total = 0
    for f in files:
        name = f.stem
        if name.startswith("_"):
            continue
        html = f.read_text()
        doc = htmltree.parse(html)
        title_el = doc.find("title")
        reference = (name in refs) if refs is not None else "design-system" in name
        mobile = "mobile" in name
        entry = {"title": title_el.text() if title_el is not None else "", "template": "reference board (not built)" if reference else guess_route(name, man),
                 "mobile": mobile, "reference": reference, "sections": [], "outside_main": [], "partials": components_used(name, man)}
        pages[name] = entry
        if reference:
            continue
        all_ids = {n.attrs["id"]: n for n in doc.find_all(attr="id")}
        main = doc.find("main")
        body = doc.find("body")
        if main is not None:
            kids = [e for e in main.elements() if e.tag not in ("script", "style", "template")]
            for i, sec in enumerate(kids):
                info = analyse_section(sec, i, doc, all_ids)
                if sec.tag != "section":
                    info["note"] = f"<{sec.tag}> in main, not a section"
                total += 1
                marked += info["source"] == "data-block"
                entry["sections"].append(info)
                b = blocks.setdefault(info["block"], {"kinds": Counter(), "uses": 0, "mobile_uses": 0, "pages": [], "fields": Counter(), "surfaces": Counter(), "hooks": Counter(), "headings": [], "sources": Counter()})
                b["uses" if not mobile else "mobile_uses"] += 1
                if name not in b["pages"]:
                    b["pages"].append(name)
                b["kinds"][info["kind"]] += 1
                b["sources"][info["source"]] += 1
                for fld in info["fields"]:
                    b["fields"][re.sub(r"\[\d+\]", "[]", re.sub(r" x\d+", "", fld))] += 1
                for s in info["surfaces"]:
                    b["surfaces"][s] += 1
                for h in info["hooks"]:
                    b["hooks"][h] += 1
                if info["heading"] and len(b["headings"]) < 2 and info["heading"] not in b["headings"]:
                    b["headings"].append(info["heading"])
        if body is not None:
            for el in body.iter():
                if el.tag in ("header", "footer", "section"):
                    if main is not None and main in list(el.ancestors()):
                        continue
                    lab = el.attrs.get("aria-labelledby") or el.attrs.get("aria-label") or el.tag
                    entry["outside_main"].append(f"{el.tag}:{lab}")
            for k, v in hooks_in(body).items():
                hooks[k]["count"] += v
                if name not in hooks[k]["pages"]:
                    hooks[k]["pages"].append(name)
            for fm in body.find_all("form"):
                info = form_info(fm, doc)
                info["page"] = name
                forms.append(info)
        entry["placeholders"] = len(list(doc.find_all(attr="data-placeholder"))) + (body.text().count("PLACEHOLDER") if body is not None else 0)
    content_placeholders = 0
    if src and (src / "content").exists():
        for f in sorted((src / "content").rglob("*.ts")):
            content_placeholders += sum(1 for line in f.read_text().splitlines() if "PLACEHOLDER" in line and "status:" in line)
    partial_kinds = {}
    for comp in sorted({c for e in pages.values() for c in e["partials"]}):
        users = [n for n, e in pages.items() if comp in e["partials"]]
        partial_kinds[comp] = {"maps_to": component_kind(comp), "pages": len(users)}
    return {
        "generated": datetime.date.today().isoformat(),
        "mode": "data-block" if total and marked == total else ("mixed" if marked else "fallback"),
        "sections": total,
        "marked": marked,
        "pages": pages,
        "blocks": blocks,
        "hooks": dict(sorted(hooks.items(), key=lambda kv: -kv[1]["count"])),
        "forms": forms,
        "partials": partial_kinds,
        "content_placeholders": content_placeholders,
    }


def cell(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


def merge_candidates(blocks):
    """Groups of 2+ block names that share a kind and a field shape (hero excluded: every page has one)."""
    groups = defaultdict(list)
    for name, b in blocks.items():
        kind = b["kinds"].most_common(1)[0][0]
        if kind in ("hero", "content"):
            continue
        shape = frozenset(re.sub(r"^(\w+)\[\]", "items[]", f.split(":")[0]) for f in b["fields"])
        groups[(kind, shape)].append(name)
    return sorted(((k[0], sorted(v)) for k, v in groups.items() if len(v) > 1), key=lambda kv: (kv[0], kv[1]))


def short_pages(names, limit=6):
    nums = [n.split("-")[0] if re.match(r"^\d+-", n) else n for n in names]
    return ", ".join(nums[:limit]) + (f" +{len(nums) - limit}" if len(nums) > limit else "")


def to_markdown(inv, with_pages=True):
    L = []
    pages = inv["pages"]
    desk = [n for n, e in pages.items() if not e["mobile"] and not e["reference"]]
    mob = [n for n, e in pages.items() if e["mobile"]]
    refs = [n for n, e in pages.items() if e["reference"]]
    L.append("# Block inventory\n")
    L.append(f"Generated {inv['generated']} by `block_inventory.py` from {len(pages)} built drafts "
             f"({len(desk)} desktop, {len(mob)} mobile, {len(refs)} reference). "
             f"{inv['sections']} sections in `<main>`, {inv['marked']} with `data-block`.\n")
    if inv["mode"] != "data-block":
        L.append("> **Fallback mode.** Not every section is a `<Block name>`, so some names below are suggestions "
                 "(from the first-section rule, aria-label or heading). Confirm or rename them, wrap the sections in "
                 "`<Block>`, and rebuild before the app build.\n")
    L.append("## Page to route\n")
    L.append("| Page | Title | Route | Blocks | Shared components |\n|---|---|---|---|---|")
    for n, e in pages.items():
        blocks = " · ".join(s["block"] for s in e["sections"]) if not e["reference"] else "n/a"
        parts = ", ".join(e["partials"])
        L.append(f"| {n} | {cell(e['title'][:60])} | {e['template']} | {blocks} | {parts} |")
    L.append("\n## Blocks\n")
    L.append("Each block becomes one React component. Uses count desktop pages; mobile views are listed separately. "
             "Props are guessed from the markup: `cards[] li: title (h3), text` means an array prop of items with those fields.\n")
    L.append("| Block | Kind | Uses | Mobile | Pages | Props (guessed) | Surfaces | Hooks | Example heading |\n|---|---|---|---|---|---|---|---|---|")
    for name, b in sorted(inv["blocks"].items(), key=lambda kv: (-kv[1]["uses"] - kv[1]["mobile_uses"], kv[0])):
        kind = b["kinds"].most_common(1)[0][0]
        fields = "; ".join(f for f, _ in b["fields"].most_common(6))
        surf = ", ".join(s for s, _ in b["surfaces"].most_common(4))
        hooks = ", ".join(h for h, _ in b["hooks"].most_common(5))
        src = "" if b["sources"].get("data-block") else " *"
        L.append(f"| `{name}`{src} | {kind} | {b['uses']} | {b['mobile_uses']} | {short_pages(b['pages'])} | {cell(fields)} | {surf} | {hooks} | {cell((b['headings'] or [''])[0][:50])} |")
    if inv["mode"] != "data-block":
        L.append("\n`*` suggested name (no `data-block` yet).")
    merge = merge_candidates(inv["blocks"])
    if merge:
        L.append("\n### Merge candidates\n")
        L.append("Blocks with the same kind and the same prop shape. They are often one component with a `variant` "
                 "prop under two names; decide before building.\n")
        for kind, names in merge:
            L.append(f"- {kind}: " + ", ".join(f"`{n}`" for n in names))
    if with_pages:
        L.append("\n## Sections by page\n")
        for n, e in pages.items():
            if e["reference"] or not e["sections"]:
                continue
            L.append(f"### {n}\n")
            L.append("| # | Block | Named from | Kind | Heading | Fields | Surface |\n|---|---|---|---|---|---|---|")
            for i, s in enumerate(e["sections"], 1):
                note = f" ({s['note']})" if s.get("note") else ""
                L.append(f"| {i} | `{s['block']}`{note} | {s['source']} | {s['kind']} | {cell(s['heading'][:48])} | {cell('; '.join(s['fields']))} | {', '.join(s['surfaces'][:2])} |")
            if e["outside_main"]:
                L.append(f"\nOutside `<main>`: {', '.join(dict.fromkeys(e['outside_main']))}\n")
            else:
                L.append("")
    if inv["partials"]:
        L.append("## Shared components\n")
        L.append("| Component | Pages | Becomes |\n|---|---|---|")
        for p, info in inv["partials"].items():
            L.append(f"| `{p}` | {info['pages']} | {info['maps_to']} |")
    L.append("\n## Interaction and motion hooks\n")
    L.append("`data-*` attributes in the server-rendered body (client-only states such as the open palette are not counted). "
             "Each becomes component state, an event handler or a useGSAP hook.\n")
    L.append("| Hook | Count | Pages |\n|---|---|---|")
    for k, v in inv["hooks"].items():
        L.append(f"| `{k}` | {v['count']} | {len(v['pages'])} |")
    L.append("\n## Forms\n")
    seen = OrderedDict()
    for f in inv["forms"]:
        key = (f["purpose"], f["id"], tuple(x["field"] for x in f["fields"]))
        seen.setdefault(key, {"form": f, "pages": []})["pages"].append(f["page"])
    L.append("| Purpose | Form | Fields | Pages |\n|---|---|---|---|")
    for (purpose, fid, _), v in seen.items():
        flds = ", ".join(f"{x['field']} ({x['type']}{', required' if x['required'] else ''})" for x in v["form"]["fields"])
        L.append(f"| {purpose} | {fid} | {cell(flds)} | {short_pages(v['pages'])} |")
    L.append("\n## Placeholders\n")
    ph = {n: e.get("placeholders", 0) for n, e in pages.items() if e.get("placeholders")}
    L.append(f"`data-placeholder` elements or visible PLACEHOLDER text on pages: {sum(ph.values())}"
             + (f" ({', '.join(f'{k} {v}' for k, v in ph.items())})" if ph else "") + ".")
    L.append(f"Facts with status 'PLACEHOLDER' in src/content: {inv['content_placeholders']}.\n")
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+", help="built drafts folder (.superdesign/tmp) or .html files")
    ap.add_argument("--src")
    ap.add_argument("--format", choices=["md", "json"], default="md")
    ap.add_argument("--out")
    ap.add_argument("--no-pages", action="store_true")
    ap.add_argument("--manifest")
    a = ap.parse_args()
    files = []
    for i in a.inputs:
        p = Path(i)
        files += sorted(f for f in p.glob("*.html") if not f.stem.startswith("_")) if p.is_dir() else [p]
    if not files:
        sys.exit("no .html files found")
    inv = inventory(files, Path(a.src) if a.src else None, a.manifest)
    if a.format == "json":
        def conv(o):
            if isinstance(o, Counter):
                return dict(o.most_common())
            raise TypeError(type(o))
        text = json.dumps(inv, indent=1, default=conv, ensure_ascii=False)
    else:
        text = to_markdown(inv, not a.no_pages)
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text)
        print(f"wrote {a.out}: {len(inv['pages'])} pages, {len(inv['blocks'])} blocks, {inv['sections']} sections ({inv['mode']})")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
