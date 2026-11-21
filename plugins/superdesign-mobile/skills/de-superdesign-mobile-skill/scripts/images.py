#!/usr/bin/env python3
"""Prepare brand and content images for upload: fetch, crop, trim, reverse a logo, convert to WebP.

Usage:
  images.py fetch <img-sources.json> <out-dir> [--only key1,key2]
      img-sources.json: {"hero-golden": {"src": "https://...", "alt": "..."}} (pick the keys from
      the crawl's images.json). Saves <out-dir>/<key>.<ext>; existing files are kept.
  images.py webp <in>... --out DIR [--max 1600] [--quality 82]
      Resize so the long edge is at most --max and save <stem>.webp (alpha kept).
  images.py crop <in> <out> --box x0,y0,x1,y1
  images.py trim <in> <out> [--pad 8]
      Trim transparent (or flat-colour) margins, keep --pad px.
  images.py reverse <in> <out> --swap "#233279=#FFFFFF" [--swap ...] [--tolerance 60]
      Recolour every pixel near a colour (RGB distance) to another, keeping alpha: turns the dark
      tagline of a logo white for navy bands. Check the result on the dark colour before upload.

Keys become the {{img:key}} names in pages and the stable upload keys, so name them for what
they show (hero-golden, store-austin), never img-01.
Requires Pillow.
Tested 2026-10-27 with python3 3.9 and Pillow 11.3 on the AcmePets brand files and img-sources.json.
"""
import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install --user pillow")

Image.MAX_IMAGE_PIXELS = None
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def hex_rgb(h):
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cmd_fetch(a):
    sources = json.loads(Path(a.sources).read_text())
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    for key, info in sources.items():
        if only and key not in only:
            continue
        src = info["src"] if isinstance(info, dict) else info
        ext = Path(src.split("?")[0]).suffix.lower() or ".jpg"
        if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"):
            ext = ".jpg"
        dest = out / f"{key}{ext}"
        if dest.exists():
            print("kept", dest.name)
            continue
        try:
            req = urllib.request.Request(src, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                dest.write_bytes(r.read())
            print("got ", dest.name, dest.stat().st_size // 1024, "KB")
        except Exception as e:  # network errors are reported, the rest continue
            print("FAIL", key, str(e)[:80])


def cmd_webp(a):
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for f in a.files:
        im = Image.open(f)
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") or "transparency" in im.info else im.convert("RGB")
        scale = min(1.0, a.max / max(im.size))
        if scale < 1:
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        dest = out / (Path(f).stem + ".webp")
        im.save(dest, "WEBP", quality=a.quality, method=6)
        print(dest.name, im.size, dest.stat().st_size // 1024, "KB")


def cmd_crop(a):
    x0, y0, x1, y1 = (int(v) for v in a.box.split(","))
    im = Image.open(a.src)
    im.crop((x0, y0, min(x1, im.width), min(y1, im.height))).save(a.out)
    print(a.out, (x1 - x0, y1 - y0))


def cmd_trim(a):
    im = Image.open(a.src).convert("RGBA")
    if im.getextrema()[3][0] < 255:
        box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    else:
        bg = Image.new("RGBA", im.size, im.getpixel((0, 0)))
        box = ImageChops.difference(im, bg).convert("L").point(lambda v: 255 if v > 12 else 0).getbbox()
    if not box:
        sys.exit("nothing to trim to: the image is empty")
    p = a.pad
    box = (max(0, box[0] - p), max(0, box[1] - p), min(im.width, box[2] + p), min(im.height, box[3] + p))
    im.crop(box).save(a.out)
    print(a.out, "trimmed to", (box[2] - box[0], box[3] - box[1]), "from", im.size)


def cmd_reverse(a):
    im = Image.open(a.src).convert("RGBA")
    swaps = []
    for s in a.swap:
        frm, to = s.split("=")
        swaps.append((hex_rgb(frm), hex_rgb(to)))
    px = im.load()
    changed = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, al = px[x, y]
            if al == 0:
                continue
            for frm, to in swaps:
                if math.dist((r, g, b), frm) <= a.tolerance:
                    px[x, y] = (*to, al)
                    changed += 1
                    break
    im.save(a.out)
    print(a.out, f"{changed} pixels recoloured ({changed * 100 // max(1, im.width * im.height)}% of the image)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch")
    f.add_argument("sources")
    f.add_argument("out")
    f.add_argument("--only")
    w = sub.add_parser("webp")
    w.add_argument("files", nargs="+")
    w.add_argument("--out", required=True)
    w.add_argument("--max", type=int, default=1600)
    w.add_argument("--quality", type=int, default=82)
    c = sub.add_parser("crop")
    c.add_argument("src")
    c.add_argument("out")
    c.add_argument("--box", required=True)
    t = sub.add_parser("trim")
    t.add_argument("src")
    t.add_argument("out")
    t.add_argument("--pad", type=int, default=8)
    r = sub.add_parser("reverse")
    r.add_argument("src")
    r.add_argument("out")
    r.add_argument("--swap", action="append", required=True)
    r.add_argument("--tolerance", type=float, default=60)
    a = ap.parse_args()
    {"fetch": cmd_fetch, "webp": cmd_webp, "crop": cmd_crop, "trim": cmd_trim, "reverse": cmd_reverse}[a.cmd](a)


if __name__ == "__main__":
    main()
