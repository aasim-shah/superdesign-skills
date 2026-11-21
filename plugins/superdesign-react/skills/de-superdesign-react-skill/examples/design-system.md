<!-- Fictional example. It shows the nine-section structure every design-system.md follows, filled in at the
     level of detail a real project needs. The brand, places, products, prices, people and copy are invented.
     It was written with the HTML edition of this workflow: in the React edition the tokens in sections 2 to 4
     live in src/tokens.json, the component classes in src/styles.css, and section 9 is the React handoff
     contract (references/handoff-contract.md); the data-ap-* hooks below become data-sig hooks. -->

# AcmePets: design system v1 ("Bubble Bath")

Source of truth for every Superdesign draft in project `<project-id>`.
Built from the client's own identity: the script wordmark (cyan "Acme" `#00ADE8`, hot pink "Pets"
`#EE479B`, navy tagline `#233279` "CLEAN PUPS, HAPPY HOMES."), the mascot family (a white pup in a pink
shower cap in a cyan bubble tub; golden pups in a shower cap, top hat, sunglasses, mortarboard), and the
live site's bubble wallpaper. Same fonts as acmepets.example (Poppins + Inter), set for clearer reading.
The brief: keep everything people love about the brand, and give it a wow effect.

---

## 1. Product context

- **Who:** AcmePets Franchising, LLC. Dog bathing and grooming salons, membership-first. Founder and CEO
  [founder name]. Corporate salon and training centre: AcmePets Riverside, Springfield.
  30 salons open in six states and 15 coming soon.
- **The product:** **Splash Club**, an unlimited monthly bath membership from **$39/month** (priced by
  weight: Small $39 · Medium $49 · Large $59 · X-Large $69 · XX-Large $79 · Jumbo $89, Riverside rates).
  Ten essentials included in every visit. **No contracts** ("Contracts? Not our breed."), cancel with 10 days'
  notice. Grooming add-ons priced per visit: **Tidy Tails** (tidy-up: face, paws, sanitary) and **Full
  Fluff** (full haircut). Spa add-ons: **Deep De-Shed**, **Paw Soak**. Membership is required; new
  customers book online and join in person at their first visit.
- **Booking:** each salon books on a third-party booking tool (`booking.example/salon/…`). The site's job is
  to get a pet parent to the right salon's booking link with the right service in mind.
- **Franchise:** franchise fee $40,000, royalty 5% (placeholder figures). Training at Riverside, AcmePets University,
  signature salon products, proprietary software and app (coming soon).
- **Audience:** pet parents within driving distance of a salon (mobile-first, in a hurry, price-curious);
  prospective franchise owners (considered, desktop, reading); job seekers (groomers, bathers).

### Journeys (every page is tagged with one)
1. **Pamper**: find my salon → see my price → book (booking tool hand-off).
2. **Join**: understand Splash Club → find my monthly price → join at first visit.
3. **Own**: franchise story → business model → investment → talk with [founder] (inquiry form).
4. **Work**: careers → find a local salon to apply.

### Information architecture (new)
```
Services              /services                       Splash Club, Tidy Tails, Full Fluff, spa add-ons
Memberships           /memberships                    Splash Club, price by size, no contracts
Find a salon          /locations                      map + list + search; open and coming soon
  Salon               /locations/[salon]              salon home (hours, reviews, book)
  Salon services      /locations/[salon]/services     service menu + price finder
  Salon memberships   /locations/[salon]/memberships  monthly price table + "more care, fewer extra charges"
  Salon policies      /locations/[salon]/policies     policies + FAQs
  Coming soon         /locations/[salon] (soon)       register interest
Book a visit          /book                           choose salon + service + size → booking tool
About                 /about                          story, [founder], [the founder's dogs]
Franchise ▾           /franchise, /franchise/business-model, /franchise/leadership,
                      /franchise/inquire, /university, /signature-products, /software
Careers · Contact · FAQs · Pup care tips (/tips, /tips/[slug]) · Privacy & terms
```

## 2. Colour

| Token | Hex | Use · contrast |
|---|---|---|
| `navy-950` | `#141C4D` | Footer, deepest bands, utility bar (white text 16.1:1) |
| `navy-900` | `#233279` | **Brand navy.** Headings on light (11.6:1 on white), dark bands (white text 11.6:1) |
| `navy-800` | `#2E3F91` | Raised cards and hovers on dark |
| `ink-800` | `#2A3163` | **Body text** on light (12.2:1 on white): clearer than the live site's navy-on-pink |
| `ink-500` | `#565D8A` | Muted text, captions, input borders (6.3:1 on white; 3:1+ as a boundary) |
| `line` | `#DCE3F2` | Dividers on light (decorative) |
| `pink-500` | `#EE479B` | **Brand pink.** Bubbles, foam underlines, stickers, logo; display text ≥ 36px only (3.5:1) |
| `pink-600` | `#D6247F` | **Primary action** (white text 4.75:1) |
| `pink-700` | `#B5156A` | Primary hover; pink small text and eyebrows on light (6.4:1) |
| `pink-100` | `#FFE3F0` | Tints, sticker fills, selected rows |
| `pink-50` | `#FFF4F9` | Alternate band ("pink suds") |
| `cyan-500` | `#00ADE8` | Logo cyan. Graphics only |
| `cyan-400` | `#2EC0DF` | **Brand cyan.** Bath-water bands and tub panels; text on it is navy-900 (5.4:1) |
| `cyan-700` | `#0B7299` | Cyan as small text on light (5.4:1) |
| `cyan-200` | `#A5DBE9` | Bubbles on cyan, tints |
| `cyan-100` | `#D3F1F8` | Tints, chips |
| `cyan-50` | `#EEF9FC` | Alternate band ("blue suds") |
| `sun-400` | `#FFC83D` | Mascot gold: review stars, "Coming soon" stickers (navy text 7.5:1) |
| `white` | `#FFFFFF` | Page canvas, cards, inputs |
| `success` · `error` | `#1E7F55` · `#C42B3A` | Always with an icon and words |

Rules
- White is the canvas; bands alternate white → `pink-50` → `cyan-50`, with one bath-water band (`cyan-400`)
  and one or two navy bands per page.
- **On navy, every piece of text, every link, eyebrow and icon is pure `#FFFFFF`** (house rule from
  Contoso and Northwind). Pink and cyan appear on navy only as graphics (bubbles, foam underlines,
  stickers) and as the pink primary button.
- **On cyan-400, text is navy-900.** White text never sits on cyan or pink-500.
- `pink-600` is the only fill that means "do this" (Book a visit, Find my price, Request information).
  Secondary actions: navy outline on light, white outline on dark.
- One `sun-400` sticker per viewport at most.
- No flat gradients for decoration except bath water (`cyan-400 → #7FD6EA`) and photo scrims.

## 3. Typography

Same families as acmepets.example, plus a web-font replacement for the live site's system-only Brush Script MT:

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,500;0,600;0,700;0,800;1,700&family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..700&family=Yellowtail&display=swap" rel="stylesheet">
```

- **Poppins** (the brand voice): display, headings, buttons, nav, eyebrows, labels, prices, stats.
- **Inter** (content, set for clarity): paragraphs, lists, forms, tables, captions. 18px body, 1.7 line
  height, **zero tracking** (the live site squeezes body text to −0.35px), optical sizing on, ink-800 text,
  64 to 70ch measure, tabular figures in prices and tables.
- **Yellowtail** (script aside): one short phrase per section at most ("Contracts? Not our breed."), ≥ 30px,
  never for information you need to act on.

| Role | Font | Desktop | Mobile | Weight | LH | Tracking |
|---|---|---|---|---|---|---|
| Display XL | Poppins | 112 | 54 | 800 | 0.92 | -0.045em |
| H1 | Poppins | 76 | 44 | 700 | 0.98 | -0.04em |
| H2 | Poppins | 56 | 36 | 700 | 1.03 | -0.035em |
| H3 | Poppins | 30 | 24 | 600 | 1.15 | -0.02em |
| H4 | Poppins | 21 | 19 | 600 | 1.3 | -0.01em |
| Price / stat | Poppins | 80 | 52 | 800 | 1.0 | -0.04em, tabular |
| Lead | Inter | 22 | 19 | 400 | 1.55 | 0 |
| Body | Inter | 18 | 17 | 400 | 1.7 | 0 |
| Body S | Inter | 16 | 16 | 400 | 1.6 | 0 |
| Label / button | Poppins | 16 | 16 | 600 | 1.2 | 0.005em |
| Eyebrow | Poppins | 13 | 12 | 600 | 1.2 | 0.14em, UPPERCASE, with a bubble dot |
| Caption | Inter | 14 | 14 | 400 | 1.5 | 0 |
| Script | Yellowtail | 44 | 32 | 400 | 1.1 | 0 |

Sentence case for headings (the live site's ALL-CAPS pink H3s go). Headline emphasis: one word or phrase
in `pink-500` with a hand-drawn **foam underline** (on navy: white text, pink underline). Never justify.

## 4. Space, grid, shape

- 4px base. Container 1280px, padding 32 desktop / 20 mobile. 12 columns, 24px gutters.
- Section padding 112 desktop / 72 mobile (dense pages 96).
- Radius: `12` inputs · `16` small cards · `28` cards · `44` panels · `999` pills, avatars, bubbles.
- **The tub** (signature shape): hero media and feature panels are bathtubs, flat-ish top, deep round
  bottom: `border-radius: 36px 36px 160px 160px / 36px 36px 120px 120px`, with a 14px rim.
- Shadows tinted with navy: `sm 0 1px 2px rgba(35,50,121,.08)` · `md 0 18px 40px -18px rgba(35,50,121,.28)`
  · `lg 0 40px 90px -40px rgba(35,50,121,.45)` · `sticker 0 2px 0 rgba(35,50,121,.12), 0 12px 24px -12px rgba(35,50,121,.4)`.
- Borders 1px `line` on light, 1px `white/12` on dark. Inputs 1.5px `ink-500`.

## 5. Brand devices (what makes it unmistakably AcmePets)

1. **Soap bubbles**: glossy bubbles (rim, highlight, pink/cyan iridescence) float in heroes and bands.
   They drift with the cursor and **pop when clicked**, then float back up from below. Static on canvas.
2. **Foam edge**: section seams are rows of foam (overlapping circles), not straight lines.
3. **The tub**: hero photos sit in a tub panel; the dog cutout rises out of it with suds on the rim.
4. **Stickers**: die-cut, slightly rotated, white-bordered: "No contracts", "Unlimited baths",
   "From $39/mo", "Coming soon". One gold sticker per view at most.
5. **Mascot avatars**: the client's own pups in a ring: Splash Club (shower cap), Tidy Tails (top hat),
   Full Fluff (stars), Franchise (briefcase), University (mortarboard), Signature (pink cap),
   Software (laptop). The tub pup is the brand seal.
6. **Paw trail**: steps and timelines are a trail of paw prints that walks across the section.
7. **Bath-fill checklist**: the ten Splash Club essentials sit in a tall tub that fills with water as you
   scroll; each item ticks as the water passes.
8. **Puns as headlines** (the client's own): "Contracts? Not our breed.", "Fetch your price.",
   "Join the pack.", "Find us nearby.", "Rinse and shine."
9. **Seal**: rotating text "CLEAN PUPS · HAPPY HOMES · RINSE AND SHINE ·" around the tub pup.

## 6. Components

- **Utility bar** (navy-950, 40px): "Unlimited Splash Club from $39/month · No contracts" · right: Careers ·
  Contact · Pause animation.
- **Header** (80px, white 92% + blur, sticky): logo · Services · Memberships · Find a salon · About ·
  Franchise ▾ · right: salon search (palette), "Book a visit" (primary).
- **Franchise mega menu**: Franchise opportunities, Business model, Leadership, AcmePets University,
  Signature products, Software & app (with mascot avatars) + "Talk with [founder]" card.
- **Salon header**: logo + salon badge ("Riverside"), salon sub-nav (Services & pricing · Memberships ·
  Policies & FAQs), phone, "Book at Riverside" (primary). Back to all salons.
- **Salon finder palette** (`/`, Cmd/Ctrl-K, header search): type a city, state or ZIP; results grouped
  "Open now" and "Coming soon"; pinned 96px from the top.
- **Buttons**: primary `pink-600` pill 56px, white Poppins 600, soft pink shadow; outline 2px navy;
  on dark: white pill with navy text or white outline. Focus 3px navy ring + 2px offset on light,
  3px white ring on dark. Hover: a little "squish" and a bubble burst on click.
- **Service card**: mascot avatar, name, one-line promise, what's included, "From $39/mo" or "Add-on".
- **Price finder**: weight slider (6 sizes) with a dog that grows; monthly price counts; "Book at
  [salon]" CTA. Prices are per salon; national pages say "from $39".
- **Salon card**: storefront photo, name, address, phone, "Open"/"Coming soon" chip, distance,
  "Book at [salon]" + "Salon details".
- **Review card**: five gold stars, quote, first name + initial, "Google review".
- **Comparison table**: "Other salons · typical extra charge" vs "AcmePets · included".
- **Forms**: label above, hint, 56px inputs radius 12, 1.5px ink-500 border, inline errors with icon,
  "(required)" in words.
- **Footer**: navy-950, foam edge on top, the tub pup seal, newsletter ("Pup care tips, once a month"),
  four columns, Instagram + Facebook, legal: "AcmePets® locations are independently owned and operated
  by franchisees."

## 7. Motion (GSAP 3.13, partials/motion.html + partials/bubbles.html)

- Ease `power3.out` (entrances 0.6 to 1.2s), `back.out` for stickers and bubbles, `expo.out` for reveals.
- Hero: headline lines rise from a mask; the dog rises out of the tub; foam puffs; stickers slap on;
  bubbles drift up and keep floating; the price counts up.
- Scroll: section heads split by line, cards stagger up, the bath-fill checklist fills (scrub), the paw
  trail walks, map pins drop and the open salons pulse, images unmask from the bottom like water draining.
- Hover: magnetic squishy primary buttons, avatars wobble, cards lift. Click: bubbles pop.
- **Pause animation** (utility bar, already on the live site) stops every loop (WCAG 2.2.2);
  `prefers-reduced-motion` disables everything. Full-height canvas frames (innerHeight > 1600) render
  static with bubbles in their resting places. Content is never left hidden: opacity only, never
  visibility; focus reveals instantly.

## 8. Accessibility and content

- WCAG 2.2 AA minimum; body text 12:1. Skip link, landmarks, one H1, visible focus, 44px+ targets,
  no colour-only meaning, alt text on every photo (the live site has many empty alts).
- Voice: warm, punny, short. US English. "AcmePets" (one word, capital P), "Splash Club",
  "Tidy Tails", "Full Fluff", "pet parents", "pups". Prices always "from $39/month" unless a salon
  page shows its own table.
- Invented content (dates, blog posts, product names, university modules, FAQ answers not on the live
  site) is marked PLACEHOLDER in `src/CONTENT.md`.

## 9. Draft authoring contract (Superdesign import)

One complete document; `<body>` no class; one root `<div id="ap-root">`; unique `id` on every `<a>`;
links `https://`, `mailto:`, `tel:` or `#hash`; images only from uploaded URLs (`{{img:key}}`,
`{{logo}}`); Tailwind CDN + inline config (partials/head.html); Iconify `lucide:` / `ph:` icons.
Page-specific classes prefixed `pNN-`. Full-height import (`--width 1440 --height <measured>`; 390 for
mobile). Never size anything with `vh`.
