/**
 * 00-design-system: the board, built from tokens.json and the same components as the pages, so it can
 * never drift. It is a reference page (config "reference_pages"): the handoff checks and the block
 * inventory skip it. Add the brand devices (each in its resting state) and the project's components.
 */
import { ArrowRight } from 'lucide-react';
import { Layout } from '../components/Layout';
import tokens from '../tokens.json';
import { A, Block } from '../lib/sd';

export const meta = { title: 'Design system | Brand name', route: null };

type Role = { font?: string; weight?: number; size: number[]; lh: number; track?: string };

const swatches = Object.entries(tokens.colors as Record<string, string | Record<string, string>>)
  .filter(([k]) => !k.startsWith('_'))
  .flatMap(([name, v]) => (typeof v === 'string' ? [[name, v]] : Object.entries(v).map(([step, hex]) => [step === 'DEFAULT' ? name : `${name}-${step}`, hex])));

export default function DesignSystem() {
  const roles = Object.entries(tokens.type as Record<string, Role>);
  return (
    <Layout>
      <Block name="board-cover" labelledBy="p00-title" className="bg-paper py-24">
        <div className="wrap">
          <h1 id="p00-title" className="display-xl">
            Design system
          </h1>
          <p className="lead mt-6 max-w-[46ch]">Tokens, type, components and motion for every draft. Built from tokens.json and the shared components.</p>
        </div>
      </Block>
      <Block name="board-color" labelledBy="p00-color" className="bg-white py-20">
        <div className="wrap">
          <h2 id="p00-color" className="h2">
            Color
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6" role="list">
            {swatches.map(([name, hex]) => (
              <li key={name} className="card overflow-hidden">
                <span className="block h-20 border-b border-line" style={{ background: hex }} aria-hidden="true" />
                <span className="block px-4 py-3 text-[14px]">
                  <span className="block font-display font-semibold text-ink-900">{name}</span>
                  <span className="tabular block text-ink-500">{hex}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Block>
      <Block name="board-type" labelledBy="p00-type" className="bg-paper py-20">
        <div className="wrap">
          <h2 id="p00-type" className="h2">
            Typography
          </h2>
          <ul className="mt-10 space-y-8" role="list">
            {roles
              .filter(([n]) => n !== 'body' && n !== 'h1')
              .map(([name, r]) => (
                <li key={name} className="grid grid-cols-1 items-baseline gap-4 md:grid-cols-12">
                  <span className="text-[14px] text-ink-500 md:col-span-3">
                    <span className="block font-display font-semibold text-ink-900">.{name}</span>
                    {r.size.join(' / ')}px · {r.weight || 400} · {r.lh}
                    {r.track ? ' · ' + r.track : ''}
                  </span>
                  <span className={`${name} md:col-span-9`}>Bathed in clear type</span>
                </li>
              ))}
          </ul>
        </div>
      </Block>
      <Block name="board-components" labelledBy="p00-comp" className="bg-white py-20">
        <div className="wrap">
          <h2 id="p00-comp" className="h2">
            Components
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <A id="p00-btn-primary" href="#contact" className="btn-primary">
              <span className="inline-flex items-center gap-2.5">
                Primary <ArrowRight size={18} aria-hidden="true" data-nudge />
              </span>
            </A>
            <A id="p00-btn-outline" href="#contact" className="btn-outline">
              Outline
            </A>
            <A id="p00-btn-light" href="#contact" className="btn-light">
              Light
            </A>
            <span className="chip bg-brand-50 text-brand-700">Chip</span>
            <A id="p00-link" href="#contact" className="link">
              Text link
            </A>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="p00-field" className="label">
                Field label
              </label>
              <input id="p00-field" className="field" placeholder="Placeholder text" />
              <span className="hint">A hint under the field.</span>
            </div>
            <div className="on-dark flex flex-wrap items-center gap-3 rounded-card bg-ink-950 p-8 text-white">
              <A id="p00-btn-ghost" href="#contact" className="btn-ghost-dark">
                Ghost on dark
              </A>
              <A id="p00-dark-link" href="#contact" className="link">
                Link on dark
              </A>
            </div>
          </div>
        </div>
      </Block>
    </Layout>
  );
}
