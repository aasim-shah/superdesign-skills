/**
 * Sections: shaped section backgrounds and edges (references/inspiration.md sections 8 and 9).
 *   Split · two color fields side by side, the seam straight or slanted; put one object across the
 *           seam ([data-sig-seam]) so it joins the two colors
 *   Edge  · the edge between two sections, drawn in the neighbor's color: tilt, zigzag, wave, curve
 *           or blob; at the bottom of a section (rising into it) or at the top (hanging into it)
 * Both are decorative (aria-hidden) and need a `relative` parent; colors are full class names
 * (`bg-ink-950`, `fill-paper`) so Tailwind sees them. Handoff: components/sections/*.tsx.
 */
import type React from 'react';

export type EdgeShape = 'tilt' | 'zigzag' | 'wave' | 'curve' | 'blob';

const W = 1440;

function edgePath(shape: EdgeShape, h: number, teeth: number): string {
  switch (shape) {
    case 'tilt':
      return `M0 ${h} L${W} 0 L${W} ${h} Z`;
    case 'zigzag': {
      const step = W / teeth;
      let d = `M0 ${h} L0 ${h * 0.35}`;
      for (let i = 0; i < teeth; i++) d += ` L${step * i + step / 2} 0 L${step * (i + 1)} ${h * 0.35}`;
      return `${d} L${W} ${h} Z`;
    }
    case 'wave':
      return `M0 ${h * 0.55} C ${W * 0.17} ${-h * 0.1}, ${W * 0.33} ${h * 1.05}, ${W * 0.5} ${h * 0.5} S ${W * 0.83} ${-h * 0.05}, ${W} ${h * 0.45} L${W} ${h} L0 ${h} Z`;
    case 'curve':
      return `M0 ${h} Q ${W / 2} ${-h} ${W} ${h} Z`;
    case 'blob':
      return `M0 ${h * 0.75} C ${W * 0.08} 0, ${W * 0.2} ${h * 0.15}, ${W * 0.3} ${h * 0.5} S ${W * 0.45} ${h * 0.05}, ${W * 0.58} ${h * 0.55} S ${W * 0.78} ${h * 0.95}, ${W * 0.87} ${h * 0.3} S ${W * 0.97} ${h * 0.45}, ${W} ${h * 0.15} L${W} ${h} L0 ${h} Z`;
  }
}

/**
 * Edge: place it inside the section whose edge it shapes. `fill` is the NEIGHBOR's color as a fill
 * class: at the bottom it is the next section's color, at the top the previous one's.
 */
export function Edge({ shape, fill, at = 'bottom', height = 96, teeth = 24, flip = false, className = '' }: { shape: EdgeShape; fill: string; at?: 'top' | 'bottom'; height?: number; teeth?: number; flip?: boolean; className?: string }) {
  const transform = [at === 'top' ? 'scaleY(-1)' : '', flip ? 'scaleX(-1)' : ''].filter(Boolean).join(' ') || undefined;
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      data-edge={shape}
      className={`pointer-events-none absolute inset-x-0 block w-full ${at === 'bottom' ? '-bottom-px' : '-top-px'} ${fill} ${className}`}
      style={{ height, transform }}
    >
      <path d={edgePath(shape, height, teeth)} />
    </svg>
  );
}

/**
 * Split: two fields behind the content. `at` is where the seam sits (percent of the width);
 * `slant` leans the seam by that many px from top to bottom (0 is straight).
 */
export function Split({ left, right, at = 50, slant = 0, className = '', children }: { left: string; right: string; at?: number; slant?: number; className?: string; children: React.ReactNode }) {
  const clip = slant ? `polygon(${Math.max(slant, 0)}px 0, 100% 0, 100% 100%, ${Math.max(-slant, 0)}px 100%)` : undefined;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 ${left}`} aria-hidden="true" />
      <div className={`absolute inset-y-0 right-0 ${right}`} style={{ left: `calc(${at}% - ${Math.abs(slant) / 2}px)`, clipPath: clip }} aria-hidden="true" data-split />
      <div className="relative">{children}</div>
    </div>
  );
}
