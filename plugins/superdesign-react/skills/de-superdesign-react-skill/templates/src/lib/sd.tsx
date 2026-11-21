/**
 * sd.tsx: the draft runtime every page and component uses. build.mjs renders each page twice on
 * the server (pass 1 finds the ids on the page, pass 2 resolves in-page anchors) and once more in the
 * browser (hydration) with the SAME context, so server and client markup always match.
 *
 *   <A id href>       every link. #hash placeholders become live draft links (links.json + drafts.json),
 *                     in-page anchors stay hashes, chrome links (hdr- mm- ftr- util- nav- tab- mob-) to
 *                     the current page get aria-current="page". id is required (draft contract).
 *   <Block name>      one <section data-block> = one future app component (handoff contract).
 *   img('key')        an uploaded content image (asset-map.json). Unknown key = the build stops.
 *   brand('logo')     a brand asset (config.json brand_urls).
 *   useHref('#x')     the resolved URL, for buttons and forms that navigate (go(href) in handlers).
 *   Ph                marks invented copy: <Ph>Three pups a day</Ph> renders data-placeholder.
 *
 * Handoff: A becomes the app's router link, img() the app's image pipeline, Block disappears (each
 * block is already a component). Nothing here ships to production.
 */
import { createContext, useContext, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

export type LinkConfig = {
  base: string;
  id: Record<string, string | null>;
  page: Record<string, Record<string, string>>;
  hash: Record<string, string>;
  prefix: Record<string, string>;
  mobile: { pages: string[]; map: Record<string, string> };
};

export type SdCtx = {
  page: string;
  prefix: string;
  rootId: string;
  ids: string[];
  links: LinkConfig;
  drafts: Record<string, string>;
  assets: Record<string, string>;
  brand: Record<string, string>;
};

const Ctx = createContext<SdCtx | null>(null);
let CURRENT: SdCtx | null = null;
const rec = { assets: new Set<string>(), brand: new Set<string>(), hrefs: new Set<string>(), dead: new Map<string, number>() };

export function App({ ctx, children }: { ctx: SdCtx; children: ReactNode }) {
  CURRENT = ctx;
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useSd(): SdCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSd outside <App>');
  return c;
}

function ctx(): SdCtx {
  if (!CURRENT) throw new Error('sd runtime used outside <App> (call img()/brand() while rendering)');
  return CURRENT;
}

/** Build-only: what the last render used (assets, brand keys, hrefs, dead-end hashes). */
export function collected() {
  const out = { assets: [...rec.assets], brand: [...rec.brand], hrefs: [...rec.hrefs], dead: Object.fromEntries(rec.dead) };
  rec.assets.clear();
  rec.brand.clear();
  rec.hrefs.clear();
  rec.dead.clear();
  return out;
}

export function img(key: string): string {
  const url = ctx().assets[key];
  if (!url) throw new Error(`unknown image key: ${key} (not in asset-map.json)`);
  rec.assets.add(key);
  return url;
}

export function brand(key: string): string {
  const url = ctx().brand[key];
  if (!url) throw new Error(`unknown brand key: ${key} (not in config.json brand_urls)`);
  rec.brand.add(key);
  return url;
}

const CHROME = /^(hdr|mm|ftr|nav|m|util|sal|mob|tab)-/;

function target(c: SdCtx, href: string, id?: string): { dest: string | null | undefined; explicit: boolean } {
  const L = c.links;
  if (id && Object.prototype.hasOwnProperty.call(L.id, id)) return { dest: L.id[id], explicit: true };
  const pageMap = L.page[c.page] || {};
  if (href in pageMap) return { dest: pageMap[href], explicit: false };
  if (href in L.hash) return { dest: L.hash[href], explicit: false };
  for (const [p, d] of Object.entries(L.prefix)) if (href.startsWith(p)) return { dest: d, explicit: false };
  return { dest: undefined, explicit: false };
}

export function resolveHref(href: string, id?: string): { href: string; current: boolean } {
  if (!href.startsWith('#')) return { href, current: false };
  const c = ctx();
  rec.hrefs.add(href);
  const { dest, explicit } = target(c, href, id);
  if (explicit && dest === null) return { href, current: false }; // null keeps the hash on purpose
  const local = c.ids.includes(href.slice(1));
  if (dest === c.page && local) return { href, current: false };
  let to = dest || null;
  if (to && c.links.mobile.pages.includes(c.page)) to = c.links.mobile.map[to] || to;
  const draft = to ? c.drafts[to] : undefined;
  if (!draft) {
    if (href !== '#' && !local) rec.dead.set(href, (rec.dead.get(href) || 0) + 1);
    return { href, current: false };
  }
  return { href: c.links.base + draft, current: dest === c.page && !!id && CHROME.test(id) };
}

export function useHref(href: string, id?: string): string {
  return resolveHref(href, id).href;
}

/** Navigate from an event handler (forms, buttons). Never during render. */
export function go(url: string) {
  if (typeof window !== 'undefined') window.location.href = url;
}

type AProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'id' | 'target'> & { id: string; href: string };

export function A({ id, href, children, ...rest }: AProps) {
  const r = resolveHref(href, id);
  return (
    <a id={id} href={r.href} aria-current={r.current ? 'page' : rest['aria-current']} {...rest}>
      {children}
    </a>
  );
}

type BlockProps = HTMLAttributes<HTMLElement> & { name: string; labelledBy?: string; label?: string; variant?: string };

export function Block({ name, labelledBy, label, variant, children, ...rest }: BlockProps) {
  return (
    <section data-block={name} aria-labelledby={labelledBy} aria-label={label} data-variant={variant} {...rest}>
      {children}
    </section>
  );
}

export function Ph({ children, as: Tag = 'span', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'span' | 'p' | 'strong' | 'li' }) {
  return (
    <Tag data-placeholder="" {...rest}>
      {children}
    </Tag>
  );
}

/** Join class names, skipping falsy parts. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
