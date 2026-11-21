/**
 * MegaMenu: one disclosure per menu group. A <button data-dd aria-expanded aria-controls> and an
 * absolute panel below the header, closed by default, so page height never changes.
 * Opens on click, Enter, Space or ArrowDown, and on hover after a 70ms intent delay (pointer devices);
 * closes on Esc (focus back to the button), outside click and focus leaving. Plain links, no
 * role="menu". Hidden below lg (display none): a hidden panel would still widen phone pages.
 */
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { site } from '../content/site';
import { A, cx } from '../lib/sd';

type Group = (typeof site)['mega'];

export function MegaMenu({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-header]')) setOpen(false);
    };
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };
  const hover = fine ? { onMouseEnter: () => later(() => setOpen(true), 70), onMouseLeave: () => later(() => setOpen(false), 180) } : {};

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => panel.current?.querySelector('a')?.focus());
    }
  };

  return (
    <>
      <button ref={btn} type="button" className="nav-btn" data-dd aria-expanded={open} aria-controls={group.id} onClick={() => setOpen((o) => !o)} onKeyDown={onKey} {...hover}>
        <span className="inline-flex items-center gap-1.5">
          {group.label}
          <ChevronDown size={14} aria-hidden="true" className={cx('transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>
      <div
        ref={panel}
        id={group.id}
        role="region"
        aria-label={group.label}
        data-mega
        data-open={open}
        onBlur={(e) => {
          const to = e.relatedTarget as Node | null;
          if (!to || (!panel.current?.contains(to) && to !== btn.current)) setOpen(false);
        }}
        {...hover}
        className={cx(
          'absolute inset-x-0 top-full z-[45] hidden rounded-b-[32px] border-t border-line bg-white shadow-lg transition duration-200 lg:block',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0',
        )}
      >
        {/* grid-cols-1 first: a 12-column grid without it overflows at 390 */}
        <div className="grid grid-cols-1 gap-8 px-8 py-9 lg:grid-cols-12">
          <div className="lg:col-span-3 lg:border-r lg:border-line lg:pr-8">
            <p className="font-display text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-ink-950">{group.lead}</p>
            <p className="mt-3 text-[15px] text-ink-500">{group.sub}</p>
          </div>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:col-span-6" role="list">
            {group.items.map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.id}>
                  <A id={it.id} href={it.href} className="mm-row">
                    <span className="mm-ic">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="mm-title">{it.title}</span>
                      <span className="mm-desc">{it.desc}</span>
                    </span>
                  </A>
                </li>
              );
            })}
          </ul>
          <A id={group.feature.id} href={group.feature.href} className="on-dark relative overflow-hidden rounded-card bg-ink-900 p-6 text-white lg:col-span-3">
            <span className="relative mt-16 block font-display text-[22px] font-bold leading-tight">{group.feature.title}</span>
            <span className="relative mt-1 block text-[15px]">{group.feature.desc}</span>
            <span className="relative mt-4 inline-flex items-center gap-2 font-display font-semibold">
              {group.feature.action} <ArrowRight size={16} aria-hidden="true" />
            </span>
          </A>
        </div>
      </div>
    </>
  );
}
