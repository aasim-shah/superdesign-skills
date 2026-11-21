/**
 * useFilter: chip filters over a list, with a Flip glide when the motion layer is running.
 *
 *   const f = useFilter('all');
 *   <div role="group" aria-label="Filter">{tags.map(t => <button aria-pressed={f.value === t} onClick={() => f.choose(t)}>)}</div>
 *   <ul ref={f.listRef} data-repeater="cards">{items.map(it => <li data-tags={it.tags} hidden={!f.shows(it.tags)}>)}</ul>
 *   <span>{items.filter(it => f.shows(it.tags)).length} results</span>
 *
 * Items hide with the hidden attribute (styles.css ships [hidden] { display: none !important }, or a
 * Tailwind flex class would win). Every item is in the server markup, so the canvas shows the full list.
 */
import { useLayoutEffect, useRef, useState } from 'react';

export function useFilter(initial = 'all') {
  const [value, setValue] = useState(initial);
  const listRef = useRef<HTMLUListElement>(null);
  const flip = useRef<unknown>(null);
  const choose = (v: string) => {
    const w = window as unknown as { sdFlipState?: (els: ArrayLike<Element>) => unknown };
    if (w.sdFlipState && listRef.current) flip.current = w.sdFlipState(listRef.current.querySelectorAll('[data-tags]'));
    setValue(v);
  };
  useLayoutEffect(() => {
    const w = window as unknown as { sdFlipPlay?: (s: unknown) => void };
    if (flip.current && w.sdFlipPlay) w.sdFlipPlay(flip.current);
    flip.current = null;
  }, [value]);
  const shows = (tags: string) => value === 'all' || tags.split(' ').includes(value);
  return { value, choose, listRef, shows };
}
