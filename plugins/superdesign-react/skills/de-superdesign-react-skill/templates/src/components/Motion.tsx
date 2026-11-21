/**
 * Motion: starts the three motion layers (motion.ts, signature.ts, product.ts) once, after hydration. Renders nothing, so server and client
 * markup are identical. The layers work on data-* hooks in the DOM (motion/motion.ts,
 * motion/signature.ts); GSAP is loaded by the build from jsDelivr, pinned, before the page script.
 * Handoff: each layer becomes useGSAP() hooks inside the components that own the hooks.
 */
import { useEffect } from 'react';
import { startMotion } from '../motion/motion';
import { startProduct } from '../motion/product';
import { startSignature } from '../motion/signature';

let started = false;

export function Motion() {
  useEffect(() => {
    if (started) return;
    started = true;
    startMotion();
    startSignature();
    startProduct();
  }, []);
  return null;
}
