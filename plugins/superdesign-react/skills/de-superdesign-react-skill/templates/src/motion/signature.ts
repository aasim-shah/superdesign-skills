/**
 * signature.ts: the brand's own motion, started after motion.ts. Rename the hooks after the brand
 * device (a pet salon used data-sig="bubbles" that pop, a dog rising from a tub, a paw trail).
 * Same rules as motion.ts: transforms and opacity only, nothing left hidden, static on full-height
 * canvas frames, off for reduced motion, every loop registered with sdLoop() so Pause animation stops it.
 * The authored markup is the finished state: the layer only animates towards it.
 *
 * Skeleton hooks (replace with the project's): [data-sig="rise"] rises in the hero · .sticker slaps on ·
 * [data-sig-float] > * drift forever (decorative, aria-hidden) · [data-sig-trail] > * appear in sequence.
 * Handoff: one hook or component per device; list each in design-system.md section 7.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type El = HTMLElement;

export function startSignature() {
  const w = window as any;
  const gsap = w.gsap;
  if (!gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $$ = (sel: string, ctx?: ParentNode) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel)) as El[];
  const guard = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      console.warn('[sd-signature]', e);
    }
  };
  const root = (document.querySelector('[data-sd-root]') as El) || document.body;
  const STATIC = innerHeight > 1600;
  const loop = w.sdLoop || ((t: any) => t);
  const R = gsap.utils.random;

  function hero() {
    const sec = root.querySelector('main > section');
    if (!sec) return;
    const tl = gsap.timeline({ delay: 0.25 });
    $$('[data-sig="rise"]', sec).forEach((d) => tl.from(d, { yPercent: 30, opacity: 0, duration: 1.3, ease: 'back.out(1.25)', clearProps: 'opacity' }, 0.15));
    const st = $$('.sticker', sec);
    if (st.length) tl.from(st, { scale: 1.6, rotate: '+=20', opacity: 0, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.14, clearProps: 'opacity' }, 0.9);
    if (STATIC) tl.progress(1);
  }

  function ambient() {
    if (STATIC) return; // the canvas never scrolls or waits: devices rest where the markup put them
    $$('[data-sig-float] > *').forEach((el) => {
      loop(gsap.to(el, { y: R(-30, -12), x: R(-8, 8), rotate: R(-6, 6), duration: R(4, 8), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: R(0, 2) }));
    });
  }

  function scroll() {
    if (STATIC || !w.ScrollTrigger) return;
    $$('[data-sig-trail]').forEach((t) => {
      gsap.from(t.children, { scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(2.6)', stagger: 0.11, clearProps: 'opacity,transform', scrollTrigger: { trigger: t, start: 'top 82%', once: true } });
    });
  }

  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    requestAnimationFrame(() => requestAnimationFrame(() => { guard(hero); guard(ambient); guard(scroll); }));
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
  setTimeout(run, 700);
}
