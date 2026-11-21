/**
 * site.ts: shared copy and facts for the chrome and every page. Real copy comes from the crawl
 * (research/content-dump.md) and the client. Facts here become the app's site config or CMS
 * "business info"; never retype a phone number or price inside a page. Anything invented has
 * status 'PLACEHOLDER' here and is listed in PLAN.md.
 */
import { Briefcase, CalendarCheck, GraduationCap, MessageCircle, Star, type LucideIcon } from 'lucide-react';

export type NavLink = { id: string; href: string; label: string };
export type Fact = { value: string; status: 'confirmed' | 'PLACEHOLDER'; href?: string };

export const site = {
  brand: 'Brand name',
  legal: 'Legal entity name',
  promise: 'One short promise from CONTENT.md',
  promiseShort: 'a second, shorter one',
  cta: { id: 'hdr-cta', href: '#contact', label: 'Book a visit', icon: CalendarCheck as LucideIcon },
  nav: [
    { id: 'hdr-nav-services', href: '#services', label: 'Services' },
    { id: 'hdr-nav-pricing', href: '#pricing', label: 'Pricing' },
    { id: 'hdr-nav-locations', href: '#locations', label: 'Locations' },
    { id: 'hdr-nav-about', href: '#about', label: 'About' },
  ] as NavLink[],
  utility: [
    { id: 'util-careers', href: '#careers', label: 'Careers' },
    { id: 'util-contact', href: '#contact', label: 'Contact' },
  ] as NavLink[],
  mega: {
    id: 'mega-more',
    label: 'More',
    lead: 'One line that frames this group of pages.',
    sub: 'A short supporting sentence.',
    items: [
      { id: 'mm-one', href: '#page-one', title: 'Page one', desc: 'What the visitor finds there', icon: Star },
      { id: 'mm-two', href: '#page-two', title: 'Page two', desc: 'What the visitor finds there', icon: GraduationCap },
      { id: 'mm-three', href: '#page-three', title: 'Page three', desc: 'What the visitor finds there', icon: Briefcase },
      { id: 'mm-four', href: '#page-four', title: 'Page four', desc: 'What the visitor finds there', icon: MessageCircle },
    ] as Array<{ id: string; href: string; title: string; desc: string; icon: LucideIcon }>,
    feature: { id: 'mm-feature', href: '#contact', title: 'The next step', desc: 'One sentence on what happens', action: 'Get in touch' },
  },
  footer: {
    line: ['The brand line,', 'in two short lines.'],
    newsletter: { title: 'Newsletter, once a month', desc: 'What subscribers get, in one sentence.' },
    columns: [
      {
        id: 'ftr-h1',
        title: 'Explore',
        links: [
          { id: 'ftr-services', href: '#services', label: 'Services' },
          { id: 'ftr-pricing', href: '#pricing', label: 'Pricing' },
          { id: 'ftr-locations', href: '#locations', label: 'Locations' },
        ],
      },
      {
        id: 'ftr-h2',
        title: 'Company',
        links: [
          { id: 'ftr-about', href: '#about', label: 'About' },
          { id: 'ftr-careers', href: '#careers', label: 'Careers' },
          { id: 'ftr-faq', href: '#faq', label: 'FAQs' },
          { id: 'ftr-contact', href: '#contact', label: 'Contact' },
        ],
      },
    ] as Array<{ id: string; title: string; links: NavLink[] }>,
    legalLinks: [
      { id: 'ftr-privacy', href: '#legal', label: 'Privacy' },
      { id: 'ftr-terms', href: '#legal', label: 'Terms' },
      { id: 'ftr-a11y', href: '#legal', label: 'Accessibility' },
    ] as NavLink[],
  },
  facts: {
    address: { value: 'Street address, Town, postcode', status: 'PLACEHOLDER' } as Fact,
    phone: { value: '000-000-0000', href: 'tel:+10000000000', status: 'PLACEHOLDER' } as Fact,
    email: { value: 'hello@example.com', href: 'mailto:hello@example.com', status: 'PLACEHOLDER' } as Fact,
    instagram: { value: 'Instagram', href: 'https://www.instagram.com/', status: 'PLACEHOLDER' } as Fact,
    facebook: { value: 'Facebook', href: 'https://www.facebook.com/', status: 'PLACEHOLDER' } as Fact,
  },
};
