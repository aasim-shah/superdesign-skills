/**
 * Header: sticky header, main nav, one mega menu (disclosure pattern), finder button, the one primary
 * CTA and the menu link for phones. Every link keeps a unique hdr-/mm- id so the current page gets
 * aria-current. Handoff: the app header component; the mega menu data becomes a CMS menu or config.
 */
import { Menu, Search } from 'lucide-react';
import { site } from '../content/site';
import { A, brand } from '../lib/sd';
import { useFinder } from './Layout';
import { MegaMenu } from './MegaMenu';

export function Header() {
  const finder = useFinder();
  const CtaIcon = site.cta.icon;
  return (
    <header data-header className="sticky top-0 z-50 border-b border-line/70 bg-white/[.92] backdrop-blur-xl">
      <div className="wrap relative flex h-[72px] items-center justify-between gap-3 sm:h-20 sm:gap-6">
        <A id="hdr-logo" href="#home" className="shrink-0" aria-label={`${site.brand} home`}>
          <img src={brand('logo')} alt={site.brand} className="h-[38px] w-auto sm:h-[46px]" />
        </A>
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {site.nav.map((n) => (
            <A key={n.id} id={n.id} href={n.href} className="nav-btn">
              {n.label}
            </A>
          ))}
          <MegaMenu group={site.mega} />
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-search
            onClick={() => finder.open()}
            aria-label="Search the site"
            className="hidden h-12 items-center rounded-full border border-line bg-white pl-4 pr-2 text-[15px] text-ink-500 transition-colors hover:border-brand-500 md:inline-flex"
          >
            <span className="inline-flex items-center gap-2">
              <Search size={18} className="text-brand-600" aria-hidden="true" />
              <span className="font-display font-medium text-ink-900">Search</span>
              <kbd className="kbd ml-1 text-ink-500">/</kbd>
            </span>
          </button>
          <A id={site.cta.id} href={site.cta.href} className="btn-primary h-11 px-4 text-[14px] sm:h-12 sm:px-6 sm:text-[15px]">
            <span className="inline-flex items-center gap-2">
              <CtaIcon size={18} className="hidden sm:inline-block" aria-hidden="true" />
              {site.cta.label}
            </span>
          </A>
          <A id="hdr-menu" href="#menu" aria-label="Open menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-900 sm:h-12 sm:w-12 lg:hidden">
            <Menu size={22} aria-hidden="true" />
          </A>
        </div>
      </div>
    </header>
  );
}
