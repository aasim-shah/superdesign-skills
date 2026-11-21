#!/usr/bin/env node
/**
 * build.mjs: build React (TSX) pages into self-contained Superdesign drafts, then validate them.
 *
 * Usage (from .superdesign/tools, or from .superdesign/src):
 *   node build.mjs all                      # every src/pages/*.tsx
 *   node build.mjs 01-home 02-services      # some pages
 *   node build.mjs all --quiet              # only pages with problems, warnings or dead ends
 *   node build.mjs all --strict-links       # also fail on #hash links that resolve to no draft
 *   node build.mjs all --no-hydrate         # static drafts: server markup only, no page script
 *   node build.mjs all --src /path/.superdesign/src --out /tmp/check
 *
 * Per page it:
 *   1. bundles the page for Node and renders it with react-dom/server, twice: pass 1 finds the ids
 *      on the page, pass 2 keeps links to those ids as in-page anchors (lib/sd.tsx resolves every
 *      <A href="#hash"> to a live draft URL from links.json + drafts.json);
 *   2. bundles the same page for the browser (IIFE, minified) and inlines it with the render context,
 *      so the browser hydrates the exact server markup: mega menu, palette, filters and Pause work on
 *      the canvas, and the thumbnail shows the finished server render;
 *   3. compiles Tailwind once for all pages from tokens.json + styles.css + the sources, and inlines
 *      it (no CDN at runtime; the stylesheet sets --sd-css: 1, which measure.js checks);
 *   4. loads GSAP from jsDelivr, pinned (config "gsap"), with the head guard (config "motion": false
 *      turns the motion layer off);
 *   5. writes tmp/<page>.html and tmp/_manifest.json (title, route, components used, dead ends),
 *      then runs check.py (draft contract problems, handoff contract warnings).
 * An unknown image or brand key stops that page. Exit 1 on any problem (or dead end with
 * --strict-links), 2 on setup errors.
 *
 * Dependencies (tools/package.json): esbuild, react, react-dom, tailwindcss 3, postcss, lucide-react.
 * They are resolved from $DD_SD_DEPS or this folder's node_modules.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEPS = path.resolve(process.env.DD_SD_DEPS || HERE);
const req = createRequire(path.join(DEPS, 'noop.js'));
let esbuild, postcss, tailwind;
try {
  esbuild = req('esbuild');
  postcss = req('postcss');
  tailwind = req('tailwindcss');
} catch (e) {
  console.error('build.mjs: dependencies missing. Run `npm install` in .superdesign/tools (or set DD_SD_DEPS). ' + String(e).split('\n')[0]);
  process.exit(2);
}
const nodePaths = [path.join(DEPS, 'node_modules')];

// ---- arguments ------------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : undefined;
};
const valued = new Set(['--src', '--out']);
const names0 = argv.filter((a, i) => !a.startsWith('--') && !valued.has(argv[i - 1]));
const exists = (p) => fs.existsSync(p);
let src = opt('--src');
if (!src) src = exists('config.json') && exists('pages') ? '.' : path.join(HERE, '..', 'src');
src = path.resolve(src);
const out = path.resolve(opt('--out') || path.join(src, '..', 'tmp'));
const QUIET = flag('--quiet');
const HYDRATE = !flag('--no-hydrate');
const STRICT_LINKS = flag('--strict-links');
if (!exists(path.join(src, 'config.json'))) {
  console.error(`build.mjs: no config.json in ${src} (pass --src .superdesign/src)`);
  process.exit(2);
}

const readJson = (f, dflt) => (exists(path.join(src, f)) ? JSON.parse(fs.readFileSync(path.join(src, f), 'utf8')) : dflt);
const strip = (o) => {
  if (Array.isArray(o)) return o;
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, strip(v)]));
  return o;
};
const cfg = readJson('config.json', {});
const T = strip(readJson('tokens.json', null) || (console.error('build.mjs: src/tokens.json is required'), process.exit(2)));
const prefix = cfg.prefix || 'xyz';
const rootId = `${prefix}-root`;
const linkCfg = strip(readJson('links.json', {}));
const links = {
  base: linkCfg.base || 'https://p.superdesign.dev/draft/',
  id: linkCfg.id || {},
  page: linkCfg.page || {},
  hash: linkCfg.hash || {},
  prefix: linkCfg.prefix || {},
  mobile: { pages: (linkCfg.mobile || {}).pages || [], map: (linkCfg.mobile || {}).map || {} },
};
const drafts = readJson('drafts.json', {});
const assets = readJson('asset-map.json', {});
const brandUrls = cfg.brand_urls || {};

const pagesDir = path.join(src, 'pages');
const allPages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4)).sort();
const names = names0.length === 0 || (names0.length === 1 && names0[0] === 'all') ? allPages : names0;
for (const n of names) {
  if (!allPages.includes(n)) {
    console.error(`build.mjs: no page src/pages/${n}.tsx`);
    process.exit(2);
  }
}

// ---- tokens -> Tailwind theme + type roles ----------------------------------------------------
const flat = {};
for (const [n, v] of Object.entries(T.colors || {})) {
  if (v && typeof v === 'object') for (const [s, h] of Object.entries(v)) flat[s === 'DEFAULT' ? n : `${n}-${s}`] = h;
  else flat[n] = v;
}
const fams = Object.fromEntries(Object.entries(T.fonts || {}).filter(([, v]) => Array.isArray(v)));
const bp = T.breakpoint || 768;
function roleCss(name, r) {
  const sizes = Array.isArray(r.size) ? r.size : [r.size];
  const decl = [
    r.font && fams[r.font] && `font-family:${fams[r.font].join(',')}`,
    r.weight && `font-weight:${r.weight}`,
    sizes[0] && `font-size:${sizes[0]}px`,
    r.lh && `line-height:${r.lh}`,
    r.track && `letter-spacing:${r.track}`,
    r.color && `color:${flat[r.color] || r.color}`,
    r.tabular && 'font-variant-numeric:tabular-nums',
  ].filter(Boolean).join(';');
  const sel = name === 'body' ? 'body' : '.' + name;
  const big = sizes[1] && sizes[1] !== sizes[0] ? `@media (min-width:${bp}px){${sel}{font-size:${sizes[1]}px}}` : '';
  return `${sel}{${decl}}${big}`;
}
const roles = Object.entries(T.type || {});
const tokenCss =
  `@layer base{${roles.filter(([n]) => n === 'body').map(([n, r]) => roleCss(n, r)).join('')}}\n` +
  `@layer components{${roles.filter(([n]) => n !== 'body').map(([n, r]) => roleCss(n, r)).join('\n')}}\n`;
const twConfig = {
  content: [path.join(src, '**/*.{ts,tsx}')],
  theme: { extend: { colors: T.colors || {}, fontFamily: fams, borderRadius: T.radius || {}, boxShadow: T.shadow || {}, maxWidth: T.maxWidth || {} } },
  plugins: [],
};

// ---- static key scan (client-only states may use keys the server render did not) --------------
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? (d.name === 'gen' ? [] : walk(path.join(dir, d.name))) : [path.join(dir, d.name)]));
}
const sources = walk(src).filter((f) => /\.(tsx?|jsx?)$/.test(f));
const staticKeys = { img: new Set(), brand: new Set() };
for (const f of sources) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\b(img|brand)\(\s*['"]([\w-]+)['"]\s*\)/g)) staticKeys[m[1]].add(m[2]);
}
const pick = (map, keys) => Object.fromEntries([...keys].filter((k) => k in map).map((k) => [k, map[k]]));

// ---- bundles ------------------------------------------------------------------------------------
const cache = path.join(out, '.sd-cache');
fs.mkdirSync(path.join(cache, 'entries'), { recursive: true });
const sdLib = path.join(src, 'lib', 'sd.tsx');
const entries = { server: {}, client: {} };
for (const n of names) {
  const page = JSON.stringify(path.join(pagesDir, n + '.tsx'));
  const sd = JSON.stringify(sdLib);
  const se = path.join(cache, 'entries', n + '.server.tsx');
  const ce = path.join(cache, 'entries', n + '.client.tsx');
  fs.writeFileSync(se, `import Page, * as mod from ${page};\nimport { renderToString } from 'react-dom/server';\nimport { App, collected } from ${sd};\nexport const meta = (mod as any).meta || {};\nexport function render(ctx: any) {\n  const html = renderToString(<App ctx={ctx}><Page /></App>);\n  return { html, used: collected() };\n}\n`);
  fs.writeFileSync(ce, `import Page from ${page};\nimport { hydrateRoot } from 'react-dom/client';\nimport { App } from ${sd};\nconst ctx = JSON.parse(document.getElementById('sd-ctx')!.textContent || '{}');\nhydrateRoot(document.getElementById(ctx.rootId)!, <App ctx={ctx}><Page /></App>, { onRecoverableError: (e: any) => console.error('[sd] hydration', e) });\n`);
  entries.server[n] = se;
  entries.client[n] = ce;
}
const common = { bundle: true, jsx: 'automatic', nodePaths, absWorkingDir: src, define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.json': 'json' }, logLevel: 'silent', metafile: true };
let serverRes, clientRes;
try {
  serverRes = await esbuild.build({ ...common, entryPoints: entries.server, outdir: path.join(cache, 'server'), platform: 'node', format: 'cjs', outExtension: { '.js': '.cjs' } });
  clientRes = HYDRATE ? await esbuild.build({ ...common, entryPoints: entries.client, outdir: path.join(cache, 'client'), platform: 'browser', format: 'iife', target: ['es2020'], minify: true, legalComments: 'none' }) : null;
} catch (e) {
  console.error('build.mjs: bundle failed');
  for (const er of e.errors || []) console.error(`   - ${er.location ? er.location.file + ':' + er.location.line + ' ' : ''}${er.text}`);
  if (!e.errors) console.error(String(e));
  process.exit(1);
}

function componentsUsed(meta, n) {
  const key = Object.keys(meta.outputs).find((k) => k.endsWith(`/${n}.js`) || k.endsWith(`/${n}.cjs`));
  if (!key) return [];
  return Object.keys(meta.outputs[key].inputs)
    .filter((f) => f.startsWith('components/') || f.startsWith('blocks/'))
    .map((f) => f.replace(/\.(tsx?|jsx?)$/, ''))
    .sort();
}

// ---- css ---------------------------------------------------------------------------------------
const styles = exists(path.join(src, 'styles.css')) ? fs.readFileSync(path.join(src, 'styles.css'), 'utf8') : '';
let css;
try {
  css = (await postcss([tailwind(twConfig)]).process(`@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${tokenCss}${styles}\n:root{--sd-css:1}\n`, { from: path.join(src, 'styles.css') })).css;
} catch (e) {
  console.error('build.mjs: CSS failed: ' + String(e.message || e).split('\n')[0]);
  process.exit(1);
}

// ---- render ------------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonSafe = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const lang = cfg.lang || 'en';
const MOTION = cfg.motion !== false && HYDRATE;
const gsapV = cfg.gsap || '3.15.0';
const headGuard = MOTION
  ? `<script>\n/* Motion pre-paint guard: hide the page until the GSAP intro has set its first frame (sdMotionOff), at most 2.2s.\n   Full-height canvas frames (innerHeight > 1600), reduced-motion visitors and anyone who paused animation are never hidden. */\n(function(){var d=document.documentElement,K=${JSON.stringify('sd-motion:' + prefix)};window.sdMotionOff=function(){d.classList.remove('sd-pre')};var paused=false;try{paused=localStorage.getItem(K)==='off'}catch(e){}if(paused)d.classList.add('sd-still');try{if(innerHeight<=1600&&!paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('sd-pre');setTimeout(window.sdMotionOff,2200)}}catch(e){}})();\n</script>\n<style>.sd-pre #${rootId}{visibility:hidden}</style>\n`
  : '';
const gsapTags = MOTION
  ? ['gsap', 'ScrollTrigger', 'SplitText', 'Flip'].map((f) => `<script src="https://cdn.jsdelivr.net/npm/gsap@${gsapV}/dist/${f}.min.js"${f === 'Flip' ? '' : ' onerror="window.sdMotionOff&&sdMotionOff()"'}></script>`).join('\n') + '\n'
  : '';
const fontLinks = T.fonts && T.fonts.href ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="${esc(T.fonts.href)}" rel="stylesheet">\n` : '';

const manifest = exists(path.join(out, '_manifest.json')) ? JSON.parse(fs.readFileSync(path.join(out, '_manifest.json'), 'utf8')) : {};
let failed = 0;
let deadTotal = 0;
for (const n of names) {
  const file = path.join(cache, 'server', n + '.cjs');
  delete req.cache[file];
  let mod;
  try {
    mod = req(file);
  } catch (e) {
    console.log(`${n}: PROBLEMS\n   - module failed to load: ${String(e).split('\n')[0]}`);
    failed++;
    continue;
  }
  const meta = mod.meta || {};
  const base = { page: n, prefix, rootId, ids: [], links, drafts, assets, brand: brandUrls };
  let r1, r2;
  try {
    r1 = mod.render(base);
    const pageIds = new Set([...r1.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    const ids = r1.used.hrefs.map((h) => h.slice(1)).filter((id) => pageIds.has(id));
    base.ids = [...new Set(ids)];
    r2 = mod.render(base);
  } catch (e) {
    console.log(`${n}: PROBLEMS\n   - render failed: ${String(e.message || e).split('\n')[0]}`);
    failed++;
    continue;
  }
  const ctx = { ...base, assets: pick(assets, new Set([...r2.used.assets, ...staticKeys.img])), brand: pick(brandUrls, new Set([...r2.used.brand, ...staticKeys.brand])) };
  let bundle = '';
  if (HYDRATE) bundle = fs.readFileSync(path.join(cache, 'client', n + '.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
  const html =
    `<!DOCTYPE html>\n<html lang="${esc(lang)}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    `<title>${esc(meta.title || '')}</title>\n` +
    (meta.description ? `<meta name="description" content="${esc(meta.description)}">\n` : '') +
    fontLinks + headGuard + `<style>${css}</style>\n</head>\n<body>\n` +
    `<div id="${rootId}" data-sd-root>${r2.html}</div>\n` +
    (HYDRATE ? `<script type="application/json" id="sd-ctx">${jsonSafe(ctx)}</script>\n${gsapTags}<script>${bundle}</script>\n` : '') +
    `</body>\n</html>\n`;
  fs.writeFileSync(path.join(out, n + '.html'), html);
  const dead = r2.used.dead;
  const nDead = Object.keys(dead).length;
  deadTotal += nDead;
  const nLinks = (r2.html.match(/<a\s/g) || []).length;
  const wired = (r2.html.match(new RegExp('href="' + links.base.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g')) || []).length;
  const nImgs = (r2.html.match(/<img\s/g) || []).length;
  manifest[n] = { title: meta.title || '', route: meta.route === undefined ? null : meta.route, template: meta.template || null, components: componentsUsed((clientRes || serverRes).metafile, n), dead };
  if (!QUIET || nDead) {
    console.log(`${n}: ${Math.round(html.length / 1024)}KB, ${nLinks} links, ${wired} wired, ${nImgs} imgs` + (nDead ? `, dead ends: ${Object.entries(dead).map(([h, c]) => `${h} x${c}`).join(', ')}` : ''));
  }
}
fs.writeFileSync(path.join(out, '_manifest.json'), JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
console.log(`\n${names.length} pages -> ${out}  |  ${failed} failed to build, ${deadTotal} dead-end hashes` + (deadTotal ? ' (add a draft, map them in links.json, or set the anchor id to null)' : ''));

let code = failed ? 1 : 0;
if (STRICT_LINKS && deadTotal) code = 1;
if (!flag('--no-check')) {
  const built = names.filter((n) => exists(path.join(out, n + '.html')));
  if (!built.length) process.exit(code || 1);
  const r = spawnSync('python3', [path.join(HERE, 'check.py'), ...built, '--src', src, '--out', out, ...(QUIET ? ['--quiet'] : [])], { stdio: 'inherit' });
  if (r.status !== 0) code = 1;
}
process.exit(code);
