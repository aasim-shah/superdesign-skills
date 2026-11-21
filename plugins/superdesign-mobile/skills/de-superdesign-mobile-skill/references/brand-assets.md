# Brand assets and images

Phase 3: get every app icon, logo, illustration and photo the screens will show onto the Superdesign project once, under stable keys, so screens can only use uploaded URLs. Tools: `scripts/images.py`, `scripts/upload.py`. Template: `templates/brand.example.json`.

## Contents

1. What an app needs
2. Prepare
3. Upload with stable keys
4. Using assets in screens

## 1. What an app needs

| Asset | Folder | Key |
|---|---|---|
| App icon (1024 square, no transparency on iOS) | `research/brand/` | `app-icon` (brand) |
| Wordmark, light and reversed | `research/brand/` | `logo`, `logo-rev` (brand) |
| Onboarding and empty-state illustrations | `research/up/` | `onb-welcome`, `empty-library` (content) |
| Real photos (avatars, places, products) | `research/up/` | what they show: `avatar-sam`, `gym-front` |

Many app screens need no images: icons come from the icon set and shapes from CSS. Do not upload what the screens will not show. Keys name what the image shows, never `img-01`; the key is the `{{img:key}}` name and the stable upload key, so renaming later breaks screens.

## 2. Prepare

```bash
python3 images.py trim ../research/brand/logo.png ../research/brand/logo-trim.png
python3 images.py reverse ../research/brand/logo.png ../research/brand/logo-rev.png --swap "#111827=#FFFFFF" --tolerance 60
python3 images.py webp ../research/img/*.png --out ../research/up --max 1200
```

| Step | Rule |
|---|---|
| Size | Screens render at 1x: an illustration 300pt wide needs about 600px for a sharp review on retina screens, no more |
| Dark mode | Illustrations with a white background need a transparent or dark variant (`empty-library-dark`); the dark twin uses it |
| Reverse logo | Recolor the dark parts to white for dark surfaces; look at it on the dark `bg` token before upload |
| People | Photos of real people are personal data. Note them in the plan; confirm consent before launch. Prefer initials avatars in drafts |

## 3. Upload with stable keys

```bash
python3 upload.py --brand ../research/brand/brand.json --dry-run
python3 upload.py --brand ../research/brand/brand.json
python3 upload.py --content ../research/up --sources ../research/img-sources.json
```

- Brand assets land in config.json `brand_urls` and are used as `{{app-icon}}`, `{{logo}}`.
- Content assets (`--no-canvas`) land in `src/asset-map.json` and are used as `{{img:key}}`.
- Keys upload as `<asset_prefix>-<key>`, so a re-run replaces instead of duplicating. Upload is the main session's job, done once before tracks start.

## 4. Using assets in screens

- Only `{{img:key}}` and brand tags. `build.py` stops on an unknown key and flags relative `src`.
- Every `<img>` has real alt text, or `alt="" aria-hidden="true"` when decorative. Alt text becomes `accessibilityLabel` in the app.
- Icons: Iconify `ph:` (Phosphor, fill or bold) with `noobserver` (the build adds it). Pick icons that have an SF Symbol and a Material equivalent, and record the mapping for the handoff (references/handoff-contract.md).
- The app ships its own image files: the handoff lists keys and source files from `research/up/` and `research/brand/`, not the canvas URLs.
