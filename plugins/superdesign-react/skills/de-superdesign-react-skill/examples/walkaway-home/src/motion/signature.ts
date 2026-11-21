/**
 * signature.ts: WalkAway's motion, started after motion.ts. Smooth, weighted, never bouncy-cute.
 * GSAP 3.15 (ScrollTrigger, DrawSVGPlugin) and Lenis smooth scroll, pinned and loaded by the build.
 *
 *   smooth     · Lenis drives the scroll; ScrollTrigger listens to it
 *   header     · [data-header] gets data-scrolled after the first 10px
 *   hero       · the phone rises out of the panel, the halo opens, leader lines draw to the callouts,
 *                the dots breathe, objects drift and follow the pointer at different depths
 *   cards      · [data-sig="cards"]: each object drops onto its card as the row comes into view
 *   journey    · the leaning phone turns upright as you scroll past
 *   strict     · the rules phone rises out of the bottom edge; its leader lines draw
 *   early      · the objects settle onto the panel edge
 *   lens       · [data-sig="lens"]: the ring closes to a point
 *   transition · links to another draft fade the page out first
 *
 * Rules (as motion.ts): transforms, opacity and SVG strokes only; the markup is the finished state;
 * canvas frames (innerHeight > 1600) are static; reduced motion gets nothing; loops go through
 * sdLoop() so Pause animation stops them. Pointer effects only with a fine pointer.
 * Handoff: Lenis in the root layout; one useGSAP() hook per device inside its component.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type El = HTMLElement;

export function startSignature() {
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
      console.warn('[wa-signature]', name, e);
    }
  };
  const STATIC = innerHeight > 1600;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const loop = w.sdLoop || ((t: any) => t);
  const R = gsap.utils.random;
  const SOFT = 'expo.out';

  function smooth() {
    if (STATIC || !w.Lenis) return;
    const lenis = new w.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t: number) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    w.waLenis = lenis;
  }

  function header() {
    const h = $('[data-header]');
    if (!h || STATIC) return;
    ST.create({ start: 0, end: 'max', onUpdate: (self: any) => h.toggleAttribute('data-scrolled', self.scroll() > 10) });
  }

  /** draw leader lines, then slide their callouts in */
  function leads(scope: El, at: number, tl: any) {
    const lines = $$('[data-lead]', scope);
    const callouts = $$('[data-callout]', scope);
    if (DRAW && lines.length) tl.from(lines, { drawSVG: '0%', duration: 0.9, ease: 'power2.inOut', stagger: 0.14 }, at);
    if (callouts.length) tl.from(callouts, { x: 28, opacity: 0, duration: 0.9, ease: SOFT, stagger: 0.14, clearProps: 'opacity' }, at + 0.35);
    $$('[data-dot]', scope).forEach((d, i) => {
      gsap.set(d, { transformOrigin: '50% 50%' });
      loop(gsap.to(d, { scale: 1.7, opacity: 0.15, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 }));
    });
  }

  function drift(things: El[]) {
    things.forEach((t) => loop(gsap.to(t, { y: `+=${R(-14, -6)}`, rotation: `+=${R(-4, 4)}`, duration: R(3.5, 6), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: R(0, 1.5) })));
  }

  function hero() {
    const sec = $('[data-sig="hero"]');
    const stage = sec && $('[data-sig-stage]', sec);
    if (!sec || !stage) return;
    const phone = $('[data-tilt]', stage);
    const halo = $('[data-sig-halo]', stage);
    const things = $$('[data-thing]', stage);
    const tl = gsap.timeline({ delay: 0.25 });
    if (halo) tl.from(halo, { scale: 0.55, opacity: 0, duration: 2.2, ease: 'power2.out' }, 0);
    if (phone) tl.from(phone, { y: 180, rotation: 4, duration: 1.6, ease: SOFT }, 0.1);
    if (things.length) tl.from(things, { y: 60, rotation: '-=12', opacity: 0, duration: 1.4, ease: SOFT, stagger: 0.12, clearProps: 'opacity' }, 0.45);
    leads(stage, 1.0, tl);
    if (STATIC) {
      tl.progress(1);
      gsap.globalTimeline.getChildren(true, true, false).forEach((t: any) => t.repeat && t.repeat() === -1 && t.pause(0));
      return;
    }
    drift(things);
    // depth on scroll: the phone climbs slower than the page, objects faster
    gsap.to(stage, { y: -70, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: 1 } });
    if (FINE && phone) {
      const rx = gsap.quickTo(phone, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(phone, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      const tx = things.map((t, i) => gsap.quickTo(t, 'x', { duration: 1.2 + i * 0.2, ease: 'power3.out' }));
      gsap.set(phone, { transformPerspective: 1200 });
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

  function cards() {
    const ol = $('[data-sig="cards"]');
    if (!ol || STATIC) return;
    const things = $$('[data-thing]', ol);
    gsap.from(things, { y: -70, rotation: -14, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: 0.09, clearProps: 'opacity,transform', scrollTrigger: { trigger: ol, start: 'top 82%', once: true } });
    gsap.from($$('[data-card]', ol), { y: 40, duration: 1.2, ease: SOFT, stagger: 0.09, clearProps: 'transform', scrollTrigger: { trigger: ol, start: 'top 85%', once: true } });
  }

  function journey() {
    const sec = $('[data-sig="journey"]');
    const lean = sec && $('[data-sig-lean]', sec);
    if (!sec || !lean || STATIC) return;
    gsap.fromTo(lean, { rotation: -14, y: 90 }, { rotation: -4, y: -20, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    drift($$('[data-thing]', sec));
  }

  function strict() {
    const sec = $('[data-sig="strict"]');
    if (!sec || STATIC) return;
    const rise = $('[data-sig-rise]', sec);
    if (rise) gsap.fromTo(rise, { y: 160 }, { y: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'center center', scrub: 1.2 } });
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 55%', once: true } });
    leads(sec, 0.2, tl);
  }

  function early() {
    const sec = $('[data-sig="early"]');
    if (!sec || STATIC) return;
    const things = $$('[data-thing]', sec);
    gsap.from(things, { y: -80, rotation: 18, opacity: 0, duration: 1.4, ease: 'power3.out', stagger: 0.15, clearProps: 'opacity', scrollTrigger: { trigger: sec, start: 'top 80%', once: true } });
    drift(things);
  }

  function lens() {
    const svg = $('[data-sig="lens"]');
    if (!svg || STATIC) return;
    const disc = $('[data-lens]', svg);
    if (disc) gsap.fromTo(disc, { scale: 0.08, transformOrigin: '50% 50%' }, { scale: 1, ease: 'none', scrollTrigger: { trigger: svg, start: 'top 85%', end: 'top 35%', scrub: 1 } });
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
        guard('cards', cards);
        guard('journey', journey);
        guard('strict', strict);
        guard('early', early);
        guard('lens', lens);
        guard('transition', transition);
        ST.refresh();
      }),
    );
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  setTimeout(run, 900);
}
