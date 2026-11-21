/**
 * pw.js: shared Playwright helpers for the crawl, render, height, measure and proto_test scripts.
 * Not run directly.
 *
 * Playwright is looked up in, in order: $DD_SD_DEPS, the current folder, this scripts folder,
 * ./.superdesign/tools and ./tools. Install once per project in the tools folder:
 *   cd .superdesign/tools && npm install
 * Browser: system Chrome (channel "chrome") by default, so no browser download is needed.
 * Set DD_SD_CHANNEL= (empty) to use Playwright's bundled Chromium instead.
 *
 * Load health ("is this a real render?") accepts two kinds of styled drafts:
 *   - Tailwind Play CDN drafts: window.tailwind exists once the CDN ran.
 *   - Compiled-CSS drafts (the React build): the inlined stylesheet sets `--sd-css: 1` on :root.
 * Fonts: pass the families a draft needs (--fonts or $SD_FONTS, comma separated). A family counts
 * only when a FontFace with that name reached status "loaded"; document.fonts.check() alone says
 * true for a family whose stylesheet never arrived.
 */
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const dirs = [
    process.env.DD_SD_DEPS,
    process.cwd(),
    __dirname,
    path.join(process.cwd(), '.superdesign', 'tools'),
    path.join(process.cwd(), 'tools'),
  ].filter(Boolean);
  for (const dir of dirs) {
    try {
      return require(require.resolve('playwright', { paths: [dir] }));
    } catch (e) {
      // try the next folder
    }
  }
  console.error('playwright not found. Run `npm install` in .superdesign/tools, or set DD_SD_DEPS to a folder whose node_modules holds it.');
  process.exit(2);
}

async function launch() {
  const { chromium } = loadPlaywright();
  const channel = process.env.DD_SD_CHANNEL === undefined ? 'chrome' : process.env.DD_SD_CHANNEL;
  return chromium.launch({ channel: channel || undefined, headless: true });
}

// Desktop frames are 1440 x 900, phones 390 x 844 (or $SD_PHONE_H). Phone emulation (isMobile) is on
// below 600px; never measure a full-height phone frame with a tall viewport (it doubles the height).
function contextOptions(width, still, opts = {}) {
  const phone = width < 600;
  const phoneH = parseInt(opts.phoneHeight || process.env.SD_PHONE_H || '844', 10);
  return {
    viewport: { width, height: phone ? phoneH : 900 },
    deviceScaleFactor: 1,
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: still ? 'reduce' : 'no-preference',
  };
}

function fileUrl(f) {
  return 'file://' + path.resolve(f);
}

function pageName(f) {
  return path.basename(f, '.html');
}

// Families to require: explicit list, else $SD_FONTS, else config.json "check_fonts" next to the drafts.
function fontList(explicit, file) {
  const raw = explicit || process.env.SD_FONTS || '';
  if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (file) {
    for (const cfg of [path.join(path.dirname(file), '..', 'src', 'config.json')]) {
      try {
        const j = JSON.parse(fs.readFileSync(cfg, 'utf8'));
        if (Array.isArray(j.check_fonts)) return j.check_fonts;
      } catch (e) {
        // no config next to the drafts
      }
    }
  }
  return [];
}

// Waits until every <iconify-icon> has drawn its SVG. Canvas previews never scroll, so the HTML
// build adds `noobserver` to every icon; this also catches icon names that do not exist. Drafts
// with inline SVG icons (the React build) have no iconify-icon elements and pass at once.
async function iconsReady(page, timeout) {
  return page
    .waitForFunction(
      () => [...document.querySelectorAll('iconify-icon')].every((e) => e.shadowRoot && e.shadowRoot.querySelector('svg')),
      null,
      { timeout: timeout || 15000 },
    )
    .then(() => true)
    .catch(() => false);
}

// Load health: the signals that separate a real render from a flaky, unstyled one.
async function loadHealth(page, families) {
  return page.evaluate((families) => {
    const body = getComputedStyle(document.body);
    const marker = getComputedStyle(document.documentElement).getPropertyValue('--sd-css').trim();
    const faces = document.fonts ? [...document.fonts] : [];
    const clean = (s) => s.replace(/["']/g, '').trim().toLowerCase();
    const missingFonts = families.filter((fam) => !faces.some((f) => clean(f.family) === clean(fam) && f.status === 'loaded'));
    return {
      docW: document.documentElement.scrollWidth,
      h: Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)),
      broken: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).slice(-70)),
      tailwind: !!window.tailwind || marker === '1',
      bodyFont: body.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
      fontsLoaded: document.fonts ? document.fonts.status === 'loaded' : true,
      missingFonts,
    };
  }, families || []);
}

function parseFlags(argv, spec) {
  // spec: { name: default } ; booleans default false; values follow the flag
  const flags = { ...spec };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (!(key in spec)) {
        console.error('unknown option ' + a);
        process.exit(2);
      }
      if (typeof spec[key] === 'boolean') flags[key] = true;
      else if (Array.isArray(spec[key])) flags[key] = flags[key].concat(argv[++i]);
      else flags[key] = argv[++i];
    } else rest.push(a);
  }
  return { flags, rest };
}

module.exports = { loadPlaywright, launch, contextOptions, fileUrl, pageName, fontList, iconsReady, loadHealth, parseFlags };
