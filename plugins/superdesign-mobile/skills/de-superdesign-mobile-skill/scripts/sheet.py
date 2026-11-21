#!/usr/bin/env python3
"""Contact sheets for visual QA of long drafts.

A 9,000px full-page PNG is too tall to read in one image. `page` cuts it into side-by-side strips
so the whole page fits in two or three images; `grid` tiles many fold shots into one sheet so a
set of pages can be compared at a glance (consistency, rhythm, stray bands).

Usage:
  sheet.py page <full.png> <out-prefix> [desktop|mobile]
      -> <out-prefix>_0.jpg, _1.jpg ... (desktop: 50% scale, 1150px strips, 3 per sheet;
         mobile: 75% scale, 1500px strips, 5 per sheet)
  sheet.py grid <out.jpg> <fold.png> [<fold.png> ...] [--cols 4] [--width 480]
      -> one sheet, each fold scaled to --width with its file name underneath

Read every sheet (they are images) before calling a page done.
Requires Pillow.
Tested 2026-10-27 with python3 3.9 and Pillow 11.3 on the AcmePets drafts.
"""
import argparse
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install --user pillow")

Image.MAX_IMAGE_PIXELS = None
GAP = 12
MAGENTA = (255, 0, 255)  # gap colour: obviously not part of the design


def page_sheets(src, prefix, mode):
    scale, seg_h, cols = (0.5, 1150, 3) if mode == "desktop" else (0.75, 1500, 5)
    im = Image.open(src).convert("RGB")
    im = im.resize((int(im.width * scale), int(im.height * scale)))
    segs = [im.crop((0, y, im.width, min(y + seg_h, im.height))) for y in range(0, im.height, seg_h)]
    n = 0
    for i in range(0, len(segs), cols):
        row = segs[i:i + cols]
        sheet = Image.new("RGB", (im.width * cols + GAP * (cols - 1), seg_h), MAGENTA)
        for j, seg in enumerate(row):
            sheet.paste(seg, (j * (im.width + GAP), 0))
        sheet.save(f"{prefix}_{n}.jpg", quality=78)
        n += 1
    print(os.path.basename(src), im.size, "sheets", n)


def grid_sheet(out, files, cols, width):
    tiles = []
    for f in files:
        im = Image.open(f).convert("RGB")
        h = int(im.height * width / im.width)
        tiles.append((os.path.basename(f), im.resize((width, h))))
    label_h = 22
    cell_h = max(t.height for _, t in tiles) + label_h
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * width + GAP * (cols - 1), rows * cell_h + GAP * (rows - 1)), (240, 240, 240))
    draw = ImageDraw.Draw(sheet)
    for i, (name, tile) in enumerate(tiles):
        x = (i % cols) * (width + GAP)
        y = (i // cols) * (cell_h + GAP)
        sheet.paste(tile, (x, y))
        draw.text((x + 4, y + tile.height + 4), name, fill=(20, 20, 20))
    sheet.save(out, quality=80)
    print(out, len(tiles), "tiles", sheet.size)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("page")
    p.add_argument("src")
    p.add_argument("prefix")
    p.add_argument("mode_arg", nargs="?", choices=["desktop", "mobile"], help="same as --mode")
    p.add_argument("--mode", choices=["desktop", "mobile"], default="desktop")
    g = sub.add_parser("grid")
    g.add_argument("out")
    g.add_argument("files", nargs="+")
    g.add_argument("--cols", type=int, default=4)
    g.add_argument("--width", type=int, default=480)
    a = ap.parse_args()
    if a.cmd == "page":
        page_sheets(a.src, a.prefix, a.mode_arg or a.mode)
    else:
        grid_sheet(a.out, a.files, a.cols, a.width)


if __name__ == "__main__":
    main()
