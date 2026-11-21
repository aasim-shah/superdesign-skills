/**
 * Art.tsx: WalkAway's line art, inline SVG, hairline ink with one orange point. Decorative
 * (aria-hidden) beside real text; the markup is the finished state, motion only animates towards it.
 *   Route  · one line from bed to mirror; it draws as you scroll and a point travels it  [data-sig="route"]
 *   Mark   · a small mark per challenge, drawn in one or two strokes                     [data-mark]
 *   Lens   · a ring that closes to a point                                               [data-sig="lens"]
 * Handoff: components/art/*.tsx; the hooks become useGSAP() inside each component.
 */

export const ROUTE_D = 'M8 150 C 220 150, 300 40, 520 70 S 820 190, 1000 120 S 1140 30, 1180 40';

export function Route({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 190" className={className} aria-hidden="true" data-sig="route">
      <path d={ROUTE_D} className="fill-none stroke-stone-300" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path data-route d={ROUTE_D} className="fill-none stroke-ink-900" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      <circle cx="8" cy="150" r="3.5" className="fill-ink-900" />
      <g data-walker transform="translate(1180 40)">
        <circle r="14" className="fill-accent-500/15" />
        <circle r="5" className="fill-accent-600" />
      </g>
    </svg>
  );
}

export function Mark({ id }: { id: string }) {
  const s = 'fill-none stroke-ink-900';
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 md:h-12 md:w-12" aria-hidden="true" data-mark={id} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {id === 'qr' && (
        <g>
          <path data-draw className={s} d="M8 16 V8 H16 M32 8 H40 V16 M40 32 V40 H32 M16 40 H8 V32" />
          <path data-draw className="fill-none stroke-accent-600" d="M12 24 H36" />
        </g>
      )}
      {id === 'nfc' && (
        <g>
          <path data-draw className={s} d="M20 16 A10 10 0 0 1 20 32" />
          <path data-draw className={s} d="M26 11 A16 16 0 0 1 26 37" />
          <circle cx="12" cy="24" r="2.5" className="fill-accent-600" />
        </g>
      )}
      {id === 'object' && (
        <g>
          <path data-draw className={s} d="M12 18 H32 V30 A8 8 0 0 1 24 38 H20 A8 8 0 0 1 12 30 Z M32 21 H35 A4 4 0 0 1 35 29 H32" />
          <circle cx="22" cy="11" r="2" className="fill-accent-600" />
        </g>
      )}
      {id === 'move' && (
        <g>
          <path data-draw className={s} d="M24 14 V27 M24 18 L16 23 M24 18 L32 23 M24 27 L18 38 M24 27 L30 38" />
          <circle cx="24" cy="9" r="3" className="fill-accent-600" />
        </g>
      )}
      {id === 'voice' && (
        <g>
          <path data-draw className={s} d="M10 20 V28 M16 15 V33 M28 12 V36 M34 18 V30 M40 22 V26" />
          <path data-draw className="fill-none stroke-accent-600" d="M22 9 V39" />
        </g>
      )}
    </svg>
  );
}

export function Lens({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-60 -60 120 120" className={className} aria-hidden="true" data-sig="lens">
      <circle r="56" className="fill-none stroke-ink-900" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle data-lens r="40" className="fill-ink-900" />
      <circle r="2.5" className="fill-accent-500" />
    </svg>
  );
}
