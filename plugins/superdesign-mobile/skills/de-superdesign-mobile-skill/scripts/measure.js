#!/usr/bin/env node
/**
 * measure.js: the import-grade height measurement. Measures each built draft still
 * (prefers-reduced-motion: reduce, as the canvas shows it) and accepts a load only when it is
 * healthy, so a flaky network can never put a wrong height on a frame that cannot be resized.
 *
 * A load counts only when: document width equals the viewport, every image loaded, every
 * Iconify icon drew its SVG, the styles ran (Tailwind CDN or the compiled `--sd-css` marker), the
 * body font is not the browser default, fonts are loaded, and every family in --fonts has a loaded
 * FontFace. Otherwise it retries in a fresh page (default 3 attempts, 2s apart).
 *
 * Usage (from .superdesign/tools):
 *   node measure.js 1440 ../tmp/01-home.html ../tmp/02-services.html
 *   node measure.js 390 ../tmp/27-mobile-home.html
 *   node measure.js 1440 ../tmp/*.html --baseline ../src/heights.json --json ../research/heights-1440.json
 *   node measure.js 390 ../tmp/*.html --min 844 --fonts "Manrope"
 *
 * Options:
 *   --tries N           Attempts per page (default 3).
 *   --baseline FILE     heights.json from import_drafts.py ({name: {w, h}}). Pages whose height
 *                       changed since their full-height import print CHANGED (frames are frozen).
 *   --json FILE         Also write {name: height} for accepted pages.
 *   --max N             Canvas limit (default 10000). Taller pages print OVER.
 *   --min N             Report at least N (a phone screen frame is never shorter than the device).
 *   --fonts LIST        Families that must load (default: $SD_FONTS or config.json "check_fonts").
 *
 * Output: "01-home 9792", "05-salon FAIL docW 1462", "12-franchise 10240 OVER", "02-services 7092 CHANGED +36".
 * Exit codes: 0 all measured and within limits, 1 any FAIL, OVER or CHANGED, 2 setup error.
 */
const fs = require('fs');
const { launch, contextOptions, fileUrl, pageName, fontList, iconsReady, loadHealth, parseFlags } = require('./pw');

const DEFAULT_FONTS = /^(times|times new roman|serif|-apple-system)$/i;

// heights.json ({name: {w, h}} or {name: h}) or a text file of "name height" lines.
function readBaseline(file) {
  if (!file || !fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    const out = {};
    text.split('\n').forEach((line) => {
      const [k, v] = line.trim().split(/\s+/);
      if (k && /^\d+$/.test(v || '')) out[k] = parseInt(v, 10);
    });
    return out;
  }
}

(async () => {
  const { flags, rest } = parseFlags(process.argv.slice(2), { tries: '3', baseline: '', json: '', max: '10000', min: '0', fonts: '' });
  const [width, ...files] = rest;
  if (!width || !files.length) {
    console.error('usage: node measure.js <width> <file.html>... [--tries 3] [--baseline heights.json] [--json out.json] [--max 10000] [--min 844] [--fonts "A,B"]');
    process.exit(2);
  }
  const w = parseInt(width, 10);
  const tries = parseInt(flags.tries, 10);
  const max = parseInt(flags.max, 10);
  const min = parseInt(flags.min, 10);
  const baseline = readBaseline(flags.baseline);
  const browser = await launch();
  const ctx = await browser.newContext(contextOptions(w, true));
  const out = {};
  let bad = 0;
  for (const f of files) {
    const name = pageName(f);
    const families = fontList(flags.fonts, f);
    let height = null;
    let why = '';
    for (let attempt = 0; attempt < tries && height === null; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 2000));
      const page = await ctx.newPage();
      try {
        await page.goto(fileUrl(f), { waitUntil: 'networkidle', timeout: 90000 });
        const icons = await iconsReady(page, 20000);
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.waitForTimeout(700);
        const m = await loadHealth(page, families);
        if (m.docW !== w) why = 'docW ' + m.docW;
        else if (m.broken.length) why = m.broken.length + ' broken images (' + m.broken[0] + ')';
        else if (!icons) why = 'icons not rendered';
        else if (!m.tailwind) why = 'styles did not load (no Tailwind, no --sd-css marker)';
        else if (DEFAULT_FONTS.test(m.bodyFont)) why = 'body font is the browser default (' + m.bodyFont + ')';
        else if (!m.fontsLoaded) why = 'fonts still loading';
        else if (m.missingFonts.length) why = 'fonts not loaded: ' + m.missingFonts.join(', ');
        else height = Math.max(m.h, min);
      } catch (e) {
        why = String(e).split('\n')[0].slice(0, 90);
      }
      await page.close();
    }
    if (height === null) {
      bad++;
      console.log(name, 'FAIL', why);
      continue;
    }
    out[name] = height;
    let note = '';
    if (height > max) note = 'OVER';
    const base = baseline[name];
    const baseH = base && (typeof base === 'number' ? base : base.h);
    if (baseH && baseH !== height) note = (note ? note + ' ' : '') + 'CHANGED ' + (height > baseH ? '+' : '') + (height - baseH);
    if (note) bad++;
    console.log(name, height, note);
  }
  await browser.close();
  if (flags.json) fs.writeFileSync(flags.json, JSON.stringify(out, null, 1) + '\n');
  process.exit(bad ? 1 : 0);
})();
