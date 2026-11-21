/**
 * Product.tsx: the cutouts. A phone frame around the real app screenshots (uploaded keys), glass
 * callouts with leader lines, and five shaded objects that break out of their panels and cards.
 *   Phone    · frame + screenshot; [data-tilt] follows the pointer a few degrees
 *   Callout  · glass note; its leader line is drawn by the parent SVG ([data-lead])
 *   Thing    · qr, nfc, mug, kettlebell, mic: inline SVG, shaded with gradient stops by class
 * Handoff: components/product/*.tsx; screenshots become next/image with the same alt text.
 */
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';

export function Phone({ src, alt, className = '', width = 340, rim = false }: { src: string; alt: string; className?: string; width?: number; rim?: boolean }) {
  return (
    <div data-tilt className={`${rim ? 'phone-rim' : 'phone-shadow'} relative rounded-[58px] bg-night-950 p-[10px] ${className}`} style={{ width }}>
      <img src={src} alt={alt} width={width - 20} height={Math.round(((width - 20) * 1434) / 660)} className="block w-full rounded-[48px]" />
      <span className="absolute left-1/2 top-[22px] h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-night-950" aria-hidden="true" />
    </div>
  );
}

export function Callout({ icon: Icon, title, sub, className = '' }: { icon: LucideIcon; title: string; sub: string; className?: string }) {
  return (
    <div data-callout className={`flex items-center gap-3 rounded-2xl border border-white/15 bg-night-800/75 py-3 pl-3 pr-5 backdrop-blur-md ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[15px] font-semibold leading-tight text-white">{title}</span>
        <span className="mt-0.5 block text-[13px] text-stone-300">{sub}</span>
      </span>
    </div>
  );
}

const QR = [
  '1111111010111111',
  '1000001001100001',
  '1011101011101101',
  '1011101000101101',
  '1011101010101101',
  '1000001011100001',
  '1111111010111111',
  '0000000011000000',
  '1101011100110101',
  '0110100101011010',
  '1011010110100101',
  '0000000010110100',
  '1111111001011011',
  '1000001011010010',
  '1011101000111101',
  '1111111010010111',
];

function Shadow({ cx = 80, cy = 148, rx = 50 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry="7" className="fill-night-950/25" style={{ filter: 'blur(5px)' }} />;
}

export function Thing({ id, className = '' }: { id: 'qr' | 'nfc' | 'object' | 'move' | 'voice'; className?: string }) {
  const g = `wa-${id}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true" data-thing={id} overflow="visible">
      <defs>
        <linearGradient id={`${g}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={id === 'move' ? 'st-night7' : 'st-white'} />
          <stop offset="1" className={id === 'move' ? 'st-night9' : 'st-stone2'} />
        </linearGradient>
        <linearGradient id={`${g}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="st-acc5" />
          <stop offset="1" className="st-acc6" />
        </linearGradient>
      </defs>
      {id === 'qr' && (
        <g>
          <Shadow rx={46} />
          <g transform="rotate(-9 80 78)">
            <rect x="28" y="24" width="104" height="112" rx="8" fill={`url(#${g}-a)`} className="stroke-stone-200" />
            {QR.map((row, y) =>
              row.split('').map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={40 + x * 5} y={36 + y * 5} width="5" height="5" className="fill-night-950" /> : null)),
            )}
            <text x="80" y="128" textAnchor="middle" className="fill-ink-500 font-sans" fontSize="7" fontWeight="700" letterSpacing="1">
              BATHROOM
            </text>
            <rect x="58" y="14" width="44" height="16" rx="2" className="fill-accent-500/55" transform="rotate(4 80 22)" />
          </g>
        </g>
      )}
      {id === 'nfc' && (
        <g>
          <Shadow rx={44} />
          <circle cx="80" cy="76" r="54" fill={`url(#${g}-a)`} className="stroke-stone-200" />
          {[38, 31, 24].map((r) => (
            <rect key={r} x={80 - r} y={76 - r} width={r * 2} height={r * 2} rx={r * 0.45} className="fill-none stroke-stone-300" strokeWidth="2" />
          ))}
          <rect x="72" y="68" width="16" height="16" rx="3" className="fill-night-800" />
          <circle cx="80" cy="76" r="54" className="fill-none stroke-white" strokeWidth="2" opacity=".7" />
          <circle cx="112" cy="40" r="5" fill={`url(#${g}-b)`} />
        </g>
      )}
      {id === 'object' && (
        <g>
          <Shadow rx={48} />
          <path d="M44 52 H112 V112 A24 24 0 0 1 88 136 H68 A24 24 0 0 1 44 112 Z" fill={`url(#${g}-a)`} className="stroke-stone-300" />
          <path d="M112 66 H120 A16 16 0 0 1 120 98 H112" className="fill-none stroke-stone-300" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="78" cy="52" rx="34" ry="8" className="fill-white stroke-stone-300" />
          <ellipse cx="78" cy="53" rx="28" ry="5.5" className="fill-night-800" />
          <rect x="52" y="74" width="10" height="44" rx="5" className="fill-white/70" />
          <path d="M66 38 C 60 30, 72 24, 66 14 M84 38 C 78 30, 90 24, 84 14" className="fill-none stroke-stone-300" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {id === 'move' && (
        <g>
          <Shadow rx={46} />
          <path d="M56 70 C 52 38, 60 26, 80 26 C 100 26, 108 38, 104 70" className="fill-none stroke-night-900" strokeWidth="11" strokeLinecap="round" />
          <circle cx="80" cy="98" r="44" fill={`url(#${g}-a)`} />
          <ellipse cx="66" cy="82" rx="14" ry="9" className="fill-white/20" transform="rotate(-30 66 82)" />
          <text x="80" y="108" textAnchor="middle" className="fill-white/80 font-sans" fontSize="20" fontWeight="800">
            8
          </text>
        </g>
      )}
      {id === 'voice' && (
        <g>
          <Shadow rx={34} cy={150} />
          <path d="M80 104 V136 M60 140 H100" className="fill-none stroke-ink-700" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 74 A30 30 0 0 0 110 74" className="fill-none stroke-ink-700" strokeWidth="5" strokeLinecap="round" />
          <rect x="58" y="14" width="44" height="80" rx="22" fill={`url(#${g}-a)`} className="stroke-stone-300" />
          {[30, 40, 50, 60].map((y) => (
            <path key={y} d={`M64 ${y} H96`} className="stroke-stone-300" strokeWidth="2" strokeLinecap="round" />
          ))}
          <circle cx="80" cy="78" r="5" fill={`url(#${g}-b)`} />
        </g>
      )}
    </svg>
  );
}
