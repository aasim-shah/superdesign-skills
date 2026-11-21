/**
 * 01-home: the landing page, built on cutouts. Rounded night panels sit inside the paper page; the
 * real app (uploaded screenshots in a phone frame) and five shaded objects break out of their panel
 * and card edges; glass callouts with leader lines point at real parts of the UI.
 * Journey: Get (home → the five challenges → early access).
 *
 * Motion (motion/signature.ts, Lenis smooth scroll): the phone rises out of the panel and tilts with
 * the pointer; leader lines draw and callouts slide in; objects drift; challenge objects lift on
 * hover and pop in on scroll; the journey phone turns as you scroll; the lens closes.
 * Canvas frames (innerHeight > 1600) are static: everything rests in its finished place.
 */
import { ArrowRight, BellRing, Eye, QrCode, ShieldCheck, Volume2 } from 'lucide-react';
import { Lens } from '../components/Art';
import { Layout } from '../components/Layout';
import { Callout, Phone, Thing } from '../components/Product';
import { challenges, early, hero, journey, privacy, strict } from '../content/home';
import { A, Block, img } from '../lib/sd';

export const meta = { title: 'WalkAway: the alarm that gets you out of bed', route: '/' };

const ALT = {
  ringing: 'WalkAway ringing at 6:30: to stop this alarm, go to the bathroom and scan the QR code',
  alarms: 'WalkAway alarm list: Morning Routine at 6:30 with a bathroom QR code, Gym Session at 7:15 with a gym bag NFC tag',
  strict: 'WalkAway Strict Mode rules: hide emergency stop, block snooze bypass, escalating volume, wake-up confirmation',
};

/** Leader lines in the hero's 640 x 880 stage: from a dot on the phone to a callout's edge. */
const LEADS = [
  { d: 'M224 292 C 300 292, 330 266, 420 266', dot: [224, 292] },
  { d: 'M300 470 C 350 470, 370 448, 420 448', dot: [300, 470] },
  { d: 'M300 598 C 350 598, 370 626, 420 626', dot: [300, 598] },
];

export default function Home() {
  return (
    <Layout>
      {/* 1 · Hero panel: the phone breaks out of the night, callouts point at the real UI */}
      <Block name="hero" labelledBy="p01-title" className="relative px-3 pt-2 md:px-5" data-sig="hero">
        <div className="on-night relative rounded-panel bg-night-900 text-white md:h-[760px]">
          <div className="wrap relative grid grid-cols-1 md:h-full md:grid-cols-12">
            <div className="pb-10 pt-16 md:col-span-5 md:self-center md:pb-0 md:pt-0">
              <p className="text-[15px] text-stone-300">{hero.kicker}</p>
              <h1 id="p01-title" className="mt-5 font-display text-[60px] font-light leading-[0.95] tracking-[-0.04em] text-white md:text-[96px]">
                {hero.title[0]}
                <br />
                {hero.title[1]}
              </h1>
              <p className="mt-8 max-w-[38ch] text-[17px] leading-[1.6] text-stone-300 md:text-[18px]">{hero.lead}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <A id="p01-hero-cta" href="#early-access" className="btn-primary btn-lg">
                  Get early access
                </A>
                <A id="p01-hero-more" href="#challenges" className="inline-flex min-h-11 items-center gap-2 text-[16px] font-semibold text-white hover:underline hover:underline-offset-4">
                  Five ways to wake <ArrowRight size={17} aria-hidden="true" />
                </A>
              </div>
              <p className="mt-10 text-[14px] text-stone-300">{hero.trust}</p>
            </div>
          </div>

          {/* the stage: phone, callouts and objects, wider than the panel on purpose */}
          <div className="pointer-events-none absolute -top-[30px] right-[5%] hidden h-[880px] w-[640px] lg:block" data-sig-stage>
            <div className="halo absolute left-[-80px] top-[120px] h-[620px] w-[620px]" data-sig-halo />
            <Thing id="qr" className="absolute -left-[150px] top-[40px] w-[150px] rotate-[-8deg] opacity-90 blur-[1.5px]" />
            <Thing id="nfc" className="absolute -left-[40px] top-[660px] w-[150px]" />
            <Thing id="qr" className="absolute left-[470px] top-[-24px] w-[170px] rotate-[14deg]" />
            <div className="pointer-events-auto absolute left-[40px] top-[30px]">
              <Phone src={img('screen-ringing')} alt={ALT.ringing} width={360} rim />
            </div>
            <svg viewBox="0 0 640 880" className="absolute inset-0 h-full w-full" aria-hidden="true" data-leads>
              {LEADS.map((l, i) => (
                <g key={i}>
                  <path data-lead d={l.d} className="fill-none stroke-white/60" strokeWidth="1.25" />
                  <circle cx={l.dot[0]} cy={l.dot[1]} r="11" className="fill-accent-500/30" data-dot />
                  <circle cx={l.dot[0]} cy={l.dot[1]} r="5.5" className="fill-accent-600 stroke-white" strokeWidth="2" />
                </g>
              ))}
            </svg>
            <Callout icon={BellRing} title="6:30, full screen" sub="No tiny mystery controls" className="absolute left-[420px] top-[236px] w-[262px]" />
            <Callout icon={QrCode} title="Only a live scan stops it" sub="Bathroom QR code" className="absolute left-[420px] top-[418px] w-[262px]" />
            <Callout icon={ShieldCheck} title="Emergency stop, hidden" sub="Strict Mode keeps it away" className="absolute left-[420px] top-[596px] w-[262px]" />
          </div>

          {/* phones and tablets: the phone sits below the copy, still breaking the panel edge */}
          <div className="relative flex justify-center pb-0 lg:hidden">
            <Thing id="qr" className="absolute right-[6%] top-[-10px] w-[110px] rotate-[14deg]" />
            <div className="relative -mb-16">
              <Phone src={img('screen-ringing')} alt={ALT.ringing} width={280} />
            </div>
          </div>
        </div>
      </Block>

      {/* 2 · Five ways: cards whose objects pop out over the top edge */}
      <Block name="challenges" labelledBy="p01-challenges" className="pb-28 pt-36 md:pb-40 md:pt-48">
        <div className="wrap">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 id="p01-challenges" className="max-w-[14ch] font-display text-[40px] font-light leading-[1.02] tracking-[-0.03em] text-ink-900 md:text-[64px]">
              Five ways to prove you are awake.
            </h2>
            <p className="max-w-[36ch] text-[17px] leading-[1.6] text-ink-700">Every challenge is tied to a real action WalkAway can verify. Pick the one that fits your morning.</p>
          </div>
          <ol className="mt-28 grid grid-cols-1 gap-x-4 gap-y-24 sm:grid-cols-2 md:mt-36 lg:grid-cols-5" role="list" data-sig="cards">
            {challenges.map((c, i) => (
              <li key={c.id} data-card className={`group relative rounded-[28px] px-6 pb-7 pt-24 transition-colors duration-500 ${i === 0 ? 'bg-accent-100' : 'bg-white'}`}>
                <Thing id={c.id as 'qr'} className="absolute -top-[72px] left-3 w-[150px] transition-transform duration-700 ease-out group-hover:-translate-y-3 group-hover:rotate-[-4deg]" />
                <p className="tabular text-[13px] text-ink-500">{c.n}</p>
                <h3 className="mt-2 font-display text-[30px] font-light leading-[1.05] tracking-[-0.02em] text-ink-900">{c.label}</h3>
                <p className="mt-1 text-[14px] font-semibold text-ink-900">{c.verb}</p>
                <p className="mt-4 text-[15px] leading-[1.55] text-ink-700">{c.title}</p>
                <p className="mt-6 text-[13px] text-ink-500">
                  {c.target} · <span className="text-ink-900">{c.proof}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Block>

      {/* 3 · Journey panel: the alarm list phone leans out of a stone panel */}
      <Block name="journey" labelledBy="p01-journey" className="px-3 md:px-5" data-sig="journey">
        <div className="relative rounded-panel bg-stone-100 md:h-[720px]">
          <div className="wrap grid grid-cols-1 gap-10 py-16 md:h-full md:grid-cols-12 md:py-0">
            <div className="relative hidden md:col-span-5 md:block">
              <div className="absolute -top-[90px] left-[20px] rotate-[-7deg]" data-sig-lean>
                <Phone src={img('screen-alarms')} alt={ALT.alarms} width={330} />
              </div>
              <Thing id="nfc" className="absolute left-[300px] top-[520px] w-[140px]" />
            </div>
            <div className="md:col-span-6 md:col-start-7 md:self-center">
              <h2 id="p01-journey" className="max-w-[16ch] font-display text-[38px] font-light leading-[1.04] tracking-[-0.03em] text-ink-900 md:text-[56px]">
                {journey.title}
              </h2>
              <ol className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10" role="list">
                {journey.steps.map((s) => (
                  <li key={s.time} data-step>
                    <p className="tabular font-display text-[40px] font-light leading-none tracking-[-0.03em] text-ink-900">{s.time}</p>
                    <p className="mt-3 text-[16px] font-semibold text-ink-900">{s.title}</p>
                    <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-700">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Block>

      {/* 4 · Strict Mode panel: the rules screen breaks out of the bottom edge */}
      <Block name="strict" labelledBy="p01-strict" className="px-3 pt-6 md:px-5" data-sig="strict">
        <div className="on-night relative rounded-panel bg-night-900 text-white md:h-[680px]">
          <div className="wrap grid grid-cols-1 gap-10 pb-0 pt-16 md:h-full md:grid-cols-12 md:pt-0">
            <div className="md:col-span-5 md:self-center">
              <h2 id="p01-strict" className="max-w-[12ch] font-display text-[40px] font-light leading-[1.02] tracking-[-0.03em] md:text-[64px]">
                {strict.title}
              </h2>
              <p className="mt-6 max-w-[38ch] text-[17px] leading-[1.6] text-stone-300">{strict.lead}</p>
              <ul className="mt-8 space-y-2 text-[15px] text-stone-300" role="list">
                {strict.readiness.items.map((r) => (
                  <li key={r.label}>
                    {r.label} · <span className="text-white">{r.state}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden md:col-span-6 md:col-start-7 md:block">
              <div className="absolute left-0 top-[110px]" data-sig-rise>
                <Phone src={img('screen-strict')} alt={ALT.strict} width={310} />
              </div>
              <svg viewBox="0 0 640 680" className="pointer-events-none absolute left-0 top-0 h-[680px] w-[640px]" aria-hidden="true" data-leads>
                {[
                  'M262 350 C 310 350, 320 350, 360 350',
                  'M262 457 C 310 457, 320 470, 360 470',
                ].map((d, i) => (
                  <g key={d}>
                    <path data-lead d={d} className="fill-none stroke-white/60" strokeWidth="1.25" />
                    <circle cx="262" cy={i ? 457 : 350} r="11" className="fill-accent-500/30" data-dot />
                    <circle cx="262" cy={i ? 457 : 350} r="5.5" className="fill-accent-600 stroke-white" strokeWidth="2" />
                  </g>
                ))}
              </svg>
              <Callout icon={Eye} title="Hide emergency stop" sub="No escape hatch while ringing" className="absolute left-[360px] top-[322px] w-[262px]" />
              <Callout icon={Volume2} title="Escalating volume" sub="Soft first, then certain" className="absolute left-[360px] top-[442px] w-[240px]" />
            </div>
          </div>
          <div className="relative flex justify-center md:hidden">
            <div className="relative -mb-16">
              <Phone src={img('screen-strict')} alt={ALT.strict} width={280} />
            </div>
          </div>
        </div>
      </Block>

      {/* 5 · Privacy: quiet, on paper */}
      <Block name="privacy" labelledBy="p01-privacy" className="py-36 md:py-48">
        <div className="wrap text-center">
          <Lens className="mx-auto h-24 w-24 md:h-28 md:w-28" />
          <h2 id="p01-privacy" className="mx-auto mt-14 max-w-[18ch] font-display text-[38px] font-light leading-[1.08] tracking-[-0.03em] text-ink-900 md:text-[64px]">
            {privacy.title}
          </h2>
          <p className="mx-auto mt-8 max-w-[52ch] text-[17px] leading-[1.65] text-ink-700">{privacy.lead}</p>
          <ul className="mx-auto mt-10 flex max-w-[60ch] flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-ink-500" role="list">
            {privacy.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <A id="p01-privacy-link" href="#privacy" className="link mt-8 inline-flex min-h-11 items-center gap-2">
            {privacy.link} <ArrowRight size={16} aria-hidden="true" />
          </A>
        </div>
      </Block>

      {/* 6 · Early access panel: objects spill over its top edge */}
      <Block name="early-access" labelledBy="p01-early" className="px-3 md:px-5" data-sig="early">
        <div className="on-night relative rounded-panel bg-night-900 px-6 pb-14 pt-24 text-white md:px-16 md:pb-20 md:pt-28">
          <Thing id="object" className="absolute -top-[86px] right-[8%] w-[150px] md:w-[180px]" />
          <Thing id="voice" className="absolute -top-[70px] right-[24%] hidden w-[120px] rotate-[8deg] md:block" />
          <div className="mx-auto max-w-[960px]">
            <h2 id="p01-early" className="max-w-[16ch] font-display text-[44px] font-light leading-[1] tracking-[-0.035em] md:text-[80px]">
              {early.title}
            </h2>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-stone-300">{early.lead}</p>
            <form className="mt-12" aria-labelledby="p01-early" data-form="early-access" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                {[
                  { id: 'p01-name', name: 'fullName', label: 'Full name', ph: 'Your name', auto: 'name', type: 'text' },
                  { id: 'p01-email', name: 'email', label: 'Email', ph: 'you@example.com', auto: 'email', type: 'email' },
                  { id: 'p01-device', name: 'deviceModel', label: 'Phone model', ph: 'iPhone 17 Pro', auto: 'off', type: 'text' },
                ].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="block text-[14px] text-stone-300">
                      {f.label}
                    </label>
                    <input id={f.id} name={f.name} type={f.type} autoComplete={f.auto} required className="field-line h-12 w-full text-[18px] placeholder:text-white/35" placeholder={f.ph} />
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <label className="flex max-w-[56ch] cursor-pointer items-start gap-3 text-[13px] leading-[1.55] text-stone-300">
                  <input type="checkbox" name="consent" value="yes" required className="mt-0.5 h-6 w-6 shrink-0 accent-accent-600" />
                  <span>{early.consent}</span>
                </label>
                <button type="submit" className="btn-primary btn-lg shrink-0">
                  Join early access
                </button>
              </div>
            </form>
          </div>
        </div>
      </Block>
    </Layout>
  );
}
