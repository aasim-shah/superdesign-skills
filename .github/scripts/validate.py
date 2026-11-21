#!/usr/bin/env python3
"""validate.py: repository checks for the Superdesign skills marketplace.

Run from anywhere: python3 .github/scripts/validate.py
Exits 1 and lists every problem if any check fails.

Checks:
  - .claude-plugin/marketplace.json parses and lists each plugin once;
  - every listed plugin folder has .claude-plugin/plugin.json with the same name and version;
  - every skill (plugins/*/skills/*/SKILL.md) has frontmatter whose name matches its folder and a
    description of at most 1024 characters;
  - every .json file parses;
  - every .py file compiles and every .js / .mjs file passes `node --check`;
  - no file contains a local home-directory path (/Users/..., /home/...).
"""
import json
import pathlib
import py_compile
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
BINARY = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".woff", ".woff2", ".ttf", ".otf", ".zip"}
problems = []


def rel(p):
    return p.relative_to(ROOT).as_posix()


def load_json(p):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        problems.append(f"{rel(p)}: invalid JSON ({e})")
        return None


def frontmatter(text):
    m = re.match(r"\A---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None
    out = {}
    for line in m.group(1).splitlines():
        k, sep, v = line.partition(":")
        if sep and not line.startswith((" ", "\t")):
            out[k.strip()] = v.strip()
    return out


def check_marketplace():
    mp = ROOT / ".claude-plugin" / "marketplace.json"
    data = load_json(mp)
    if data is None:
        return
    seen = set()
    for entry in data.get("plugins", []):
        name = entry.get("name")
        if name in seen:
            problems.append(f"{rel(mp)}: plugin {name!r} listed twice")
        seen.add(name)
        src = (ROOT / entry.get("source", "")).resolve()
        pj = src / ".claude-plugin" / "plugin.json"
        if not pj.is_file():
            problems.append(f"{rel(mp)}: plugin {name!r} has no {pj.relative_to(ROOT) if ROOT in pj.parents else pj}")
            continue
        meta = load_json(pj)
        if meta is None:
            continue
        if meta.get("name") != name:
            problems.append(f"{rel(pj)}: name {meta.get('name')!r} differs from marketplace entry {name!r}")
        if entry.get("version") and meta.get("version") != entry.get("version"):
            problems.append(f"{rel(pj)}: version {meta.get('version')!r} differs from marketplace entry {entry.get('version')!r}")
        if not list(src.glob("skills/*/SKILL.md")):
            problems.append(f"{rel(src)}: plugin has no skills/*/SKILL.md")
    listed = {(ROOT / e.get("source", "")).resolve() for e in data.get("plugins", [])}
    for d in sorted((ROOT / "plugins").iterdir()):
        if d.is_dir() and d.resolve() not in listed:
            problems.append(f"{rel(d)}: plugin folder is not listed in marketplace.json")


def check_skills():
    for sk in sorted(ROOT.glob("plugins/*/skills/*/SKILL.md")):
        try:
            fm = frontmatter(sk.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, OSError) as e:
            problems.append(f"{rel(sk)}: cannot read ({e.__class__.__name__})")
            continue
        if fm is None:
            problems.append(f"{rel(sk)}: missing --- frontmatter ---")
            continue
        if fm.get("name") != sk.parent.name:
            problems.append(f"{rel(sk)}: name {fm.get('name')!r} must match folder {sk.parent.name!r}")
        desc = fm.get("description", "")
        if not desc:
            problems.append(f"{rel(sk)}: description is empty")
        elif len(desc) > 1024:
            problems.append(f"{rel(sk)}: description is {len(desc)} characters (max 1024)")


def tracked_files():
    skip = {".git", "node_modules", "__pycache__"}
    for p in sorted(ROOT.rglob("*")):
        if p.is_file() and not skip.intersection(p.relative_to(ROOT).parts):
            yield p


def check_files():
    node = shutil.which("node")
    if not node:
        problems.append("node not found: cannot check .js / .mjs syntax")
    home = re.compile(r"/(Users|home)/[A-Za-z0-9._-]+/")
    me = pathlib.Path(__file__).resolve()
    for p in tracked_files():
        if p.suffix == ".json":
            load_json(p)
        elif p.suffix == ".py":
            try:
                py_compile.compile(str(p), doraise=True, cfile=None)
            except py_compile.PyCompileError as e:
                problems.append(f"{rel(p)}: {e.msg.strip()}")
        elif p.suffix in (".js", ".mjs") and node:
            r = subprocess.run([node, "--check", str(p)], capture_output=True, text=True)
            if r.returncode:
                problems.append(f"{rel(p)}: node --check failed\n{r.stderr.strip()}")
        if p.resolve() == me:
            continue
        if p.suffix.lower() in BINARY:
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError) as e:
            problems.append(f"{rel(p)}: cannot read as UTF-8 text, so it was not scanned ({e.__class__.__name__})")
            continue
        m = home.search(text)
        if m:
            line = text.count("\n", 0, m.start()) + 1
            problems.append(f"{rel(p)}:{line}: local path {m.group(0)!r}")


def main():
    check_marketplace()
    check_skills()
    check_files()
    for pc in ROOT.rglob("__pycache__"):
        shutil.rmtree(pc, ignore_errors=True)
    if problems:
        print(f"{len(problems)} problem(s):")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("OK: marketplace, plugins, skills and scripts pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
