# {Brand} website redesign: audit and plan

{Date}

**The problem:** {one sentence: what the live site makes hard, with a number}. **This plan** {one sentence:
what the redesign does, on which canvas, in whose fonts and colors, and the cleaner path it creates}.

<!-- Local file at the project root. Make a Claude Doc of it only when the user asks for one.
     Lead every section with its point and a number. Tables over paragraphs. Never name the agency. -->

## The new design

Superdesign project: {project URL}. Click-through starts at {preview URL of 01 · Home}.

| # | Screen | Journey | What it shows |
|---|---|---|---|
| 00 | [Design system]({preview url}) | All | Tokens, type, devices, components, motion |
| 01 | [Home]({preview url}) | {Journey} | {one line from the track report} |

## Critical issues

| Finding | Where | Fix |
|---|---|---|
| {Broken, private or another company's links; empty pages; wrong facts} | {page or template} | {screen number that fixes it} |

## UX and information architecture

| Finding | Fix |
|---|---|
| {What makes the main journey hard} | {the new path, with screen numbers} |

## Visual design and typography

| Finding | Decision |
|---|---|
| {Fonts, sizes, tracking, case, contrast measured on the live site} | {the design-system decision} |

## Technical, SEO and accessibility

| Finding | Fix in the build |
|---|---|
| {Titles, descriptions, H1s, page weight, alt text, contrast, focus} | {what the build does} |

## Strategy

Positioning: **{one line}**.

Journeys (every page and every screen row is tagged with one):
1. **{Name}** · {start} → {middle} → {end state}.
2. **{Name}** · ...

Sitemap: see `.superdesign/design-system.md` section 1.

## Design system

"{Name}": `.superdesign/design-system.md`, `src/tokens.json` and the `00 · Design system` draft. {Two lines:
colors, fonts, devices, motion.}

## Feature specs (for the app build)

- **{Feature}**: {data source, behavior, component or route, server action or API, what must be confirmed}.

## Component changes wanted

<!-- Every track report's "component or token changes wanted" lands here until the main session makes them. -->
- [ ] {Change, who asked, decision}

## Open questions for {Brand}

<!-- Every track report's "questions for the client" lands here. -->
- [ ] {Question}

## Placeholder content

<!-- Every PLACEHOLDER a track invented, by page, so nobody mistakes it for real copy. -->
| Page | Placeholder | Needs |
|---|---|---|
| {NN} | {invented fact or copy} | {who confirms it} |

## Personal data noted

{The live site and the drafts include: real names, photos, reviews, emails, phone numbers. Drafts show
reviewers as first name + last initial. Confirm consent before launch.}

## Sources

{Site crawl date and folder (`.superdesign/research/`), reference sites, client documents. Target app: {Next.js or Vite}.}
