# Brand assets and content images

Phase 3: get every logo, mascot and photo the drafts will show onto the Superdesign project once, under stable keys, so pages can only use uploaded URLs. Tools: `scripts/images.py`, `scripts/upload.py`. Template: `templates/brand.example.json`.

## Contents

1. Folders and naming
2. Fetch
3. Prepare: crop, trim, reverse, WebP
4. Upload with stable keys
5. Using assets in pages

## 1. Folders and naming

| Folder | Holds |
|---|---|
| `research/img/` | Originals fetched from the live site |
| `research/brand/` | Logos, reverse logos, marks, mascots (PNG or SVG) and `brand.json` |
| `research/up/` | Prepared content images (WebP), one file per key |
| `research/img-sources.json` | `{key: {src, alt}}`: where each key came from and its alt text |

Keys name what the image shows (`hero-golden`, `store-austin`, `team-bathing`), never `img-01`. The key is the `img('key')` name in pages and the stable upload key, so renaming later breaks pages.

## 2. Fetch

Pick keys from the crawl's `images.json` (largest, most used, the brand photography) into `img-sources.json`, then:

```bash
python3 images.py fetch ../research/img-sources.json ../research/img
```

Existing files are kept. Background images appear in `images.json` with alt `(background)`.

## 3. Prepare

```bash
python3 images.py trim ../research/img/logo.png ../research/brand/logo.png
python3 images.py reverse ../research/brand/logo.png ../research/brand/logo-rev.png --swap "#233279=#FFFFFF" --tolerance 70
python3 images.py crop ../research/img/team.jpg ../research/img/team-crop.jpg --box 0,120,1600,1100
python3 images.py webp ../research/img/*.jpg ../research/img/*.png --out ../research/up --max 1600
```

| Step | Rule |
|---|---|
| Reverse logo | Recolor the dark parts (tagline, outlines) to white for dark bands. Look at it on the dark token before upload |
| Cutouts | Keep transparency (PNG or WebP with alpha). List cutout keys in TRACKS.md: they drive the hero devices |
| Size | Long edge 1600px for photos, smaller for avatars and tiles. The canvas renders at 1x |
| People | Photos of real people are personal data. Note them in the plan; confirm consent before launch |

## 4. Upload with stable keys

```bash
python3 upload.py --brand ../research/brand/brand.json --dry-run      # check the plan first
python3 upload.py --brand ../research/brand/brand.json
python3 upload.py --content ../research/up --sources ../research/img-sources.json
```

- Brand assets (`--purpose brand`, type logo, image or font) land in config.json `brand_urls` and are used as `brand('logo')`, `brand('logo-rev')`.
- Content assets (`--purpose content --no-canvas`) land in `src/asset-map.json` and are used as `img('key')`.
- Keys upload as `<asset_prefix>-<key>`, so a re-run replaces instead of duplicating; mapped keys are skipped unless `--force`.
- 5xx and network errors retry with backoff. Upload is the main session's job, done once before tracks start.

## 5. Using assets in pages

- Only `img('key')` and `brand('key')`. An unknown key stops that page's build with `unknown image key`. `check.py` flags any `<img>` whose src is not `https://` or `data:`, and a literal `src="..."` in a page source.
- Call `img()` with a literal key (`img('hero')`, not `img(name)`): the build scans sources for literal keys so states the server never rendered (an opened dialog) still find their images after hydration.
- Every `<img>` has real alt text (what it shows, in context), or `alt="" aria-hidden="true"` when decorative.
- Never hotlink the live site: those URLs change and the canvas will not load some of them.
- Mega menu tiles, avatars and seals use small assets; do not reuse a 1600px photo for a 56px avatar.
- Icons are `lucide-react` components (inline SVG, nothing to load, `aria-hidden="true"` on decorative ones). The app uses the same package.
