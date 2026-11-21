/**
 * motion.ts: the site-wide GSAP layer, started once after hydration by <Motion/>.
 * GSAP comes from jsDelivr, pinned (config.json "gsap"), loaded by the build before the page script;
 * the app build imports it from npm instead (useGSAP in each component).
 *
 * Rules: transforms, opacity and clip-path only; opacity, never visibility or autoAlpha, so keyboard
 * users reach everything and a focused element is revealed at once; nothing is ever left hidden (a
 * reveal-all runs at the end of the page and the head guard gives up after 2.2s); full-height canvas
 * frames (innerHeight > 1600) get a short intro and a static page; prefers-reduced-motion gets
 * nothing; Pause animation (html.sd-still) stops every loop; a heading whose line split would change
 * its height by even 0.01px gets a plain fade. Never animate an element whose text React updates
 * while it animates (SplitText rewrites the DOM inside the heading).
 *
 * Hooks: data-count (numbers count up, format kept) · data-parallax (image inside an overflow frame) ·
 * data-reveal (force a reveal target) · data-skip (opt out) · .btn-primary (magnetic) · a.card (lift).
 * Globals for components: sdLoop(tween) registers a loop · sdFlipState(els) / sdFlipPlay(state) for
 * filters (lib/useFilter.ts).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type El = HTMLElement;

export function startMotion() {
  const w = window as any;
  const doc = document.documentElement;
  const off = () => (w.sdMotionOff ? w.sdMotionOff() : doc.classList.remove('sd-pre'));
  const gsap = w.gsap, ScrollTrigger = w.ScrollTrigger, SplitText = w.SplitText, Flip = w.Flip;
  const loops: any[] = [];
  let STILL = doc.classList.contains('sd-still');
  w.sdLoop = (t: any) => {
    loops.push(t);
    if (STILL) t.pause();
    return t;
  };
  w.sdFlipState = (els: ArrayLike<Element>) => (Flip && !STILL ? Flip.getState(els) : null);
  w.sdFlipPlay = (state: any) => {
    if (state && Flip) Flip.from(state, { duration: 0.6, ease: 'power3.inOut', scale: true, onComplete: () => ScrollTrigger && ScrollTrigger.refresh() });
  };
  if (!gsap || !ScrollTrigger || !SplitText || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    off();
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  if (Flip) gsap.registerPlugin(Flip);

  const EASE = 'power3.out';
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let STATIC = false;
  const root = (document.querySelector('[data-sd-root]') as El) || document.body;
  let hero: El | null = null;
  const $$ = (sel: string, ctx?: ParentNode) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel)) as El[];
  const guard = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      console.warn('[sd-motion]', e);
    }
  };
  const outermost = (list: El[]) => {
    const set = new Set(list);
    return list.filter((el) => {
      for (let p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return false;
      return true;
    });
  };
  const pinned = (el: El) => {
    const pos = getComputedStyle(el).position;
    return pos === 'fixed' || pos === 'sticky';
  };
  const settle = (els: El[], props?: string) => gsap.set(els, { clearProps: props || 'transform,opacity,clipPath' });

  document.addEventListener('sd-motion', (e: any) => {
    STILL = e.detail.off;
    loops.forEach((t) => (STILL ? t.pause() : t.resume()));
    if (STILL) gsap.globalTimeline.getChildren(true, true, false).forEach((t: any) => { if (loops.indexOf(t) < 0 && !t.scrollTrigger) t.progress(1); });
  });

  function headlineTween(el: El) {
    let split: any = null;
    if (!(document.fonts && document.fonts.status !== 'loaded')) {
      const h0 = el.getBoundingClientRect().height;
      split = SplitText.create(el, { type: 'lines', mask: 'lines' });
      if (Math.abs(el.getBoundingClientRect().height - h0) > 0.01) {
        split.revert();
        split = null;
      }
    }
    const tl = gsap.timeline({ onComplete: () => split && split.revert() });
    if (!split) return tl.from(el, { y: 24, opacity: 0, duration: 0.8, ease: EASE, clearProps: 'transform,opacity' });
    return tl.from(split.lines, { yPercent: 118, duration: 1, stagger: 0.09, ease: 'expo.out' });
  }

  // numbers count up from a number with the same digit count, so text never reflows ($40,000 · 200+ · 4.9)
  function countUp(el: El, duration?: number) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) if (/\d/.test(walker.currentNode.nodeValue || '')) nodes.push(walker.currentNode as Text);
    const tl = gsap.timeline();
    nodes.forEach((n) => {
      const orig = n.nodeValue || '';
      const parts: any[] = [];
      const re = /\d[\d,]*(?:\.\d+)?/g;
      let m: RegExpExecArray | null;
      let last = 0;
      while ((m = re.exec(orig))) {
        parts.push(orig.slice(last, m.index));
        const v = parseFloat(m[0].replace(/,/g, ''));
        const digits = String(Math.floor(v)).length;
        parts.push({ v, from: digits > 1 ? Math.pow(10, digits - 1) : 0, comma: m[0].indexOf(',') > -1, dec: (m[0].split('.')[1] || '').length });
        last = re.lastIndex;
      }
      parts.push(orig.slice(last));
      const o = { p: 0 };
      const paint = () => {
        n.nodeValue = parts
          .map((x) => {
            if (typeof x === 'string') return x;
            const v = x.from + (x.v - x.from) * o.p;
            return x.comma ? v.toLocaleString('en-US', { minimumFractionDigits: x.dec, maximumFractionDigits: x.dec }) : x.dec ? v.toFixed(x.dec) : String(Math.round(v));
          })
          .join('');
      };
      tl.to(o, { p: 1, duration: duration || 1.4, ease: 'power2.out', onStart: paint, onUpdate: paint, onComplete: () => { n.nodeValue = orig; } }, 0);
    });
    return tl;
  }

  function intro() {
    hero = root.querySelector('main > section');
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    const bars = [root.querySelector('[data-util] > div'), root.querySelector('header > .wrap')].filter(Boolean) as El[];
    if (bars.length) tl.from(bars, { y: -16, opacity: 0, duration: 0.7, stagger: 0.08, onComplete: () => settle(bars) }, 0);
    if (!hero) return tl;
    const h1 = hero.querySelector('h1') as El | null;
    if (h1) tl.add(STATIC ? gsap.from(h1, { y: 24, opacity: 0, duration: 0.7, clearProps: 'transform,opacity' }) : headlineTween(h1), 0.1);
    const items = outermost(
      $$('.eyebrow, .chip, p, a, button, form, figure, dl, ol, ul, [data-reveal]', hero).filter(
        (el) => !(h1 && (h1.contains(el) || el.contains(h1))) && !pinned(el) && !el.closest('[data-skip], [aria-hidden="true"]'),
      ),
    );
    tl.from(items, { y: 22, opacity: 0, duration: 0.75, stagger: { amount: Math.min(0.5, items.length * 0.05) }, onComplete: () => settle(items) }, 0.3);
    $$('img', hero).forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.width < 200 || r.height < 140 || img.closest('[data-skip], [data-sig]')) return;
      tl.fromTo(img, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.12 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3, ease: 'expo.inOut', onComplete: () => settle([img], 'transform,clipPath') }, 0.25);
    });
    if (!STATIC) $$('[data-count]', hero).forEach((el, i) => tl.add(countUp(el, 1.6), 0.7 + i * 0.08));
    if (STATIC) tl.timeScale(2);
    return tl;
  }

  function reveals() {
    const vh = innerHeight;
    const cand = outermost(
      $$('.eyebrow, .lead, .grid > *, ol > li, ul > li, .card, figure, table, blockquote, details, form, article, [data-reveal]', root).filter((el) => {
        if (hero && hero.contains(el)) return false;
        if (el.closest('header, footer, nav, [data-skip], [aria-hidden="true"], h1, h2, [data-pal], [data-mega]')) return false;
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.height < vh * 0.9 && !pinned(el);
      }),
    );
    gsap.set(cand, { opacity: 0, y: 32 });
    const shown = new Set<El>();
    const show = (batch: El[]) => {
      batch = batch.filter((el) => !shown.has(el));
      if (!batch.length) return;
      batch.forEach((el) => shown.add(el));
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.85, ease: EASE, stagger: 0.07, overwrite: true, onComplete: () => settle(batch) });
    };
    ScrollTrigger.batch(cand, { start: 'top 88%', once: true, onEnter: show });
    root.addEventListener('focusin', (e) => {
      show(cand.filter((el) => el.contains(e.target as Node)));
      for (let n = e.target as El | null; n && n !== root; n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.05) gsap.set(n, { opacity: 1 });
    });
    ScrollTrigger.create({ trigger: root, start: 'bottom bottom+=2', once: true, onEnter: () => show(cand) });

    $$('h2, .h2, .display-xl', root).forEach((el) => {
      if ((hero && hero.contains(el)) || el.closest('header, footer, [data-skip], [data-pal]')) return;
      gsap.set(el, { opacity: 0 });
      let played = false;
      const go = (instant: boolean) => {
        if (played) return;
        played = true;
        gsap.set(el, { clearProps: 'opacity' });
        const tl = headlineTween(el);
        if (instant) tl.progress(1);
      };
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => go(false) });
      ScrollTrigger.create({ trigger: root, start: 'bottom bottom+=2', once: true, onEnter: () => go(true) });
    });

    $$('[data-count]', root).forEach((el) => {
      if (hero && hero.contains(el)) return;
      const tl = countUp(el, 1.5);
      tl.pause(0);
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => tl.play() });
      ScrollTrigger.create({ trigger: root, start: 'bottom bottom+=2', once: true, onEnter: () => tl.progress(1) });
    });
    $$('[data-parallax]', root).forEach((img) =>
      gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, { yPercent: 7, scale: 1.16, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }),
    );
  }

  function hovers() {
    if (!HOVER) return;
    $$('.btn-primary').forEach((b) => {
      if (b.closest('header, [data-pal]')) return;
      const xTo = gsap.quickTo(b, 'x', { duration: 0.45, ease: 'power3' });
      const yTo = gsap.quickTo(b, 'y', { duration: 0.45, ease: 'power3' });
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.2);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      b.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
    $$('a, button').forEach((a) => {
      const icon = a.querySelector('[data-nudge]');
      if (!icon || a.closest('header')) return;
      a.addEventListener('mouseenter', () => gsap.to(icon, { x: 5, duration: 0.22, overwrite: true }));
      a.addEventListener('mouseleave', () => gsap.to(icon, { x: 0, duration: 0.22, overwrite: true }));
    });
    outermost($$('a.card, article.card', root)).forEach((c) => {
      if (c.closest('header, footer, form') || pinned(c) || c.getBoundingClientRect().height > 640) return;
      c.addEventListener('mouseenter', () => gsap.to(c, { y: -6, duration: 0.25, overwrite: 'auto' }));
      c.addEventListener('mouseleave', () => gsap.to(c, { y: 0, duration: 0.3, overwrite: 'auto', clearProps: 'transform' }));
    });
  }

  function start() {
    STATIC = innerHeight > 1600 || doc.scrollHeight - innerHeight < 160;
    let tl: any;
    guard(() => { tl = intro(); });
    if (STILL && tl) tl.progress(1);
    if (!STATIC && !STILL) guard(reveals);
    guard(hovers);
    off();
    if (!STATIC) requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    requestAnimationFrame(() => { guard(start); off(); });
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  setTimeout(run, 650);
}
