#!/usr/bin/env python3
"""Push built drafts to the Superdesign canvas: full-height frames, retries, no credits.

Commands (run from .superdesign/tools; --sd defaults to this script's parent's parent):
  import_drafts.py status
      Compare the canvas (fetch-design-nodes, read-only) with src/drafts.json and src/titles.json:
      pages without a draft, drafts missing from the canvas, titles on the canvas twice (a
      half-created frame from a failed import), canvas frames nobody tracks.
  import_drafts.py create [names...] --model <id>
      New drafts at FULL page height: --width from config (frame_widths[page], else the phone width
      for pages matching mobile_pattern, else frame_width) and --height = the still height from
      measure.js, which rejects unstyled or half-loaded renders. Never --device (it crops the frame to
      one screen). Pages over 10,000px are skipped: trim their padding and re-measure. Before each
      create the canvas is checked for the title, and after a transient failure it is checked AGAIN
      before any retry, so a frame half-created by a 5xx is adopted instead of duplicated. Writes
      src/drafts.json and src/heights.json (the frozen frame size, also for adopted frames).
  import_drafts.py update [names...] --model <id>
      Push pages as a new version of their draft (--into, revertible). Re-measures first and
      refuses a page whose height changed since its import, or that has no recorded height, unless
      --force; then the fix is to remove the extra height or create a new frame and supersede.
  import_drafts.py supersede <old-drafts.json> --model <id>
      Overwrite old frames with a "Replaced, safe to delete" card linking to the new draft. The
      CLI cannot delete or rename frames; the user deletes them by hand.

Options: --sd DIR, --model ID (the model that authored the HTML; default $DD_SD_MODEL; required for
create, update and supersede), --dry-run (print the commands; nothing is written), --force,
--wait MIN (wait up to MIN minutes for the API before starting), --nodes-file FILE (canvas state from
a saved `fetch-design-nodes --json` output).

config.json keys read: project_id, frame_width (default 1440), frame_widths {page: width},
mobile_width (390) with mobile_pattern ("mobile"; "" turns it off), device {width, height} (phone
skills: frames are never shorter than the device, and pages whose root has data-screen="fixed" must
measure exactly the device height), check_fonts (passed to measure.js).

The CLI is resolved by sdcli.py: $SUPERDESIGN_CLI, a `superdesign` binary, else
`npx --yes @superdesign/cli@latest`. Credit-spending commands are refused. Only the main session
imports; tracks never do. Standard library only; needs node + measure.js.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sdcli  # noqa: E402

MAX_H = 10000
BACKOFF = [5, 10, 20, 40, 80, 160]


class Canvas:
    def __init__(self, a):
        self.sd = Path(a.sd).resolve()
        self.src = self.sd / "src"
        self.tmp = self.sd / "tmp"
        self.dry = a.dry_run
        self.model = a.model
        self.cfg = json.loads((self.src / "config.json").read_text())
        self.pid = self.cfg.get("project_id")
        device = self.cfg.get("device") or {}
        self.device_h = int(device.get("height", 0) or 0)
        self.default_w = int(self.cfg.get("frame_width") or device.get("width") or self.cfg.get("desktop_width") or 1440)
        self.mobile_w = int(self.cfg.get("mobile_width", 390))
        self.mobile_pattern = self.cfg.get("mobile_pattern", "" if device else "mobile")
        self.widths = {k: int(v) for k, v in (self.cfg.get("frame_widths") or {}).items()}
        self.fonts = ",".join(self.cfg.get("check_fonts") or [])
        self.titles = self._load("titles.json")
        self.drafts = self._load("drafts.json")
        self.heights = self._load("heights.json")

    def _load(self, name):
        p = self.src / name
        return json.loads(p.read_text()) if p.exists() else {}

    def _save(self, name, data):
        if not self.dry:
            (self.src / name).write_text(json.dumps(dict(sorted(data.items())), indent=1, ensure_ascii=False) + "\n")

    def width(self, name):
        if name in self.widths:
            return self.widths[name]
        if self.mobile_pattern and self.mobile_pattern in name:
            return self.mobile_w
        return self.default_w

    def min_height(self, name):
        return self.device_h if self.device_h and self.width(name) < 600 else 0

    def fixed_screen(self, name):
        f = self.tmp / f"{name}.html"
        # an attribute inside a tag, not the .screen[data-screen="fixed"] rule in the head's CSS
        return f.exists() and re.search(r'<[^>]*\sdata-screen="fixed"', f.read_text()) is not None

    def need_model(self):
        if not self.model and self.dry:
            self.model = "<model>"
        if not self.model:
            sys.exit("pass --model <id of the model that authored the HTML> (or set DD_SD_MODEL)")

    def pages(self):
        return sorted(p.stem for p in self.tmp.glob("*.html") if not p.stem.startswith("_"))

    def title_for(self, name):
        """titles.json, else a dark twin (<page>--dark) borrows its page's title + ' · Dark'."""
        if name in self.titles:
            return self.titles[name]
        if name.endswith("--dark") and name[:-6] in self.titles:
            return self.titles[name[:-6]] + " · Dark"
        return None

    def cli(self, args, write=True, retry=True):
        if write and self.dry:
            print("   would run: " + sdcli.printable(args))
            return {"draftId": "(dry run)"}
        for attempt in range(len(BACKOFF) + 1):
            j, err = sdcli.run(args, cwd=self.sd)
            if j is not None:
                return j
            if not retry or not sdcli.transient(err) or attempt == len(BACKOFF):
                return {"error": err}
            print(f"   transient error, retry {attempt + 1} in {BACKOFF[attempt]}s: {err.strip()[:90]}", flush=True)
            time.sleep(BACKOFF[attempt])
        return {"error": "gave up"}

    def nodes(self, nodes_file=None):
        if nodes_file:
            return json.loads(Path(nodes_file).read_text()).get("nodes", [])
        j = self.cli(["fetch-design-nodes", "--project-id", self.pid], write=False)
        if "error" in j:
            sys.exit("fetch-design-nodes failed: " + j["error"][:200])
        return j.get("nodes", [])

    def measure(self, names):
        out = {}
        for w in sorted({self.width(n) for n in names}):
            group = [n for n in names if self.width(n) == w]
            files = [str(self.tmp / f"{n}.html") for n in group]
            mins = {self.min_height(n) for n in group}
            for mn in sorted(mins):
                sub = [f for n, f in zip(group, files) if self.min_height(n) == mn]
                cmd = ["node", str(HERE / "measure.js"), str(w), *sub, "--min", str(mn)]
                if self.fonts:
                    cmd += ["--fonts", self.fonts]
                r = subprocess.run(cmd, capture_output=True, text=True)
                if r.returncode == 2:
                    sys.exit(r.stderr.strip())
                for line in r.stdout.splitlines():
                    parts = line.split()
                    if len(parts) >= 2:
                        out[parts[0]] = int(parts[1]) if parts[1].isdigit() else " ".join(parts[1:])
        return out


def node_size(node):
    w, h = node.get("width"), node.get("height")
    if isinstance(node.get("size"), dict):
        w, h = node["size"].get("width", w), node["size"].get("height", h)
    return (int(w), int(h)) if isinstance(w, (int, float)) and isinstance(h, (int, float)) else (None, None)


def cmd_status(c, a):
    nodes = c.nodes(a.nodes_file)
    by_title = {}
    for n in nodes:
        by_title.setdefault(n["title"], []).append(n["id"])
    ids = {n["id"] for n in nodes}
    pages = c.pages() or sorted(c.titles)
    issues = 0
    for p in pages:
        t = c.title_for(p)
        d = c.drafts.get(p)
        if not t:
            print(f"{p}: no title in titles.json")
            issues += 1
        if not d:
            print(f"{p}: no draft yet" + (f" (but '{t}' is on the canvas: {by_title[t]}; adopt it with create)" if t in by_title else ""))
            issues += 1
        elif d not in ids:
            print(f"{p}: draft {d} is not on the canvas (deleted?)")
            issues += 1
        elif p not in c.heights:
            print(f"{p}: draft {d} has no frozen height in heights.json (run create to adopt, or check the frame)")
            issues += 1
    for t, lst in by_title.items():
        if len(lst) > 1:
            print(f"duplicate title on canvas: '{t}' x{len(lst)} {lst} (keep the one in drafts.json, ask the user to delete the rest)")
            issues += 1
    tracked = set(c.drafts.values())
    stray = [n for n in nodes if n["id"] not in tracked]
    if stray:
        print(f"{len(stray)} canvas frames not in drafts.json: " + ", ".join(f"'{n['title']}'" for n in stray[:8]))
    print(f"\n{len(pages)} pages, {len(c.drafts)} drafts tracked, {len(nodes)} frames on the canvas, {issues} issues.")
    return 1 if issues else 0


def adopt(c, name, node, w, h):
    nw, nh = node_size(node)
    c.drafts[name] = node["id"]
    c.heights[name] = {"w": nw or w, "h": nh or h, "adopted": True}
    c._save("drafts.json", c.drafts)
    c._save("heights.json", c.heights)
    src = "the canvas" if nh else "this measurement (the canvas did not report a size: check the frame)"
    print(name, f"ADOPTED: '{node['title']}' is already on the canvas ({node['id']}); size {c.heights[name]['w']}x{c.heights[name]['h']} from {src}")


def cmd_create(c, a):
    c.need_model()
    names = a.names or [n for n in (c.pages() or sorted(c.titles)) if n not in c.drafts and c.title_for(n)]
    if not names:
        print("nothing to create: every built page with a title has a draft")
        return 0
    hs = c.measure(names)
    existing = {}
    for n in c.nodes(a.nodes_file):
        existing.setdefault(n["title"], n)
    bad = 0
    for n in names:
        h = hs.get(n)
        title = c.title_for(n)
        w = c.width(n)
        if not title:
            print(n, "SKIPPED: no title in titles.json")
            bad += 1
            continue
        if not isinstance(h, int):
            print(n, "SKIPPED: measure failed:", h)
            bad += 1
            continue
        if h > MAX_H:
            print(n, f"SKIPPED: height {h} > {MAX_H}: tighten padding and re-measure")
            bad += 1
            continue
        if c.device_h and c.fixed_screen(n) and w < 600 and h != c.device_h:
            print(n, f"SKIPPED: data-screen=\"fixed\" but measures {h}, not the device height {c.device_h}: trim it or make it a scroll screen")
            bad += 1
            continue
        if n in c.drafts and not a.force:
            print(n, "SKIPPED: already has draft", c.drafts[n], "(use update, or --force for a new frame)")
            continue
        if title in existing and not a.force:
            if not c.dry:
                adopt(c, n, existing[title], w, h)
            else:
                print(n, f"would adopt '{title}' ({existing[title]['id']})")
            continue
        args = ["import-design-draft", "--project-id", c.pid, "--title", title, "--width", str(w), "--height", str(h),
                "--html-file", str(c.tmp / f"{n}.html"), "--generated-by", c.model]
        nid, err = None, ""
        for attempt in range(len(BACKOFF) + 1):
            j = c.cli(args, retry=False)
            nid = sdcli.draft_id(j)
            err = j.get("error", "") if isinstance(j, dict) else ""
            if nid or not sdcli.transient(err) or attempt == len(BACKOFF):
                break
            print(f"   transient error: {err.strip()[:90]}; reconciling with the canvas before retrying", flush=True)
            time.sleep(BACKOFF[attempt])
            found = next((x for x in c.nodes() if x.get("title") == title), None)
            if found:
                adopt(c, n, found, w, h)
                nid = "adopted"
                break
        if nid == "adopted":
            continue
        print(n, nid or "FAIL", f"{w}x{h}", (j.get("warnings") if isinstance(j, dict) else "") or err or "", flush=True)
        if nid and not c.dry:
            c.drafts[n] = nid
            c.heights[n] = {"w": w, "h": h}
            c._save("drafts.json", c.drafts)
            c._save("heights.json", c.heights)
        elif not nid:
            bad += 1
            print("   before retrying, run `status`: a failed call can leave a half-created frame with this title")
    return 1 if bad else 0


def cmd_update(c, a):
    c.need_model()
    names = a.names or sorted(c.drafts)
    hs = c.measure(names)
    bad = 0
    for n in names:
        if n not in c.drafts:
            print(n, "SKIPPED: no draft (create it first)")
            bad += 1
            continue
        h = hs.get(n)
        base = (c.heights.get(n) or {}).get("h")
        if not isinstance(h, int):
            print(n, "SKIPPED: measure failed:", h)
            bad += 1
            continue
        if not base and not a.force:
            print(n, "SKIPPED: no frozen height recorded for this frame; check its size on the canvas, add it to heights.json, or --force")
            bad += 1
            continue
        if base and h != base and not a.force:
            print(n, f"SKIPPED: height {h} differs from its frame ({base}); remove {h - base:+d}px or create a new frame and supersede")
            bad += 1
            continue
        j = c.cli(["import-design-draft", "--into", c.drafts[n], "--html-file", str(c.tmp / f"{n}.html"), "--generated-by", c.model])
        ok = "error" not in j
        print(n, "OK" if ok else "FAIL", j.get("warnings") or j.get("error") or "", flush=True)
        bad += 0 if ok else 1
    return 1 if bad else 0


def cmd_supersede(c, a):
    c.need_model()
    if not a.names:
        sys.exit("usage: import_drafts.py supersede <old-drafts.json> --model <id>")
    old = json.loads(Path(a.names[0]).read_text())
    for n, oid in sorted(old.items()):
        if n not in c.drafts or c.drafts[n] == oid:
            continue
        url = f"https://p.superdesign.dev/draft/{c.drafts[n]}"
        page = c.tmp / f"_replaced-{n}.html"
        if not c.dry:
            page.write_text(f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Replaced</title>
<script src="https://cdn.tailwindcss.com"></script></head><body><div class="flex min-h-screen items-center justify-center bg-stone-100 p-8 font-sans">
<div class="max-w-md rounded-2xl border bg-white p-8 text-center"><p class="text-sm font-semibold text-amber-800">Replaced</p>
<h1 class="mt-3 text-2xl font-semibold">This frame was replaced.</h1>
<p class="mt-3 text-slate-600">The current version is a separate frame with the same name. Safe to delete this one.</p>
<a id="open-current" href="{url}" class="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 font-semibold text-white">Open the current version</a>
</div></div></body></html>""")
        j = c.cli(["import-design-draft", "--into", oid, "--html-file", str(page), "--generated-by", c.model])
        print(n, "OK" if "error" not in j else "FAIL " + j["error"][:120])
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["status", "create", "update", "supersede"])
    ap.add_argument("names", nargs="*")
    ap.add_argument("--sd", default=str(HERE.parent))
    ap.add_argument("--model", default=os.environ.get("DD_SD_MODEL", ""))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--wait", type=int, default=0, help="minutes to wait for the API before starting")
    ap.add_argument("--nodes-file")
    a = ap.parse_args()
    c = Canvas(a)
    if a.wait and not a.nodes_file:
        for i in range(a.wait):
            j = c.cli(["fetch-design-nodes", "--project-id", c.pid], write=False, retry=False)
            if "error" not in j:
                break
            print(f"API not answering, waiting ({i + 1}/{a.wait} min)", flush=True)
            time.sleep(60)
    sys.exit({"status": cmd_status, "create": cmd_create, "update": cmd_update, "supersede": cmd_supersede}[a.command](c, a))


if __name__ == "__main__":
    main()
