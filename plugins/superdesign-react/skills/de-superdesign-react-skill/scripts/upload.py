#!/usr/bin/env python3
"""Upload brand and content images to the Superdesign project with stable keys, and write the maps
the build reads: config.json brand_urls ({{logo}}) and asset-map.json ({{img:key}}).

Drafts may only load uploaded URLs, so every image a page shows goes through here once.
Stable keys (<asset_prefix>-<key>) mean re-running replaces an asset instead of duplicating it,
and keys already in asset-map.json are skipped unless --force.

Usage (from .superdesign/tools):
  python3 upload.py --brand ../research/brand/brand.json --content ../research/up
  python3 upload.py --content ../research/up --sources ../research/img-sources.json --dry-run
  python3 upload.py --brand ../research/brand/brand.json --only logo,logo-rev --force

Options:
  --sd DIR          the .superdesign folder (default: this script's parent's parent)
  --brand FILE      brand.json: {"logo": {"file": "logo.png", "type": "logo", "description": "..."}};
                    files are relative to brand.json. Types: logo, image, font.
  --content DIR     folder of prepared content images (*.webp, *.png, *.jpg, *.svg); the file stem
                    is the key. Descriptions come from --sources alt text, else the key.
  --sources FILE    img-sources.json from images.py fetch (alt text per key)
  --only KEYS       comma-separated keys to upload
  --force           re-upload keys that are already mapped
  --dry-run         print what would be uploaded; write nothing, call nothing

Config used: src/config.json project_id (or research/project.json projectId) and asset_prefix
(else prefix). Content uploads use --no-canvas so they do not clutter the canvas.
Retries 5xx and network errors 4 times with backoff. The CLI is resolved by sdcli.py
($SUPERDESIGN_CLI, a `superdesign` binary, else `npx --yes @superdesign/cli@latest`).
Standard library only.
"""
import argparse
import json
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sdcli  # noqa: E402

IMG = {".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".avif"}


def cli(args, dry):
    if dry:
        print("   would run: " + sdcli.printable(args))
        return {"url": "(dry run)"}
    for attempt in range(5):
        j, err = sdcli.run(args)
        if j is not None:
            return j
        if not sdcli.transient(err) or attempt == 4:
            return {"error": err}
        wait = 5 * 2 ** attempt
        print(f"   retry in {wait}s: {err.strip()[:80]}")
        time.sleep(wait)
    return {"error": "gave up"}


def url_of(j):
    return j.get("url") or j.get("publicUrl") or (j.get("asset") or {}).get("url")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sd", default=str(HERE.parent))
    ap.add_argument("--brand")
    ap.add_argument("--content")
    ap.add_argument("--sources")
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    sd = Path(a.sd)
    cfg_path = sd / "src" / "config.json"
    cfg = json.loads(cfg_path.read_text()) if cfg_path.exists() else {}
    pid = cfg.get("project_id")
    if not pid and (sd / "research" / "project.json").exists():
        pid = json.loads((sd / "research" / "project.json").read_text()).get("projectId")
    if not pid:
        sys.exit("no project id: set project_id in src/config.json")
    prefix = cfg.get("asset_prefix") or cfg.get("prefix") or "site"
    only = set(a.only.split(",")) if a.only else None
    cfg.setdefault("brand_urls", {})
    amap_path = sd / "src" / "asset-map.json"
    amap = json.loads(amap_path.read_text()) if amap_path.exists() else {}
    planned = 0

    if a.brand:
        bpath = Path(a.brand)
        for key, info in json.loads(bpath.read_text()).items():
            if (only and key not in only) or (key in cfg["brand_urls"] and not a.force):
                continue
            f = bpath.parent / info["file"]
            if not f.exists():
                print("MISSING", key, f)
                continue
            planned += 1
            print(f"brand   {key:<22} {f.name}")
            j = cli(["upload-asset", str(f), "--project-id", pid, "--purpose", "brand", "--type", info.get("type", "image"),
                     "--key", f"{prefix}-{key}", "--description", info.get("description", key)], a.dry_run)
            u = url_of(j)
            if u and not a.dry_run:
                cfg["brand_urls"][key] = u
                cfg_path.write_text(json.dumps(cfg, indent=1, ensure_ascii=False) + "\n")
            elif not u:
                print("   FAIL", j.get("error", j)[:200] if isinstance(j.get("error"), str) else j)

    if a.content:
        alts = json.loads(Path(a.sources).read_text()) if a.sources else {}
        for f in sorted(Path(a.content).iterdir()):
            key = f.stem
            if f.suffix.lower() not in IMG or (only and key not in only) or (key in amap and not a.force):
                continue
            desc = (alts.get(key) or {}).get("alt") or key.replace("-", " ")
            planned += 1
            print(f"content {key:<22} {f.name}  ({desc[:50]})")
            j = cli(["upload-asset", str(f), "--project-id", pid, "--purpose", "content", "--no-canvas",
                     "--key", f"{prefix}-{key}", "--description", desc], a.dry_run)
            u = url_of(j)
            if u and not a.dry_run:
                amap[key] = u
                amap_path.write_text(json.dumps(dict(sorted(amap.items())), indent=1) + "\n")
            elif not u:
                print("   FAIL", j)

    print(f"\n{planned} uploads {'planned (dry run, nothing written)' if a.dry_run else 'done'}; "
          f"{len(cfg['brand_urls'])} brand URLs, {len(amap)} content assets mapped.")


if __name__ == "__main__":
    main()
