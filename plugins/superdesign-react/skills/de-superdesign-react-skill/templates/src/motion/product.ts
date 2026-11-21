/**
 * product.ts: the product-led motion layer, started after motion.ts and signature.ts by <Motion/>.
 * Brand-neutral: it animates whatever carries these hooks, so any look can use it. Every hook is
 * optional; a page without them gets only smooth scroll, the header state and the page fade.
 *
 *   smooth scroll   · Lenis when config "lenis" loaded it; ScrollTrigger listens to it
 *   [data-header]   · gets data-scrolled after 10px (style it with data-[scrolled]:…)
 *   [data-sig-stage]· in the first section: the product rises, [data-sig-halo] opens, [data-thing]s
 *                     arrive and drift, leader lines draw and callouts slide in, the stage climbs
 *                     slower than the page, the product tilts with a fine pointer
 *   [data-tilt]     · the product inside a stage (rises and tilts)
 *   [data-lead]     · a leader line path (DrawSVG); [data-dot] breathes; [data-callout] slides in.
 *                     Outside the hero they play when their section is 55% into view
 *   [data-sig-rise] · rises out of its panel edge as the section scrolls in (scrubbed)
 *   [data-sig-lean] · turns from -14° to -4° while its section passes (scrubbed)
 *   [data-sig="cards"] > [data-card] · cards rise; their [data-thing]s drop onto the top edge
 *   [data-sig-drift]· any element that should float gently forever (decorative, aria-hidden)
 *   [data-sig-seam] · the object across a Split seam: rises into place on arrival, then sways a few
 *                     degrees and climbs slightly with the scroll
 *   [data-edge]     · a section Edge: its shape swells from 40% to full height as it scrolls in
 *   [data-sig-draw] · an SVG drawing (components/Sketch.tsx): every path draws in document order when
 *                     it comes into view, like a pen; [data-sig-draw="scrub"] ties the pen to the scroll
 *   draft links     · links to another draft fade the page out before leaving
 *
 * Rules (as motion.ts): transforms, opacity and SVG strokes only; the markup is the finished state;
 * canvas frames (innerHeight > 1600) stay static; reduced motion gets nothing; loops go through
 * sdLoop() so Pause animation stops them. Settings follow references/creative-direction.md §4.
 * Handoff: Lenis in the root layout; one useGSAP() hook per component that carries a hook.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type El = HTMLElement;

export function startProduct() {
  const w = window as any;
  const gsap = w.gsap;
  const ST = w.ScrollTrigger;
  if (!gsap || !ST || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ST, ...[w.DrawSVGPlugin].filter(Boolean));
  const DRAW = !!w.DrawSVGPlugin;
  const $ = (sel: string, ctx?: ParentNode) => (ctx || document).querySelector(sel) as El | null;
  const $$ = (sel: string, ctx?: ParentNode) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel)) as El[];
  const guard = (name: string, fn: () => void) => {
    try {
      fn();
    } catch (e) {
      console.warn('[sd-product]', name, e);
    }
  };
  const STATIC = innerHeight > 1600;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const loop = w.sdLoop || ((t: any) => t);
  const R = gsap.utils.random;
  const SOFT = 'expo.out';
  const heroStage = $('main > section [data-sig-stage]');

  function smooth() {
    if (STATIC || !w.Lenis || w.sdLenis) return;
    const lenis = new w.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t: number) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    w.sdLenis = lenis;
  }

  function header() {
    const h = $('[data-header]');
    if (!h || STATIC) return;
    ST.create({ start: 0, end: 'max', onUpdate: (self: any) => h.toggleAttribute('data-scrolled', self.scroll() > 10) });
  }

  /** leader lines draw, then their callouts slide in; dots breathe */
  function leads(scope: El, at: number, tl: any) {
    const lines = $$('[data-lead]', scope);
    const callouts = $$('[data-callout]', scope);
    if (DRAW && lines.length) tl.from(lines, { drawSVG: '0%', duration: 0.9, ease: 'power2.inOut', stagger: 0.14 }, at);
    if (callouts.length) tl.from(callouts, { x: 28, opacity: 0, duration: 0.9, ease: SOFT, stagger: 0.14, clearProps: 'opacity' }, at + 0.35);
    if (STATIC) return;
    $$('[data-dot]', scope).forEach((d, i) => {
      gsap.set(d, { transformOrigin: '50% 50%' });
      loop(gsap.to(d, { scale: 1.7, opacity: 0.15, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 }));
    });
  }

  function drift(els: El[]) {
    if (STATIC) return;
    els.forEach((t) => loop(gsap.to(t, { y: `+=${R(-14, -6)}`, rotation: `+=${R(-4, 4)}`, duration: R(3.5, 6), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: R(0, 1.5) })));
  }

  function hero() {
    const stage = heroStage;
    if (!stage) return;
    const sec = stage.closest('section') as El;
    const product = $('[data-tilt]', stage);
    const halo = $('[data-sig-halo]', stage);
    const things = $$('[data-thing]', stage);
    const tl = gsap.timeline({ delay: 0.25 });
    if (halo) tl.from(halo, { scale: 0.55, opacity: 0, duration: 2.2, ease: 'power2.out' }, 0);
    if (product) tl.from(product, { y: 180, rotation: 4, duration: 1.6, ease: SOFT }, 0.1);
    if (things.length) tl.from(things, { y: 60, rotation: '-=12', opacity: 0, duration: 1.4, ease: SOFT, stagger: 0.12, clearProps: 'opacity' }, 0.45);
    leads(stage, 1.0, tl);
    if (STATIC) {
      tl.progress(1);
      return;
    }
    drift(things);
    gsap.to(stage, { y: -70, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: 1 } });
    if (FINE && product) {
      const rx = gsap.quickTo(product, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(product, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      const tx = things.map((t, i) => gsap.quickTo(t, 'x', { duration: 1.2 + i * 0.2, ease: 'power3.out' }));
      gsap.set(product, { transformPerspective: 1200 });
      sec.addEventListener('pointermove', (e: PointerEvent) => {
        const r = sec.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        rx(-ny * 7);
        ry(nx * 9);
        tx.forEach((f, i) => f(nx * (18 + i * 10)));
      });
      sec.addEventListener('pointerleave', () => {
        rx(0);
        ry(0);
        tx.forEach((f) => f(0));
      });
    }
  }

  function sectionLeads() {
    const sections = new Set<El>();
    $$('[data-lead], [data-callout]').forEach((el) => {
      if (heroStage && heroStage.contains(el)) return;
      const sec = el.closest('section') as El | null;
      if (sec) sections.add(sec);
    });
    sections.forEach((sec) => {
      const tl = gsap.timeline(STATIC ? {} : { scrollTrigger: { trigger: sec, start: 'top 55%', once: true } });
      leads(sec, 0.2, tl);
      if (STATIC) tl.progress(1);
    });
  }

  function scrubbed() {
    if (STATIC) return;
    $$('[data-sig-rise]').forEach((el) => {
      const sec = (el.closest('section') as El) || el;
      gsap.fromTo(el, { y: 160 }, { y: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'center center', scrub: 1.2 } });
    });
    $$('[data-sig-lean]').forEach((el) => {
      const sec = (el.closest('section') as El) || el;
      gsap.fromTo(el, { rotation: -14, y: 90 }, { rotation: -4, y: -20, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    });
  }

  function cards() {
    if (STATIC) return;
    $$('[data-sig="cards"]').forEach((list) => {
      const things = $$('[data-thing]', list);
      if (things.length) gsap.from(things, { y: -70, rotation: -14, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: 0.09, clearProps: 'opacity,transform', scrollTrigger: { trigger: list, start: 'top 82%', once: true } });
      gsap.from($$('[data-card]', list), { y: 40, duration: 1.2, ease: SOFT, stagger: 0.09, clearProps: 'transform', scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
    });
    drift($$('[data-sig-drift]'));
  }

  function seams() {
    $$('[data-sig-seam]').forEach((el) => {
      const sec = (el.closest('section') as El) || el;
      const tl = gsap.timeline(STATIC ? {} : { scrollTrigger: { trigger: sec, start: 'top 75%', once: true } });
      tl.from(el, { y: 120, rotation: -8, opacity: 0, duration: 1.6, ease: SOFT, clearProps: 'opacity' });
      if (STATIC) {
        tl.progress(1);
        return;
      }
      gsap.to(el, { rotation: 4, y: -40, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: 1.2 } });
    });
  }

  function edges() {
    if (STATIC) return;
    $$('[data-edge] path').forEach((path) => {
      gsap.fromTo(path, { scaleY: 0.4, transformOrigin: '50% 100%' }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: path.closest('svg'), start: 'top bottom', end: 'top 55%', scrub: 1 } });
    });
  }

  /** a pen draws every path of the drawing in order: the story the metaphor tells, told in time */
  function drawings() {
    if (STATIC || !DRAW) return;
    $$('[data-sig-draw]').forEach((svg) => {
      const paths = $$('path', svg);
      if (!paths.length) return;
      const scrub = svg.getAttribute('data-sig-draw') === 'scrub';
      const tl = gsap.timeline({ scrollTrigger: scrub ? { trigger: svg, start: 'top 80%', end: 'bottom 40%', scrub: 1 } : { trigger: svg, start: 'top 78%', once: true } });
      // long strokes take longer, so the pen keeps one speed; short strokes in a run (hatching)
      // overlap, so a shape of many lines fills in about a second instead of one line at a time
      paths.forEach((p) => {
        const len = (p as unknown as SVGPathElement).getTotalLength ? (p as unknown as SVGPathElement).getTotalLength() : 200;
        const d = scrub ? len / 600 : Math.min(2.2, 0.12 + len / 1600);
        const at = len < 320 ? `>-${(d * 0.8).toFixed(2)}` : scrub ? '>' : '>-0.05';
        tl.from(p, { drawSVG: '0%', duration: d, ease: scrub ? 'none' : 'power1.inOut' }, at);
      });
    });
  }

  function transition() {
    if (STATIC) return;
    const root = ($('[data-sd-root]') as El) || document.body;
    document.addEventListener('click', (e) => {
      const a = (e.target as El).closest && ((e.target as El).closest('a[href^="https://p.superdesign.dev/draft/"]') as HTMLAnchorElement | null);
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      gsap.to(root, { opacity: 0, y: -16, duration: 0.45, ease: 'power2.in', onComplete: () => location.assign(a.href) });
    });
    w.addEventListener('pageshow', (ev: PageTransitionEvent) => ev.persisted && gsap.set(root, { opacity: 1, y: 0 }));
  }

  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        guard('smooth', smooth);
        guard('header', header);
        guard('hero', hero);
        guard('leads', sectionLeads);
        guard('scrubbed', scrubbed);
        guard('cards', cards);
        guard('seams', seams);
        guard('edges', edges);
        guard('drawings', drawings);
        guard('transition', transition);
        ST.refresh();
      }),
    );
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  setTimeout(run, 900);
}
