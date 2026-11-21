/**
 * UtilityBar: skip link target bar with the Pause animation switch (WCAG 2.2.2). Dark band: every
 * text, link and icon is white. Handoff: part of the app header.
 */
import { Pause, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { site } from '../content/site';
import { A, useSd } from '../lib/sd';

/** Pause animation: sets html.sd-still, stops every loop (motion.ts listens), remembered per visitor. */
export function MotionToggle({ className = '' }: { className?: string }) {
  const { prefix } = useSd();
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(document.documentElement.classList.contains('sd-still'));
  }, []);
  const toggle = () => {
    const next = !off;
    setOff(next);
    document.documentElement.classList.toggle('sd-still', next);
    try {
      localStorage.setItem('sd-motion:' + prefix, next ? 'off' : 'on');
    } catch (e) {
      // storage blocked: the choice lasts for this page only
    }
    document.dispatchEvent(new CustomEvent('sd-motion', { detail: { off: next } }));
  };
  const Icon = off ? Play : Pause;
  return (
    <button type="button" data-motion-toggle aria-pressed={off} onClick={toggle} className={className}>
      <span className="inline-flex items-center gap-1.5">
        <Icon size={14} aria-hidden="true" fill="currentColor" />
        <span data-motion-label className="sr-only sm:not-sr-only">
          {off ? 'Play animation' : 'Pause animation'}
        </span>
      </span>
    </button>
  );
}

export function UtilityBar() {
  return (
    <div data-util className="on-dark relative z-[60] bg-ink-950 text-white">
      <div className="wrap flex h-10 items-center justify-between gap-6 text-[14px]">
        <p className="flex min-w-0 items-center gap-2.5 truncate font-display font-medium">
          <Sparkles size={18} aria-hidden="true" />
          <span className="truncate">
            {site.promise}
            <span className="hidden sm:inline"> · {site.promiseShort}</span>
          </span>
        </p>
        <nav aria-label="Utility" className="flex shrink-0 items-center gap-5 font-display font-medium">
          {site.utility.map((l) => (
            <A key={l.id} id={l.id} href={l.href} className="hidden hover:underline md:inline">
              {l.label}
            </A>
          ))}
          <MotionToggle className="inline-flex min-h-[28px] items-center whitespace-nowrap rounded-full border border-white/25 px-3 py-1 text-[13px] hover:bg-white/10" />
        </nav>
      </div>
    </div>
  );
}
