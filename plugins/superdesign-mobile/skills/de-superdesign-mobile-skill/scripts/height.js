#!/usr/bin/env node
/**
 * height.js: quick page heights for built drafts. Prints "name height" per file.
 *
 *
 * Usage (from .superdesign/tools):
 *   STILL=1 node height.js 1440 ../tmp/*.html
 *   STILL=1 node height.js 390 ../tmp/27-mobile-home.html
 *
 * Always measure with STILL=1: canvas frames are static, and motion-only layouts (pinned rails
 * add pin-spacer height) would otherwise overstate the frame. This is the quick check while
 * authoring; before an import use measure.js, which rejects bad loads and retries.
 * Phones are measured in a 390 x 844 window, never a tall one (that doubles the height).
 *
 * Tested 2026-10-27 with Node 22.23, Playwright 1.48.2 and system Chrome on the AcmePets drafts.
 */
const { launch, contextOptions, fileUrl, pageName } = require('./pw');

(async () => {
  const [width, ...files] = process.argv.slice(2);
  if (!width || !files.length) {
    console.error('usage: [STILL=1] node height.js <width> <file.html>...');
    process.exit(2);
  }
  const w = parseInt(width, 10);
  const browser = await launch();
  const ctx = await browser.newContext(contextOptions(w, !!process.env.STILL));
  for (const f of files) {
    const page = await ctx.newPage();
    await page.goto(fileUrl(f), { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(600);
    const h = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)));
    console.log(pageName(f), h, h > 10000 ? 'OVER 10000' : '');
    await page.close();
  }
  await browser.close();
})();
