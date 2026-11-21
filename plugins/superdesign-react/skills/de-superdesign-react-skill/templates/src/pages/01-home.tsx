/**
 * 01-home: the anchor page. The main session writes it first and iterates until it is the quality bar.
 * Handoff contract, page level (references/handoff-contract.md):
 *   every child of <main> is one <Block name> = one future app component, named for the content and
 *   reused across pages for the same kind; labelledBy points at its heading id (or label= when it has
 *   no visible heading); repeated items come from an array (.map) with data-repeater on the list;
 *   behavior only through components and data-* hooks; tokens only (no hex); invented copy in <Ph>.
 *   Page ids start with pNN-. One H1, in the first block. No window/document during render.
 */
import { ArrowRight, CalendarCheck, Heart, Phone, Scissors, Sparkles, Star } from 'lucide-react';
import { Fragment } from 'react';
import { Layout, useFinder } from '../components/Layout';
import { site } from '../content/site';
import { A, Block, img, Ph, cx } from '../lib/sd';
import { useFilter } from '../lib/useFilter';

export const meta = {
  title: 'Brand name | The promise in a few words',
  route: '/',
};

const services = [
  { id: 'p01-svc-one', title: 'Service one', text: 'What it is and who it is for, in one or two sentences.', icon: Sparkles, tags: 'care' },
  { id: 'p01-svc-two', title: 'Service two', text: 'What it is and who it is for, in one or two sentences.', icon: Scissors, tags: 'style' },
  { id: 'p01-svc-three', title: 'Service three', text: 'Invented copy is wrapped in Ph and listed in the track report.', icon: Heart, tags: 'care', placeholder: true },
];

const steps = [
  { title: 'Find your place', text: 'One sentence on the first step.' },
  { title: 'Book online', text: 'One sentence on the second step.' },
  { title: 'Come back any time', text: 'One sentence on the third step.' },
];

// Real reviews only, reviewer as first name + last initial (personal data: flag it in the report)
const reviews = [
  { quote: 'A real review, quoted exactly from the client’s Google profile.', by: 'Sam R.' },
  { quote: 'A second real review, trimmed only at sentence ends.', by: 'Alex T.' },
  { quote: 'A third real review, with permission to quote.', by: 'Jo M.' },
];

const ticker = ['First thing', 'Second thing', 'Third thing'];

function Hero() {
  const finder = useFinder();
  return (
    <Block name="hero" labelledBy="p01-title" className="relative overflow-hidden bg-paper">
      <div className="wrap relative grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <h1 id="p01-title" className="display-xl">
            The promise,
            <br />
            said plainly.
          </h1>
          <p className="lead mt-8 max-w-[36ch]">One or two sentences from the content file that say what the business does, where, and why it is the easy choice.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <A id="p01-hero-cta" href="#contact" className="btn-primary">
              <span className="inline-flex items-center gap-2.5">
                <CalendarCheck size={20} aria-hidden="true" />
                Book a visit
              </span>
            </A>
            <A id="p01-hero-more" href="#services" className="btn-outline">
              See services
            </A>
          </div>
          <form
            role="search"
            data-finder
            className="mt-9 flex max-w-[500px] items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-5 shadow-md"
            onSubmit={(e) => {
              e.preventDefault();
              finder.open(new FormData(e.currentTarget).get('q') as string);
            }}
          >
            <label htmlFor="p01-q" className="sr-only">
              Search by town or postcode
            </label>
            <input id="p01-q" name="q" type="search" placeholder="Town or postcode" className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-ink-800 placeholder:text-ink-500 focus:outline-none" />
            <button type="submit" aria-label="Search" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="relative lg:col-span-5">
          <img src={img('hero')} alt="Describe what the photo shows, in context" className="aspect-[4/5] w-full rounded-panel object-cover shadow-lg" data-sig="rise" />
          <span className="sticker absolute -left-4 top-8 inline-flex rotate-[-6deg] rounded-full border-4 border-white bg-accent-400 px-4 py-2 font-display text-[15px] font-bold text-ink-950 shadow-md">A short proof point</span>
        </div>
      </div>
    </Block>
  );
}

function Ticker() {
  // a looping strip (Pause animation stops it); the list is said once for screen readers
  const row = [...ticker, ...ticker];
  return (
    <Block name="ticker" label="What every visit includes" className="on-dark relative overflow-hidden bg-ink-900 py-5 text-white">
      <div className="marquee flex w-max items-center gap-8 whitespace-nowrap font-display text-[20px] font-semibold" aria-hidden="true">
        {row.map((t, i) => (
          <Fragment key={i}>
            <span>{t}</span>
            <Star size={18} fill="currentColor" />
          </Fragment>
        ))}
      </div>
      <p className="sr-only">Every visit includes {ticker.join(', ').toLowerCase()}.</p>
    </Block>
  );
}

function ServiceCards() {
  const f = useFilter('all');
  const tags = [
    ['all', 'All'],
    ['care', 'Care'],
    ['style', 'Style'],
  ];
  const shown = services.filter((s) => f.shows(s.tags)).length;
  return (
    <Block name="service-cards" labelledBy="p01-svc-title" className="relative bg-white py-24 md:py-28">
      <div className="wrap">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 id="p01-svc-title" className="h2">
            What we do, in three cards.
          </h2>
          <p className="lead mt-5">One sentence that frames the cards.</p>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter services">
          {tags.map(([v, label]) => (
            <button key={v} type="button" data-filter={v} aria-pressed={f.value === v} onClick={() => f.choose(v)} className={cx('chip h-11 border border-line px-5', f.value === v ? 'bg-ink-900 text-white' : 'bg-white text-ink-900 hover:bg-brand-50')}>
              {label}
            </button>
          ))}
          <span className="ml-2 text-[15px] text-ink-500" aria-live="polite">
            {shown} {shown === 1 ? 'service' : 'services'}
          </span>
        </div>
        <ul ref={f.listRef} className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3" role="list" data-repeater="cards">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.id} data-tags={s.tags} hidden={!f.shows(s.tags)}>
                <article className="card flex h-full flex-col p-8">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icon size={26} aria-hidden="true" />
                  </span>
                  <h3 className="h3 mt-6">{s.title}</h3>
                  {s.placeholder ? (
                    <Ph as="p" className="mt-3">
                      {s.text}
                    </Ph>
                  ) : (
                    <p className="mt-3">{s.text}</p>
                  )}
                  <A id={s.id} href="#services" className="link mt-auto pt-6">
                    About {s.title.toLowerCase()}
                  </A>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </Block>
  );
}

function Steps() {
  return (
    <Block name="steps" labelledBy="p01-steps-title" className="relative bg-paper py-24 md:py-28">
      <div className="wrap">
        <h2 id="p01-steps-title" className="h2 max-w-[18ch]">
          From first visit to regular care, in three steps.
        </h2>
        <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3" data-repeater="steps" data-sig-trail>
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className={cx('flex h-16 w-16 items-center justify-center rounded-full font-display text-[24px] font-extrabold text-white', i === 0 ? 'bg-brand-600' : 'bg-ink-900')}>{i + 1}</span>
              <h3 className="h3 mt-6">{s.title}</h3>
              <p className="mt-3 max-w-[30ch]">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Block>
  );
}

function Reviews() {
  return (
    <Block name="reviews" labelledBy="p01-rev-title" className="relative bg-white py-24 md:py-28">
      <div className="wrap">
        <h2 id="p01-rev-title" className="h2">
          What customers say.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" data-repeater="reviews">
          {reviews.map((r) => (
            <figure key={r.by} className="card p-7">
              <blockquote className="text-[17px]">“{r.quote}”</blockquote>
              <figcaption className="mt-5 font-display font-semibold text-ink-900">{r.by} · Google review</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-10 text-[17px]">
          Customers rated us{' '}
          <Ph as="strong" className="tabular font-display font-extrabold text-ink-950">
            <span data-count>4.9</span> out of 5
          </Ph>{' '}
          across{' '}
          <Ph as="strong" className="tabular">
            <span data-count>1,200</span>
          </Ph>{' '}
          reviews.
        </p>
      </div>
    </Block>
  );
}

function CtaBand() {
  // dark band: every text and icon white; overflow-x-clip (not overflow-hidden) so edge devices still show
  return (
    <Block name="cta-band" labelledBy="p01-cta-title" className="on-dark relative overflow-x-clip bg-ink-950 py-24 text-white">
      <div className="wrap grid grid-cols-1 items-center gap-8 md:grid-cols-12">
        <h2 id="p01-cta-title" className="h2 md:col-span-7">
          Ready when you are.
        </h2>
        <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
          <A id="p01-cta-book" href="#contact" className="btn-light">
            Book a visit
          </A>
          <A id="p01-cta-call" href={site.facts.phone.href!} className="btn-ghost-dark">
            <span className="inline-flex items-center gap-2">
              <Phone size={18} aria-hidden="true" />
              Call us
            </span>
          </A>
        </div>
      </div>
    </Block>
  );
}

export default function Home() {
  return (
    <Layout>
      <Hero />
      <Ticker />
      <ServiceCards />
      <Steps />
      <Reviews />
      <CtaBand />
    </Layout>
  );
}
