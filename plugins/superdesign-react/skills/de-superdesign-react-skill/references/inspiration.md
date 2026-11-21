# Inspiration: reference heroes, broken down

Two hero compositions clients pointed to as "this is the level", described so the patterns can be reused without copying anyone's design. Read with `creative-direction.md`. Take the structure, never the brand, the copy or the imagery.

## Contents

1. Atmospheric product scene (a smart ring)
2. Product cutout with callouts (a plant shop)
3. What the two share
4. Applying them without photography

## 1. Atmospheric product scene

A Dribbble concept for a smart-ring brand. One full-bleed photograph carries the whole hero.

| Layer | What it does |
|---|---|
| The scene | A rounded panel filled edge to edge by one photograph: a twilight sky fading from violet to peach, soft mountains, a mossy rock with small flowers in the foreground. One atmosphere, many hues, all from the photograph |
| The product | The ring, rendered large and sitting on the rock as if it belongs in the scene, lit by the same sky. It is the brightest, sharpest object in the frame |
| Headline | Large, light grotesk, white, three lines on the left; the last word tinted in the scene's accent (lilac) as a gradient. A short rule, then one sentence below |
| Action | One pill button ("Shop Now") with the arrow in its own circle at the right end; a single quiet pill ("Contact Us") in the header |
| Glass over the scene | Translucent cards sit on the photograph, never on flat color: three stacked feature pills (icon in a soft circle, title, one-line sub), a "Powered by" card with a 3D chip illustration, a portrait photo card ("Find your perfect fit") with an arrow button |
| A second statement | Lower right, another large headline straight on the photograph ("Advanced technology for your daily balance") with two words tinted, and a small icon with a two-line sub |
| Navigation | Mark and wordmark left, three text links centered, one pill right: very little chrome |

Why it reads as premium: one coherent light source and palette from a real scene; the product is integrated into the environment rather than floating on a gradient; every UI element is glass over that scene, so the photograph stays visible everywhere; the type is large, light and white, and color appears only as tints taken from the scene.

## 2. Product cutout with callouts

A plant-shop concept. A product cutout on a flat dark panel.

| Layer | What it does |
|---|---|
| The panel | A deep green rounded panel inset in a white page |
| The product | A real photo cutout (a plant in a glass dish), center right, with out-of-focus leaves floating around it for depth |
| Callouts | Four glass notes with an icon, each joined by a leader line to a dot on the product ("Water level: 450ml", "Size: small") |
| Copy | Product name large on the left, price and social proof, one paragraph, quantity stepper and one button, a "Know more" link |
| Cards | A row of product cards below, each with its plant cutout breaking out over the card's top edge; carousel arrows on both ends; the selected card in a light tint |

Why it works: the product is real and annotated with real facts; it breaks the frame it sits in; depth comes from blur and overlap, not shadows on everything.

## 3. What the two share

- The product is real (photographed or rendered) and the largest, sharpest thing on screen.
- Every annotation and feature is glass laid over the product's world, not a box on a flat background.
- One dominant atmosphere (a scene or one panel color); accents are tints taken from it.
- Large light headlines, one sentence, one primary action, a link.
- Depth from overlap, blur and broken edges.

## 4. Applying them without photography

When the client has no scene photography:

- **App products**: the real screenshots in a phone frame are the product (`components/Cutouts.tsx`). Put them on one panel color with a halo, and annotate the UI with `Callout` and `Leads` (pattern 2).
- **A scene**: ask the client for photography first. Stock is a fallback only with the user's yes: a free-license photo (for example Unsplash) is downloaded, uploaded with `upload.py` and shown to the user before it is used. Never hotlink, never generate images with Superdesign credits.
- **Objects**: shaded SVG cutouts (gradient stops by class, `useId()` ids) for the props around the product, one slightly blurred.
- **The glass**: `bg-white/10` to `/60` with `backdrop-blur`, a 1px white border at 15 to 70%, over the panel or photograph, never over flat paper.
