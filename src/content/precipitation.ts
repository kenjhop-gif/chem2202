// Mixing two ionic solutions: products, precipitates (from the class solubility table),
// and the non-ionic / total ionic / net ionic equations.
import { AMMONIUM, FIXED_CATIONS, MONATOMIC_ANIONS, MULTIVALENT_CATIONS, POLYATOMIC_ANIONS, ionText, ionic, type Ion, type IonicCompound } from './ions';
import { isSoluble } from './solubility';
import { solveBalance } from '../engine/balance';
import type { Rng } from '../engine/rng';

const by = (list: Ion[], formula: string) => list.find((i) => i.formula === formula)!;

export const MIX_CATIONS: Ion[] = [
  by(FIXED_CATIONS, 'Na'),
  by(FIXED_CATIONS, 'K'),
  AMMONIUM,
  by(FIXED_CATIONS, 'Ag'),
  MULTIVALENT_CATIONS[4], // Pb2+
  by(FIXED_CATIONS, 'Ba'),
  by(FIXED_CATIONS, 'Ca'),
  by(FIXED_CATIONS, 'Mg'),
  MULTIVALENT_CATIONS[3], // Cu2+
  MULTIVALENT_CATIONS[1], // Fe3+
  by(FIXED_CATIONS, 'Zn'),
];

export const MIX_ANIONS: Ion[] = [
  by(POLYATOMIC_ANIONS, 'NO3'),
  by(MONATOMIC_ANIONS, 'Cl'),
  by(MONATOMIC_ANIONS, 'Br'),
  by(MONATOMIC_ANIONS, 'I'),
  by(POLYATOMIC_ANIONS, 'SO4'),
  by(POLYATOMIC_ANIONS, 'CO3'),
  by(POLYATOMIC_ANIONS, 'PO4'),
  by(POLYATOMIC_ANIONS, 'OH'),
  by(MONATOMIC_ANIONS, 'S'),
];

export interface Mix {
  r1: IonicCompound;
  r2: IonicCompound;
  p1: IonicCompound; // cation of r1 + anion of r2
  p2: IonicCompound; // cation of r2 + anion of r1
  /** The low-solubility product, if any. */
  precipitate: IonicCompound | null;
  coefficients: number[]; // r1, r2, p1, p2
}

/** Two high-solubility solutions mixed. `wantPrecipitate`: true = exactly one, false = none, undefined = either. */
export function mixSolutions(rng: Rng, wantPrecipitate?: boolean): Mix {
  for (let tries = 0; tries < 500; tries++) {
    const [c1, c2] = rng.shuffle(MIX_CATIONS).slice(0, 2);
    const [a1, a2] = rng.shuffle(MIX_ANIONS).slice(0, 2);
    if (!isSoluble(c1, a1) || !isSoluble(c2, a2)) continue;
    const r1 = ionic(c1, a1);
    const r2 = ionic(c2, a2);
    const p1 = ionic(c1, a2);
    const p2 = ionic(c2, a1);
    const s1 = isSoluble(c1, a2);
    const s2 = isSoluble(c2, a1);
    if (!s1 && !s2) continue; // skip double precipitates
    const precipitate = !s1 ? p1 : !s2 ? p2 : null;
    if (wantPrecipitate === true && !precipitate) continue;
    if (wantPrecipitate === false && precipitate) continue;
    const coefficients = solveBalance([r1.formula, r2.formula], [p1.formula, p2.formula]);
    if (!coefficients) continue;
    return { r1, r2, p1, p2, precipitate, coefficients };
  }
  throw new Error('No mix found');
}

const co = (n: number) => (n === 1 ? '' : `${n} `);
const state = (c: IonicCompound) => (isSoluble(c.cation, c.anion) ? '(aq)' : '(s)');

/** Molecular (non-ionic) equation with states. */
export function nonIonic(m: Mix): string {
  const [a, b, c, d] = m.coefficients;
  return `${co(a)}[[${m.r1.formula}]]${state(m.r1)} + ${co(b)}[[${m.r2.formula}]]${state(m.r2)} → ${co(c)}[[${m.p1.formula}]]${state(m.p1)} + ${co(d)}[[${m.p2.formula}]]${state(m.p2)}`;
}

function ionsOf(c: IonicCompound, k: number): string[] {
  if (!isSoluble(c.cation, c.anion)) return [`${co(k)}[[${c.formula}]](s)`];
  return [`${co(k * c.nCation)}${ionText(c.cation)}(aq)`, `${co(k * c.nAnion)}${ionText(c.anion)}(aq)`];
}

export function totalIonic(m: Mix): string {
  const [a, b, c, d] = m.coefficients;
  return `${[...ionsOf(m.r1, a), ...ionsOf(m.r2, b)].join(' + ')} → ${[...ionsOf(m.p1, c), ...ionsOf(m.p2, d)].join(' + ')}`;
}

/** Net ionic equation (lowest terms): the precipitate's ions → the precipitate. */
export function netIonic(m: Mix): string {
  const p = m.precipitate;
  if (!p) return 'No reaction: every ion is a spectator';
  return `${co(p.nCation)}${ionText(p.cation)}(aq) + ${co(p.nAnion)}${ionText(p.anion)}(aq) → [[${p.formula}]](s)`;
}

export function spectators(m: Mix): Ion[] {
  const p = m.precipitate;
  return [m.r1.cation, m.r1.anion, m.r2.cation, m.r2.anion].filter((i) => !p || (i !== p.cation && i !== p.anion));
}

export const ionList = (ions: Ion[]) => ions.map(ionText).join(' and ');
