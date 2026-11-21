#!/usr/bin/env node
/**
 * crawl.js: audit crawl of the client's live site (or a reference site the client admires).
 *
 *
 * For every URL it saves full-page and fold screenshots at 1440 and 390, and records the title,
 * description, headings, main text, computed type (font, size, weight, line height, tracking,
 * case, color per role), background and text colors, links, images and JSON-LD. Across the site
 * it builds an image inventory, a font and color tally, a list of contact facts (phones, emails,
 * addresses) and, with --cards, structured records from repeated cards (salons, offices,
 * locations, team members).
 *
 * Usage (from .superdesign/tools; outputs go to ../research):
 *   node crawl.js --out ../research --sitemap https://example.com/sitemap.xml --max 40
 *   node crawl.js --out ../research https://example.com/ https://example.com/services/
 *   node crawl.js --out ../research --sitemap https://example.com/sitemap.xml \
 *     --cards ".location-card" --cards-url https://example.com/locations/
 *
 * Options:
 *   --out DIR          Output folder (required). Writes shots/, crawl.json, content-dump.md,
 *                      images.json, structured.json, tokens-seen.json, sitemap.txt (and cards.json).
 *   --sitemap URL      Read URLs from a sitemap or sitemap index (repeat for several).
 *   --max N            Cap on URLs (default 60). Sitemap order is kept.
 *   --widths LIST      Screenshot widths (default 1440,390).
 *   --no-shots         Skip screenshots (text, type and inventory only).
 *   --cards SELECTOR   CSS selector for repeated cards to extract as records.
 *   --cards-url URL    Only extract cards on this URL (default: every page).
 *
 * A page that serves a bot challenge (Cloudflare "Just a moment", captcha) is reported as BLOCKED
 * and skipped. Never solve or bypass a challenge: audit from public listings and ask the client
 * for screenshots instead.
 *
 * Exit codes: 0 done, 2 setup error. Tested 2026-10-27 with Node 22.23, Playwright 1.48.2 and
 * system Chrome against acmepets.example (sitemap discovery, 3 pages at 1440 and 390, 50 salon records
 * from /locations with --cards "article.bs-directory__card").
 */
const fs = require('fs');
const path = require('path');
const { launch, parseFlags } = require('./pw');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const slug = (u) => {
  const p = new URL(u).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return (p || 'home').replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 80);
};

async function sitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  let xml = '';
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (!r.ok) {
      console.log('sitemap', r.status, url);
      return [];
    }
    xml = await r.text();
  } catch (e) {
    console.log('sitemap error', url, String(e).slice(0, 80));
    return [];
  }
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(xml)) {
    let out = [];
    for (const l of locs) out = out.concat(await sitemapUrls(l, seen));
    return out;
  }
  return locs;
}

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

function extract(cardsSelector) {
  const cs = (el) => {
    const s = getComputedStyle(el);
    return { font: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, tt: s.textTransform, color: s.color };
  };
  const sample = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.innerText && e.innerText.trim()).slice(0, 3).map((e) => ({ text: e.innerText.trim().slice(0, 60), ...cs(e) }));
  const main = document.querySelector('main') || document.body;
  const bgs = {};
  const texts = {};
  const fonts = {};
  document.querySelectorAll('body *').forEach((e) => {
    const s = getComputedStyle(e);
    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') bgs[s.backgroundColor] = (bgs[s.backgroundColor] || 0) + 1;
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (own) {
      texts[s.color] = (texts[s.color] || 0) + own.length;
      const f = s.fontFamily.split(',')[0].replace(/["']/g, '').trim() + ' ' + s.fontWeight;
      fonts[f] = (fonts[f] || 0) + own.length;
    }
    const bi = s.backgroundImage;
    if (bi && bi.startsWith('url(') && e.getBoundingClientRect().width > 200) e.setAttribute('data-crawl-bg', bi.slice(4, -1).replace(/["']/g, ''));
  });
  const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    try {
      return JSON.parse(s.textContent);
    } catch (e) {
      return { _unparsed: s.textContent.slice(0, 300) };
    }
  });
  const text = main.innerText || '';
  const phones = [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href').slice(4)).concat(text.match(/\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b|\+44\s?\d{2,4}\s?\d{3,4}\s?\d{3,4}|\b0\d{3,4}\s?\d{3}\s?\d{3,4}\b/g) || []))];
  const emails = [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href').slice(7).split('?')[0]).concat(text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []))];
  const addresses = [...new Set([...document.querySelectorAll('address')].map((a) => a.innerText.trim().replace(/\s+/g, ' ')))];
  const cards = cardsSelector
    ? [...document.querySelectorAll(cardsSelector)].map((c) => {
        const head = c.querySelector('h1,h2,h3,h4,h5,strong');
        const lines = c.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
        return {
          name: head ? head.innerText.trim() : lines[0] || '',
          lines: lines.slice(0, 12),
          phone: (c.querySelector('a[href^="tel:"]') || {}).textContent || (c.innerText.match(/\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/) || [''])[0],
          email: ((c.querySelector('a[href^="mailto:"]') || { getAttribute: () => '' }).getAttribute('href') || '').replace('mailto:', ''),
          links: [...c.querySelectorAll('a[href]')].map((a) => [a.innerText.trim().slice(0, 40), a.href]).slice(0, 6),
          image: (c.querySelector('img') || {}).currentSrc || '',
        };
      })
    : [];
  return {
    title: document.title,
    description: (document.querySelector('meta[name="description"]') || {}).content || '',
    canonical: (document.querySelector('link[rel="canonical"]') || {}).href || '',
    lang: document.documentElement.lang,
    height: document.body.scrollHeight,
    h1: document.querySelectorAll('h1').length,
    type: { h1: sample('h1'), h2: sample('h2'), h3: sample('h3'), h4: sample('h4'), p: sample('main p'), nav: sample('header nav a, nav a'), button: sample('main a[class*="button" i], main button, main .btn') },
    headings: [...main.querySelectorAll('h1,h2,h3,h4')].map((e) => e.tagName + ': ' + e.innerText.trim().replace(/\s+/g, ' ')).slice(0, 80),
    text: text.replace(/\n{3,}/g, '\n\n').slice(0, 20000),
    links: [...document.querySelectorAll('a[href]')].map((a) => [a.innerText.trim().replace(/\s+/g, ' ').slice(0, 50), a.href]).filter((l) => l[1] && !l[1].startsWith('javascript')),
    images: [...document.images].map((i) => [i.currentSrc || i.src, i.alt, i.naturalWidth, i.naturalHeight]).filter((i) => i[2] > 80 && !i[0].startsWith('data:')),
    bgImages: [...document.querySelectorAll('[data-crawl-bg]')].map((e) => e.getAttribute('data-crawl-bg')),
    emptyAlt: [...document.images].filter((i) => i.naturalWidth > 80 && !i.alt).length,
    bgs,
    texts,
    fonts,
    jsonld,
    contacts: { phones, emails, addresses },
    cards,
  };
}

(async () => {
  const { flags, rest } = parseFlags(process.argv.slice(2), { out: '', sitemap: [], max: '60', widths: '1440,390', 'no-shots': false, cards: '', 'cards-url': '' });
  if (!flags.out) {
    console.error('usage: node crawl.js --out DIR [--sitemap URL] [--max N] [--widths 1440,390] [--no-shots] [--cards SEL] [URL...]');
    process.exit(2);
  }
  let urls = [...rest];
  for (const s of flags.sitemap) urls = urls.concat(await sitemapUrls(s));
  urls = [...new Set(urls)].slice(0, parseInt(flags.max, 10));
  if (!urls.length) {
    console.error('no URLs: pass URLs or --sitemap');
    process.exit(2);
  }
  fs.mkdirSync(path.join(flags.out, 'shots'), { recursive: true });
  fs.writeFileSync(path.join(flags.out, 'sitemap.txt'), urls.join('\n') + '\n');
  const widths = flags.widths.split(',').map(Number);
  const browser = await launch();
  const out = {};
  for (const w of widths) {
    const phone = w < 600;
    const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, isMobile: phone, hasTouch: phone, userAgent: UA });
    for (const u of urls) {
      if (w !== widths[0] && out[slug(u)] && out[slug(u)].blocked) continue;
      if (w !== widths[0] && flags['no-shots']) continue;
      const page = await ctx.newPage();
      const name = slug(u);
      let status = 0;
      try {
        const resp = await page.goto(u, { waitUntil: 'networkidle', timeout: 60000 });
        status = resp ? resp.status() : 0;
      } catch (e) {
        console.log('goto', name, String(e).split('\n')[0].slice(0, 80));
      }
      const title = await page.title().catch(() => '');
      if (/just a moment|attention required|verify you are human|captcha/i.test(title)) {
        console.log(name, 'BLOCKED by a bot challenge: not bypassed. Ask the client for access or screenshots.');
        out[name] = { url: u, blocked: true, title };
        await page.close();
        continue;
      }
      await settle(page);
      const tag = phone ? 'mobile' : 'desktop';
      if (!flags['no-shots']) {
        await page.screenshot({ path: path.join(flags.out, 'shots', `${name}-${w}-fold.png`) });
        await page.screenshot({ path: path.join(flags.out, 'shots', `${name}-${w}.png`), fullPage: true }).catch(() => {});
      }
      if (w === widths[0]) {
        const cardsHere = flags.cards && (!flags['cards-url'] || flags['cards-url'] === u) ? flags.cards : '';
        out[name] = { url: u, status, ...(await page.evaluate(extract, cardsHere)) };
        console.log(name, status, out[name].height + 'px', out[name].title.slice(0, 60), out[name].emptyAlt ? `(${out[name].emptyAlt} images without alt)` : '');
      } else console.log(name, tag, 'shots');
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();

  // site-wide outputs
  const pages = Object.entries(out).filter(([, v]) => !v.blocked);
  const images = {};
  const tally = (key) => {
    const t = {};
    pages.forEach(([, v]) => Object.entries(v[key] || {}).forEach(([k, n]) => (t[k] = (t[k] || 0) + n)));
    return Object.fromEntries(Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 40));
  };
  pages.forEach(([name, v]) => {
    v.images.forEach(([src, alt, w, h]) => {
      const e = (images[src] = images[src] || { pages: [], alt: '', w, h });
      if (!e.pages.includes(name)) e.pages.push(name);
      if (alt && !e.alt) e.alt = alt;
    });
    (v.bgImages || []).forEach((src) => {
      const e = (images[src] = images[src] || { pages: [], alt: '(background)', w: 0, h: 0 });
      if (!e.pages.includes(name)) e.pages.push(name);
    });
  });
  const structured = pages.map(([name, v]) => ({ page: name, url: v.url, jsonld: v.jsonld, contacts: v.contacts }));
  const cards = pages.flatMap(([name, v]) => (v.cards || []).map((c) => ({ page: name, ...c })));
  const dump = pages.map(([name, v]) => `## ${name}\n\n${v.url}\n\nTitle: ${v.title}\nDescription: ${v.description || '(none)'}\n\n${v.headings.join('\n')}\n\n${v.text}\n`).join('\n---\n\n');
  const W = (f, d) => fs.writeFileSync(path.join(flags.out, f), typeof d === 'string' ? d : JSON.stringify(d, null, 1));
  W('crawl.json', out);
  W('images.json', images);
  W('structured.json', structured);
  W('tokens-seen.json', { fonts: tally('fonts'), textColors: tally('texts'), backgrounds: tally('bgs') });
  W('content-dump.md', `# Content dump\n\nCrawled ${new Date().toISOString().slice(0, 10)}, ${pages.length} pages.\n\n${dump}`);
  if (flags.cards) W('cards.json', cards);
  const noDesc = pages.filter(([, v]) => !v.description).length;
  const badH1 = pages.filter(([, v]) => v.h1 !== 1).length;
  console.log(`\n${pages.length} pages, ${Object.keys(images).length} images, ${cards.length} cards; ${noDesc} without a meta description, ${badH1} without exactly one H1.`);
  console.log('Personal data check: content-dump.md, cards.json and structured.json may hold names, phones and emails. Tell the user before sharing them.');
})();
