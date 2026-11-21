#!/usr/bin/env node
/**
 * render.js: render built drafts to a fold PNG and a full-page PNG for visual QA, and print the
 * load checks that matter on a canvas: document width, broken images, icons, H1 count, fonts,
 * failed requests, script errors and the elements that push the page wider than the viewport.
 *
 * Usage (from .superdesign/tools):
 *   STILL=1 node render.js ../research/shots-a 1440 ../tmp/01-home.html ../tmp/02-services.html
 *   STILL=1 node render.js ../research/shots-a 390 ../tmp/01-home.html       # phone check (docW must be 390)
 *   STILL=1 TARGET=44 node render.js ../research/shots-m 390 ../tmp/01-today.html   # also flag small tap targets
 *   STILL=1 TEXT_SCALE=1.3 node render.js ../research/shots-big 390 ../tmp/01-today.html   # large text check
 *
 * Environment:
 *   STILL=1        prefers-reduced-motion: reduce, which is how the canvas shows a frame (static,
 *                  nothing waiting for a scroll reveal). Review with STILL=1; test motion with proto_test.js.
 *   TARGET=N       list interactive elements smaller than N x N CSS px (44 iOS, 48 Android). Inline
 *                  links inside a paragraph are exempt (WCAG 2.5.8 inline exception).
 *   TEXT_SCALE=F   set the root font size to 16px x F before load (rem-based type grows; px type does not).
 *   SD_FONTS=A,B   families that must load (default: config.json "check_fonts" next to the drafts).
 *   SD_PHONE_H=N   phone viewport height (default 844).
 *
 * Output per page: <out>/<name>-<width>-fold.png (the first viewport) and <out>/<name>-<width>.png (the whole
 * frame, rendered in a viewport as tall as the page, as the canvas does), then one line:
 *   01-home-1440 OK {"docW":1440,"h":9792,"h1":1,...}
 *   02-services-390 CHECK {"docW":414,...,"wide":["DIV.grid md:grid-cols-12 ..."]}
 * A page is OK only when docW equals the width, nothing sticks out ("wide"), no image is broken,
 * icons drew, styles loaded, every required font loaded, there is one H1, no script threw or logged
 * an error (hydration errors included), and (with TARGET) no tap target is too small. Failed
 * requests are printed under ERRORS; they fail the page through the asset checks they break
 * (a retried icon or font host that still delivered does not).
 *
 * Exit codes: 0 every page OK, 1 at least one CHECK, 2 setup error.
 */
const fs = require('fs');
const path = require('path');
const { launch, contextOptions, fileUrl, pageName, fontList, iconsReady, loadHealth } = require('./pw');

(async () => {
  const [outDir, width, ...files] = process.argv.slice(2);
  if (!outDir || !width || !files.length) {
    console.error('usage: [STILL=1] [TARGET=44] [TEXT_SCALE=1.3] node render.js <outDir> <width> <file.html>...');
    process.exit(2);
  }
  const w = parseInt(width, 10);
  const target = parseInt(process.env.TARGET || '0', 10);
  const scale = parseFloat(process.env.TEXT_SCALE || '0');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const ctx = await browser.newContext(contextOptions(w, !!process.env.STILL));
  if (scale) await ctx.addInitScript((s) => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = 16 * s + 'px'; }); }, scale);
  let bad = 0;
  for (const f of files) {
    const page = await ctx.newPage();
    const errors = [];
    const network = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    page.on('requestfailed', (r) => network.push('failed ' + r.url().slice(0, 120)));
    page.on('console', (m) => {
      if (m.type() !== 'error' || /cdn\.tailwindcss\.com should not be used/.test(m.text())) return;
      if (/Failed to load resource/.test(m.text())) network.push('console: ' + m.text().slice(0, 120));
      else errors.push('console: ' + m.text().slice(0, 160));
    });
    await page.goto(fileUrl(f), { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => errors.push(String(e).split('\n')[0]));
    const icons = await iconsReady(page, 15000);
    await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
    await page.waitForTimeout(800);
    const health = await loadHealth(page, fontList('', f));
    const extra = await page.evaluate((target) => {
      const vw = document.documentElement.clientWidth;
      const clips = (el) => {
        for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox !== 'visible' && p.getBoundingClientRect().right <= vw + 1) return true;
        }
        return false;
      };
      const label = (el) => el.tagName + (el.id ? '#' + el.id : '') + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).replace(/\s+/g, ' ').slice(0, 60);
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && !clips(el);
        })
        .slice(0, 6)
        .map(label);
      let small = [];
      if (target) {
        small = [...document.querySelectorAll('a[href], button, summary, input:not([type=hidden]), select, textarea, [role=switch], [role=tab], [role=checkbox], [role=radio], [role=button]')]
          .filter((el) => {
            if (el.closest('[aria-hidden="true"], [hidden], [inert], template')) return false;
            if (el.tagName === 'A' && el.closest('p')) return false;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || +cs.opacity === 0 || cs.display === 'none') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.width < target - 0.5 || r.height < target - 0.5);
          })
          .slice(0, 8)
          .map((el) => { const r = el.getBoundingClientRect(); return label(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); });
      }
      return { h1: document.querySelectorAll('h1').length, wide, small };
    }, target);
    const m = { docW: health.docW, h: health.h, h1: extra.h1, broken: health.broken, icons, tailwind: health.tailwind, font: health.bodyFont, missingFonts: health.missingFonts, wide: extra.wide };
    if (target) m.small = extra.small;
    const name = pageName(f) + '-' + w + (scale ? '-x' + scale : '');
    await page.screenshot({ path: path.join(outDir, name + '-fold.png') });
    // The full-page PNG is taken the way the canvas shows the frame: a viewport as tall as the page, so sticky
    // and fixed chrome (a tab bar, a sticky header) sits where the frame shows it, not mid-page.
    const vp = page.viewportSize();
    if (m.h > vp.height) await page.setViewportSize({ width: vp.width, height: Math.min(m.h, 10000) });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true });
    if (m.h > vp.height) await page.setViewportSize(vp);
    const ok = m.docW === w && !m.wide.length && !m.broken.length && icons && m.tailwind && !m.missingFonts.length && m.h1 === 1 && !errors.length && !(target && m.small.length);
    if (!ok) bad++;
    const shown = errors.concat(network);
    console.log(name, ok ? 'OK' : 'CHECK', JSON.stringify(m), shown.length ? 'ERRORS ' + JSON.stringify(shown.slice(0, 4)) : '');
    await page.close();
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
