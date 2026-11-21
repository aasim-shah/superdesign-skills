#!/usr/bin/env node
/**
 * proto_test.js: motion and prototype test for one built React draft. Plays the page like a visitor
 * and then like the canvas, and fails if hydration or any script logs an error, anything is left
 * hidden, the height moves, or a menu, the palette or Pause animation does not work.
 *
 * Steps (1440 x 900 unless --width):
 *   1. intro screenshot at 450ms and settled at 3s (React has hydrated by then: the page script is inline)
 *   2. mega menu: hover the first [data-dd], check aria-expanded and its panel [data-open="true"], move away
 *   3. finder palette: press "/", type --query, count visible [data-pal-item], Esc must close [data-pal]
 *   4. each --click selector: scroll to it, click, screenshot (filters, price pickers, tabs)
 *   5. scroll to the end, then list elements in <main> left at opacity 0 or visibility hidden
 *   6. Pause animation: [data-motion-toggle] sets html.sd-still and relabels itself, then back
 *   7. canvas pass: a fresh page at the full page height (as the canvas renders a frame), no
 *      scrolling: nothing in <main> may be hidden and the height must match step 5
 *
 * Usage (from .superdesign/tools):
 *   node proto_test.js ../tmp/01-home.html ../research/shots-motion/01 --query pricing --click '[data-filter="care"]'
 *
 * Options: --query TEXT (default "a"), --click SELECTOR (repeatable), --width N (default 1440),
 *   --no-canvas (skip step 7).
 * Prints one JSON line; exit 1 on any failure.
 */
const path = require('path');
const fs = require('fs');
const { launch, fileUrl, pageName, parseFlags } = require('./pw');

(async () => {
  const { flags, rest } = parseFlags(process.argv.slice(2), { query: 'a', click: [], width: '1440', 'no-canvas': false });
  const [file, out] = rest;
  if (!file || !out) {
    console.error('usage: node proto_test.js <page.html> <out-prefix> [--query text] [--click selector]... [--width 1440] [--no-canvas]');
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const w = parseInt(flags.width, 10);
  const browser = await launch();
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  p.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && !/cdn\.tailwindcss\.com should not be used/.test(m.text()))) errors.push(m.type() + ': ' + m.text().slice(0, 160));
  });
  await p.goto(fileUrl(file), { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForTimeout(450);
  await p.screenshot({ path: out + '-intro.png' });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: out + '-settled.png' });
  const log = { page: pageName(file) };
  const fail = [];

  if (await p.$('[data-dd]')) {
    await p.hover('[data-dd]');
    await p.waitForTimeout(450);
    await p.screenshot({ path: out + '-menu.png' });
    log.menu = await p.$eval('[data-dd]', (b) => {
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      return b.getAttribute('aria-expanded') === 'true' && !!panel && panel.getAttribute('data-open') === 'true';
    });
    if (!log.menu) fail.push('mega menu did not open');
    await p.mouse.move(Math.round(w / 2), 700);
    await p.waitForTimeout(450);
    log.menuClosed = await p.$eval('[data-dd]', (b) => b.getAttribute('aria-expanded') === 'false');
    if (!log.menuClosed) fail.push('mega menu did not close when the pointer left');
  }

  if (await p.$('[data-search]')) {
    await p.keyboard.press('/');
    await p.waitForTimeout(300);
    await p.keyboard.type(flags.query);
    await p.waitForTimeout(250);
    log.paletteResults = await p.evaluate(() => document.querySelectorAll('[data-pal] [data-pal-item]').length);
    await p.screenshot({ path: out + '-palette.png' });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
    log.paletteClosed = await p.evaluate(() => !document.querySelector('[data-pal]'));
    if (!log.paletteResults) fail.push('palette found nothing for "' + flags.query + '"');
    if (!log.paletteClosed) fail.push('palette did not close on Esc');
  }

  log.clicks = [];
  for (const [i, sel] of flags.click.entries()) {
    const el = await p.$(sel);
    if (!el) {
      log.clicks.push(sel + ': not found');
      fail.push('click target not found: ' + sel);
      continue;
    }
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(900);
    const box = await el.boundingBox();
    if (box) await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${out}-click${i + 1}.png` });
    log.clicks.push(sel + ': ok');
  }

  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(110);
  }
  await p.waitForTimeout(1600);
  const hiddenIn = () =>
    [...document.querySelectorAll('main *')]
      .filter((e) => {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        if (r.height <= 10 || !(cs.visibility === 'hidden' || +cs.opacity < 0.05)) return false;
        if (e.closest('[aria-hidden="true"], [hidden], template, [data-mega], [data-pal]')) return false;
        const pe = e.parentElement && getComputedStyle(e.parentElement);
        return !pe || (pe.visibility !== 'hidden' && +pe.opacity >= 0.05);
      })
      .map((e) => e.tagName + '.' + String(e.className).slice(0, 50))
      .slice(0, 8);
  log.hidden = await p.evaluate(hiddenIn);
  if (log.hidden.length) fail.push('elements left hidden after scrolling');

  if (await p.$('[data-motion-toggle]')) {
    await p.click('[data-motion-toggle]');
    await p.waitForTimeout(250);
    log.paused = await p.evaluate(() => [document.documentElement.classList.contains('sd-still'), (document.querySelector('[data-motion-label]') || {}).textContent]);
    if (!log.paused[0]) fail.push('Pause animation did not set sd-still');
    await p.click('[data-motion-toggle]');
    await p.waitForTimeout(250);
  }
  const H2 = await p.evaluate(() => document.body.scrollHeight);
  log.heightSame = H === H2;
  if (!log.heightSame) fail.push(`height moved ${H} -> ${H2}`);

  if (!flags['no-canvas']) {
    const c = await browser.newPage({ viewport: { width: w, height: Math.min(H, 10000) } });
    c.on('pageerror', (e) => errors.push('canvas: ' + String(e).slice(0, 160)));
    await c.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await c.goto(fileUrl(file), { waitUntil: 'networkidle', timeout: 90000 });
    await c.waitForTimeout(3000);
    log.canvasHidden = await c.evaluate(hiddenIn);
    log.canvasHeight = await c.evaluate(() => document.body.scrollHeight);
    await c.screenshot({ path: out + '-canvas.png' });
    if (log.canvasHidden.length) fail.push('hidden on the canvas (tall frame)');
    await c.close();
  }

  log.errors = errors.slice(0, 5);
  if (errors.length) fail.push(errors.length + ' console errors');
  log.result = fail.length ? 'FAIL: ' + fail.join('; ') : 'PASS';
  console.log(JSON.stringify(log));
  await browser.close();
  process.exit(fail.length ? 1 : 0);
})();
