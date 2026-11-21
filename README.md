# Superdesign skills for Claude Code

Two Claude Code skills for designing on a [Superdesign](https://superdesign.dev) canvas **without spending Superdesign credits**. Claude writes every screen or page itself, checks it locally in Chrome, and imports it to the canvas as a draft. Superdesign is used only as the canvas and review surface. Each skill ends in a handoff package your app can use directly.

| Plugin | Skill | You design | It hands off to |
|---|---|---|---|
| `superdesign-mobile` | `de-superdesign-mobile-skill` | iOS and Android app screens, 390 x 844, light and dark | React Native / Expo Router: `theme/tokens.ts`, a screen-to-route map, a component inventory |
| `superdesign-react` | `de-superdesign-react-skill` | Websites and web apps as React (TSX) pages, 1440 and 390 | Next.js or Vite + React Router: tokens, components, blocks, content files, routes |

Install either one, or both. They don't depend on each other.

## Install

### As a Claude Code plugin (recommended)

In Claude Code:

```
/plugin marketplace add aasim-shah/superdesign-skills
/plugin install superdesign-mobile@superdesign-skills    # app screens
/plugin install superdesign-react@superdesign-skills     # web pages
```

To update later, run `/plugin marketplace update superdesign-skills`.

### As a plain skill folder

Copy one skill into your project, or into `~/.claude/skills/` to make it available in every project:

```bash
git clone https://github.com/aasim-shah/superdesign-skills.git
cp -R superdesign-skills/plugins/superdesign-mobile/skills/de-superdesign-mobile-skill your-app/.claude/skills/
# or
cp -R superdesign-skills/plugins/superdesign-react/skills/de-superdesign-react-skill your-site/.claude/skills/
```

Each skill folder is self-contained. Other agents that read `SKILL.md` files can use the folder too.

## Requirements

- Node.js 20 or later, and npm
- Python 3.9 or later. Pillow (`python3 -m pip install --user pillow`) is needed only for image prep and contact sheets.
- Google Chrome installed. Playwright drives system Chrome (`channel: 'chrome'`), so no browser download is needed.
- A Superdesign account and project, with the Superdesign CLI signed in. The tools look for `$SUPERDESIGN_CLI` first, then a `superdesign` binary on `PATH`, then `npx --yes @superdesign/cli@latest`.

The skill installs everything else itself into `.superdesign/tools/` (Playwright 1.64.1; the React edition also adds esbuild, React 19 and Tailwind 3).

## Use

Ask Claude in plain words. The skill triggers on requests like these:

- *Mobile:* "Design the app screens in Superdesign", "make 390 screens with dark mode", "make the app prototype clickable", "hand the screens over to the Expo app".
- *React:* "Redesign the site as React drafts on Superdesign", "TSX drafts on the canvas", "import the drafts full height", "hand the redesign over to the Next.js app".

Claude then works through the skill's phases:

1. Intake, audit and plan
2. Brand assets
3. Design system and tokens
4. An anchor screen or page that sets the quality bar
5. Parallel tracks (up to five agents)
6. QA
7. Canvas import
8. Prototype links and motion
9. Handoff

Work files go in `.superdesign/` in your project. Keep `research/`, `tmp/` and `tools/node_modules/` out of git.

### Things to know

- **No credits are spent.** The tools refuse every credit command (`create-design-draft`, `iterate-design-draft`, `execute-flow-pages`, image and video generation). Only `import-design-draft` and the read commands are used.
- **Imports need the authoring model id.** Pass `--model <id>` or set `DD_SD_MODEL`. It is recorded on each frame as the author.
- **Frames are permanent.** The CLI cannot resize, rename or delete a frame. Heights are measured before import, and dry runs are available (`import_drafts.py ... --dry-run`).
- **Related skills are not included.** Some text in the skills names sibling skills (`de-superdesign-skill`, `de-gsap-skill` and others). Neither skill needs them.

## Repository layout

```
.claude-plugin/marketplace.json     the marketplace: lists both plugins
plugins/
  superdesign-mobile/
    .claude-plugin/plugin.json
    skills/de-superdesign-mobile-skill/
      SKILL.md                       start here
      references/                    one guide per phase
      scripts/                       Python and Node tools
      templates/                     partials, starter screens, config and doc templates
  superdesign-react/
    .claude-plugin/plugin.json
    skills/de-superdesign-react-skill/
      SKILL.md
      references/  scripts/  templates/  examples/
.github/                             CI: validation, plus a smoke test of each skill in Chrome
```

## Contributing

1. Change the skill under `plugins/<plugin>/skills/<skill>/`.
2. Run the checks locally:
   - `python3 .github/scripts/validate.py` (manifests, frontmatter, syntax; a few seconds)
   - `.github/scripts/smoke.sh mobile` and `.github/scripts/smoke.sh react` (set up a throwaway project from `SKILL.md`, then build, render, measure and prototype-test the templates in Chrome; a minute or two each)
3. Bump `version` in that plugin's `plugin.json` and its entry in `.claude-plugin/marketplace.json`.
4. Add a line to [CHANGELOG.md](CHANGELOG.md).

Keep real client names, people and contact details out of examples. Use invented ones.

## License

[MIT](LICENSE)
