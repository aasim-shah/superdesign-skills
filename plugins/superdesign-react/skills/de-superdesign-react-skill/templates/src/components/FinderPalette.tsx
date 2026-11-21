/**
 * FinderPalette: a command-palette search. Opens from the header search button, any form that calls
 * useFinder().open(query), "/" or Cmd/Ctrl-K (Layout). Pinned 96px from the top, never vertically
 * centred (canvas frames are up to 10,000px tall). Focused input, popular chips, grouped results with
 * match highlighting, arrows to move, Enter to open, Esc and outside click to close, focus trapped.
 * Rendered only while open, so the server markup never contains it.
 * Handoff: a dialog component; the index (content/palette.ts) becomes a search endpoint or JSON file.
 */
import { ArrowRight, Search } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { palette, popular, type PaletteItem } from '../content/palette';
import { A } from '../lib/sd';
import { useFinder } from './Layout';

function highlight(label: string, q: string) {
  const at = q ? label.toLowerCase().indexOf(q) : -1;
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <mark>{label.slice(at, at + q.length)}</mark>
      {label.slice(at + q.length)}
    </>
  );
}

export function FinderPalette() {
  const finder = useFinder();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!finder.isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement;
    setQ(finder.query);
    document.documentElement.style.overflow = 'hidden';
    const t = window.setTimeout(() => input.current?.focus(), 10);
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = '';
      lastFocus.current?.focus?.();
    };
  }, [finder.isOpen, finder.query]);

  const query = q.trim().toLowerCase();
  const results = useMemo(
    () => palette.filter((it) => !query || query.split(/\s+/).every((w) => (it.label + ' ' + it.keywords).toLowerCase().includes(w))),
    [query],
  );
  useEffect(() => setSel(query ? 0 : -1), [query]);

  if (!finder.isOpen) return null;

  const groups: Array<[string, PaletteItem[]]> = [];
  results.forEach((it) => {
    const g = groups.find(([name]) => name === it.group);
    if (g) g[1].push(it);
    else groups.push([it.group, [it]]);
  });

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      finder.close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, Math.min(results.length - 1, s + (e.key === 'ArrowDown' ? 1 : -1))));
    } else if (e.key === 'Enter' && document.activeElement === input.current && results[Math.max(sel, 0)]) {
      e.preventDefault();
      document.getElementById(results[Math.max(sel, 0)].id)?.click();
    } else if (e.key === 'Tab' && box.current) {
      const f = [...box.current.querySelectorAll<HTMLElement>('input, button, a')].filter((x) => x.offsetParent);
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1]?.focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0]?.focus();
      }
    }
  };

  return (
    <div data-pal data-open="true" className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Search the site" onKeyDown={onKey}>
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[6px]" onClick={finder.close} aria-hidden="true" />
      <div ref={box} className="absolute left-1/2 top-24 w-[min(720px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-card bg-white shadow-lg">
        <div className="flex h-[72px] items-center gap-3 border-b border-line px-[22px]">
          <Search size={24} className="text-brand-600" aria-hidden="true" />
          <label htmlFor="pal-q" className="sr-only">
            Search
          </label>
          <input
            ref={input}
            id="pal-q"
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search pages, services and places"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-results"
            aria-autocomplete="list"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-[20px] text-ink-800 outline-none"
          />
          <kbd className="kbd text-ink-500">Esc</kbd>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <span className="mr-1 font-display text-[13px] font-semibold text-ink-500">Popular</span>
          {popular.map((p) => (
            <button key={p.q} type="button" className="chip border border-line bg-white text-ink-900 hover:bg-brand-50" onClick={() => { setQ(p.q); input.current?.focus(); }}>
              {p.label}
            </button>
          ))}
        </div>
        <div id="pal-results" role="listbox" className="max-h-[440px] overflow-y-auto p-2">
          {groups.map(([name, items]) => (
            <Fragment key={name}>
              <p className="px-3 pb-1.5 pt-3.5 font-display text-[13px] font-semibold text-brand-700">{name}</p>
              {items.map((it) => {
                const Icon = it.icon;
                const selected = results.indexOf(it) === sel;
                return (
                  <A key={it.id} id={it.id} href={it.href} role="option" aria-selected={selected} data-pal-item className={'grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[14px] px-3 py-2.5 hover:bg-brand-50' + (selected ? ' bg-brand-50' : '')}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display font-semibold text-ink-900">{highlight(it.label, query)}</span>
                      <span className="block truncate text-[14px] text-ink-500">{it.desc}</span>
                    </span>
                    <ArrowRight size={18} className="text-ink-500" aria-hidden="true" />
                  </A>
                );
              })}
            </Fragment>
          ))}
          {!results.length && (
            <p className="px-3 py-8 text-center text-ink-500">
              Nothing matches yet.{' '}
              <A id="pal-empty-contact" href="#contact" className="link">
                Ask us
              </A>
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-paper px-[22px] py-3 text-[14px] text-ink-500">
          <span>
            <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move · <kbd className="kbd">↵</kbd> to open
          </span>
          <A id="pal-all" href="#search" className="font-display font-semibold text-brand-700 hover:underline">
            See all results
          </A>
        </div>
      </div>
    </div>
  );
}
