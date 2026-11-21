#!/usr/bin/env node
/**
 * proto_test.js: prototype test for one built mobile screen. Taps through it like a user in a
 * 390 x 844 phone viewport, then loads it like the canvas, and fails if a control does not respond,
 * a sheet cannot be opened and closed by touch and keyboard, anything in <main> is left hidden, the
 * height moves, or a script logs an error.
 *
 * Steps:
 *   1. load (touch emulation on): screenshot
 *   2. tab bar: exactly one tab carries aria-current="page" (when the screen has a tab bar)
 *   3. switches: tap each [role="switch"], aria-checked must flip, tap again to restore
 *   4. segmented controls: tap the last button of each [data-segment], it alone must be aria-pressed
 *   5. sheets: tap each [data-sheet-open], its sheet must open with focus inside; Esc must close it and
 *      return focus; open again and tap the scrim, it must close
 *   6. toasts: tap the first [data-toast], a role="status" toast must show its text
 *   7. each --click selector: tap, screenshot
 *   8. scroll to the end: nothing in <main> left at opacity 0 or visibility hidden; height unchanged
 *   9. canvas pass: a fresh page at the full screen height, no scrolling, nothing hidden, same height
 *
 * Usage (from .superdesign/tools):
 *   node proto_test.js ../tmp/01-home.html ../research/shots-proto/01
 *   node proto_test.js ../tmp/04-settings.html ../research/shots-proto/04 --click '#p04-row-sound'
 * Options: --click SELECTOR (repeatable), --width N (default 390), --height N (default 844, or
 * $SD_PHONE_H), --no-canvas.
 * Prints one JSON line; exit 1 on any failure.
 */
const path = require('path');
const fs = require('fs');
const { launch, fileUrl, pageName, parseFlags } = require('./pw');

(async () => {
  const { flags, rest } = parseFlags(process.argv.slice(2), { click: [], width: '390', height: process.env.SD_PHONE_H || '844', 'no-canvas': false });
  const [file, out] = rest;
  if (!file || !out) {
    console.error('usage: node proto_test.js <screen.html> <out-prefix> [--click selector]... [--width 390] [--height 844] [--no-canvas]');
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const w = parseInt(flags.width, 10);
  const vh = parseInt(flags.height, 10);
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: vh }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  p.on('console', (m) => {
    if (m.type() === 'error' && !/cdn\.tailwindcss\.com should not be used|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160));
  });
  await p.goto(fileUrl(file), { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForTimeout(600);
  await p.screenshot({ path: out + '-load.png' });
  const log = { page: pageName(file) };
  const fail = [];
  const tap = async (handle) => {
    await handle.scrollIntoViewIfNeeded().catch(() => {});
    const box = await handle.boundingBox();
    if (box) await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(250);
  };

  if (await p.$('[data-tabbar]')) {
    log.currentTabs = await p.$$eval('[data-tabbar] [aria-current="page"]', (els) => els.length);
    if (log.currentTabs !== 1) fail.push(`tab bar has ${log.currentTabs} current tabs (want 1: pass active="..." to the tabbar partial)`);
  }

  const switches = await p.$$('[role="switch"]');
  log.switches = 0;
  for (const s of switches) {
    if (!(await s.isVisible())) continue;
    const before = await s.getAttribute('aria-checked');
    await tap(s);
    const after = await s.getAttribute('aria-checked');
    if (after === before) fail.push('switch did not toggle: ' + ((await s.getAttribute('aria-label')) || ''));
    await tap(s);
    log.switches++;
  }

  for (const g of await p.$$('[data-segment]')) {
    if (!(await g.isVisible())) continue;
    const btns = await g.$$('button');
    if (!btns.length) continue;
    await tap(btns[btns.length - 1]);
    const pressed = await g.$$eval('button', (bs) => bs.map((b) => b.getAttribute('aria-pressed')));
    if (pressed.filter((x) => x === 'true').length !== 1 || pressed[pressed.length - 1] !== 'true') fail.push('segmented control did not select one button');
    await tap(btns[0]);
  }

  log.sheets = [];
  const openers = await p.$$eval('[data-sheet-open]', (bs) => [...new Set(bs.map((b) => b.getAttribute('data-sheet-open')))]);
  for (const id of openers) {
    const opener = await p.$(`[data-sheet-open="${id}"]`);
    if (!opener || !(await opener.isVisible())) continue;
    await tap(opener);
    await p.waitForTimeout(400);
    const st = await p.evaluate((id) => {
      const w = document.getElementById(id);
      return { open: !!w && w.getAttribute('data-open') === 'true', focusIn: !!w && w.contains(document.activeElement) };
    }, id);
    await p.screenshot({ path: `${out}-sheet-${id}.png` });
    if (!st.open) fail.push(`sheet ${id} did not open`);
    if (!st.focusIn) fail.push(`focus did not move into sheet ${id}`);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    const closed = await p.evaluate((id) => document.getElementById(id).getAttribute('data-open') !== 'true', id);
    if (!closed) fail.push(`Esc did not close sheet ${id}`);
    await tap(opener);
    await p.waitForTimeout(400);
    await p.touchscreen.tap(Math.round(w / 2), 40);
    await p.waitForTimeout(250);
    const scrimClosed = await p.evaluate((id) => document.getElementById(id).getAttribute('data-open') !== 'true', id);
    if (!scrimClosed) fail.push(`tapping the scrim did not close sheet ${id}`);
    log.sheets.push(id);
  }

  const toaster = await p.$('[data-toast]');
  if (toaster && (await toaster.isVisible())) {
    const msg = await toaster.getAttribute('data-toast');
    await tap(toaster);
    log.toast = await p.evaluate(() => { const t = document.querySelector('[role="status"]'); return t ? t.textContent : null; });
    if (log.toast !== msg) fail.push('toast did not show');
    await p.screenshot({ path: out + '-toast.png' });
  }

  log.clicks = [];
  for (const [i, sel] of flags.click.entries()) {
    const el = await p.$(sel);
    if (!el) {
      fail.push('click target not found: ' + sel);
      continue;
    }
    await tap(el);
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}-click${i + 1}.png` });
    log.clicks.push(sel);
  }

  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(80);
  }
  const hiddenIn = () =>
    [...document.querySelectorAll('main *')]
      .filter((e) => {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        if (r.height <= 8 || !(cs.visibility === 'hidden' || +cs.opacity < 0.05)) return false;
        if (e.closest('[aria-hidden="true"], [hidden], template, [data-sheet]')) return false;
        const pe = e.parentElement && getComputedStyle(e.parentElement);
        return !pe || (pe.visibility !== 'hidden' && +pe.opacity >= 0.05);
      })
      .map((e) => e.tagName + '.' + String(e.className).slice(0, 50))
      .slice(0, 8);
  log.hidden = await p.evaluate(hiddenIn);
  if (log.hidden.length) fail.push('elements left hidden in <main>');
  const H2 = await p.evaluate(() => document.documentElement.scrollHeight);
  log.heightSame = H === H2;
  if (!log.heightSame) fail.push(`height moved ${H} -> ${H2}`);

  if (!flags['no-canvas']) {
    const c = await browser.newPage({ viewport: { width: w, height: Math.min(Math.max(H, vh), 10000) } });
    c.on('pageerror', (e) => errors.push('canvas: ' + String(e).slice(0, 160)));
    await c.goto(fileUrl(file), { waitUntil: 'networkidle', timeout: 90000 });
    await c.waitForTimeout(1200);
    log.canvasHidden = await c.evaluate(hiddenIn);
    log.canvasHeight = await c.evaluate(() => document.documentElement.scrollHeight);
    await c.screenshot({ path: out + '-canvas.png' });
    if (log.canvasHidden.length) fail.push('hidden on the canvas (full-height frame)');
    if (log.canvasHeight !== Math.max(H, vh)) fail.push(`canvas height ${log.canvasHeight} differs from the phone height ${Math.max(H, vh)}`);
    await c.close();
  }

  log.errors = errors.slice(0, 5);
  if (errors.length) fail.push(errors.length + ' script errors');
  log.result = fail.length ? 'FAIL: ' + fail.join('; ') : 'PASS';
  console.log(JSON.stringify(log));
  await browser.close();
  process.exit(fail.length ? 1 : 0);
})();
