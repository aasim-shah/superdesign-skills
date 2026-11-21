/**
 * Cutouts: the parts of a product-led composition (references/creative-direction.md).
 *   Phone    · a device frame around a real screenshot (an img('screen-…') key); [data-tilt] for pointer tilt
 *   Callout  · a glass note that names one real part of the product; [data-callout] slides in
 *   Leads    · hairline leader lines from dots on the product to the callouts, in the stage's own
 *              coordinates; [data-lead] draws (DrawSVG), [data-dot] breathes
 * Put all three in one fixed-size stage (for example 640 x 880, `absolute`, `hidden lg:block`) so the
 * coordinates line up; on phones show the Phone alone. Every piece is decorative except the
 * screenshot's alt text. Handoff: components/product/*.tsx; the screenshot becomes next/image.
 *
 * The motion that goes with these lives in motion/signature.ts (see the recipe in the reference).
 * Needs in styles.css: .phone-shadow and .phone-rim (box-shadows built from theme colors).
 */
import type { LucideIcon } from 'lucide-react';

/** Screenshot size in px (the source image); the frame keeps its aspect ratio. */
export function Phone({ src, alt, width = 340, shot = [660, 1434], rim = false, className = '' }: { src: string; alt: string; width?: number; shot?: [number, number]; rim?: boolean; className?: string }) {
  const inner = width - 20;
  return (
    <div data-tilt className={`${rim ? 'phone-rim' : 'phone-shadow'} relative rounded-[58px] bg-ink-950 p-[10px] ${className}`} style={{ width }}>
      <img src={src} alt={alt} width={inner} height={Math.round((inner * shot[1]) / shot[0])} className="block w-full rounded-[48px]" />
      <span className="absolute left-1/2 top-[22px] h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-ink-950" aria-hidden="true" />
    </div>
  );
}

export function Callout({ icon: Icon, title, sub, className = '' }: { icon: LucideIcon; title: string; sub: string; className?: string }) {
  return (
    <div data-callout className={`flex items-center gap-3 rounded-2xl border border-white/15 bg-ink-900/75 py-3 pl-3 pr-5 backdrop-blur-md ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[15px] font-semibold leading-tight text-white">{title}</span>
        <span className="mt-0.5 block text-[13px] text-white/75">{sub}</span>
      </span>
    </div>
  );
}

/**
 * Leader lines. Each lead goes from a dot on the product to the left or right edge of its callout.
 * Dot y on a screenshot = frame top + 10 + f * screenshot height, where f is the element's fraction
 * of the screenshot's height.
 */
export function Leads({ width, height, leads }: { width: number; height: number; leads: Array<{ from: [number, number]; to: [number, number] }> }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {leads.map(({ from: [x1, y1], to: [x2, y2] }, i) => {
        const mx = (x1 + x2) / 2;
        return (
          <g key={i}>
            <path data-lead d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} className="fill-none stroke-white/60" strokeWidth="1.25" />
            <circle data-dot cx={x1} cy={y1} r="11" className="fill-brand-500/30" />
            <circle cx={x1} cy={y1} r="5.5" className="fill-brand-600 stroke-white" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}
