/**
 * Footer: dark band (on-dark: every text, link and icon white), newsletter, link columns, contact
 * facts from content/site.ts, legal line. Never credit the agency here or anywhere in a deliverable.
 * Handoff: the app footer; columns become a CMS menu, facts come from site config.
 */
import { site } from '../content/site';
import { A, brand } from '../lib/sd';

export function Footer() {
  const f = site.footer;
  const facts = site.facts;
  return (
    <footer className="on-dark relative bg-ink-950 text-white">
      <div className="wrap relative pt-20 md:pt-24">
        <div className="grid grid-cols-1 items-center gap-10 border-b border-white/[.12] pb-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="font-display text-[38px] font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[56px]">
              {f.line[0]}
              <br />
              {f.line[1]}
            </p>
          </div>
          <form className="md:col-span-5" aria-labelledby="ftr-news-title" data-form="newsletter" onSubmit={(e) => e.preventDefault()}>
            <p id="ftr-news-title" className="font-display text-[20px] font-semibold">
              {f.newsletter.title}
            </p>
            <p className="mt-1 text-[16px]">{f.newsletter.desc}</p>
            <div className="mt-4 flex gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-white">
              <label htmlFor="ftr-email" className="sr-only">
                Email address
              </label>
              <input id="ftr-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[17px] text-white placeholder:text-white/70 focus:outline-none" />
              <button type="submit" className="btn-primary h-12 px-6">
                Sign up
              </button>
            </div>
          </form>
        </div>
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
          {f.columns.map((col) => (
            <nav key={col.id} aria-labelledby={col.id} className="lg:col-span-3">
              <p id={col.id} className="font-display text-[14px] font-semibold">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3 text-[16px]">
                {col.links.map((l) => (
                  <li key={l.id}>
                    <A id={l.id} href={l.href} className="hover:underline">
                      {l.label}
                    </A>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="lg:col-span-6 lg:pl-8">
            <p className="font-display text-[14px] font-semibold">Visit or call</p>
            <address className="mt-5 not-italic text-[16px] leading-[1.6]" data-placeholder={facts.address.status === 'PLACEHOLDER' ? '' : undefined}>
              {facts.address.value}
            </address>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[16px]">
              <A id="ftr-phone" href={facts.phone.href!} className="font-semibold hover:underline">
                {facts.phone.value}
              </A>
              <A id="ftr-mail" href={facts.email.href!} className="font-semibold hover:underline">
                {facts.email.value}
              </A>
            </p>
            <p className="mt-6 flex gap-5 text-[16px]">
              <A id="ftr-ig" href={facts.instagram.href!} className="underline">
                {facts.instagram.value}
              </A>
              <A id="ftr-fb" href={facts.facebook.href!} className="underline">
                {facts.facebook.value}
              </A>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/[.12] py-8 text-[14px] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={brand('logo-rev')} alt={site.brand} className="h-9 w-auto" />
            <span>© 2026 {site.legal}</span>
          </div>
          <p>
            {f.legalLinks.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ' · '}
                <A id={l.id} href={l.href} className="underline">
                  {l.label}
                </A>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
