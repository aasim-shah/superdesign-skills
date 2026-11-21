/**
 * Sketch: hand-drawn line pieces for a visual metaphor (references/inspiration.md section 10).
 *   Scribble · a tangled ball of loops (chaos, worry, noise), seeded so server and client draw the same
 *   Hatch    · a calm shape filled with parallel lines (order, focus, a solved problem)
 *   Thread   · a loose line with a loop or two that joins two points (the path between them)
 * Compose them in one SVG: <svg viewBox="0 0 800 400" data-sig-draw> … </svg>. All strokes use
 * currentColor, so a text color class sets the ink. Decorative: give the SVG aria-hidden="true".
 * With [data-sig-draw] on the SVG, motion/product.ts draws every path in document order when it
 * scrolls into view ([data-sig-draw="scrub"] ties the drawing to the scroll). Never Math.random()
 * here: render must be deterministic, so the seed decides every loop.
 */

/** small deterministic PRNG (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

export function Scribble({ cx, cy, r, loops = 26, seed = 7, width = 1.6 }: { cx: number; cy: number; r: number; loops?: number; seed?: number; width?: number }) {
  const rand = rng(seed);
  let d = `M${f(cx)} ${f(cy)}`;
  for (let i = 0; i < loops; i++) {
    const a = rand() * Math.PI * 2;
    const rr = r * (0.35 + rand() * 0.65);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.9;
    const c1 = cx + (rand() - 0.5) * r * 2.2;
    const c2 = cy + (rand() - 0.5) * r * 2.2;
    d += ` Q${f(c1)} ${f(c2)} ${f(x)} ${f(y)}`;
  }
  return <path d={d} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}

export function Hatch({ cx, cy, r, gap = 9, angle = -40, width = 1.6, id }: { cx: number; cy: number; r: number; gap?: number; angle?: number; width?: number; id: string }) {
  const lines: string[] = [];
  for (let o = -r; o <= r; o += gap) {
    const half = Math.sqrt(Math.max(r * r - o * o, 0));
    if (half < 2) continue;
    lines.push(`M${f(cx - half)} ${f(cy + o)} H${f(cx + half)}`);
  }
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      {lines.map((d, i) => (
        <path key={`${id}-${i}`} d={d} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" />
      ))}
    </g>
  );
}

/** a loose thread from (x1,y1) to (x2,y2) with `loops` small loops along the way */
export function Thread({ x1, y1, x2, y2, loops = 2, width = 1.6 }: { x1: number; y1: number; x2: number; y2: number; loops?: number; width?: number }) {
  const dx = (x2 - x1) / (loops + 1);
  let d = `M${f(x1)} ${f(y1)}`;
  let x = x1;
  let y = y1;
  for (let i = 1; i <= loops; i++) {
    const nx = x1 + dx * i;
    const ny = y1 + (y2 - y1) * (i / (loops + 1)) + (i % 2 ? 40 : 60);
    d += ` C${f(x + dx * 0.6)} ${f(y + 10)}, ${f(nx + 30)} ${f(ny - 50)}, ${f(nx)} ${f(ny)} c-22 10 -16 -36 8 -20`;
    x = nx;
    y = ny;
  }
  d += ` C${f(x + dx * 0.5)} ${f(y + 20)}, ${f(x2 - dx * 0.4)} ${f(y2 + 10)}, ${f(x2)} ${f(y2)}`;
  return <path d={d} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}
