// Shared substance pools and helpers used by question generators.
import { countSigFigs, formatDecimals, formatSig } from '../engine/numeric';
import type { Rng } from '../engine/rng';

export const AVOGADRO = 6.02e23;
export const MOLAR_VOLUME_STP = 22.4;

export type ParticleKind = 'atoms' | 'molecules' | 'formula units';

export interface Substance {
  formula: string;
  name: string;
  particle: ParticleKind;
  /** Gas at STP (usable with 22.4 L/mol). */
  gas?: boolean;
}

export const METALS: Substance[] = [
  { formula: 'Fe', name: 'iron', particle: 'atoms' },
  { formula: 'Cu', name: 'copper', particle: 'atoms' },
  { formula: 'Al', name: 'aluminum', particle: 'atoms' },
  { formula: 'Mg', name: 'magnesium', particle: 'atoms' },
  { formula: 'Zn', name: 'zinc', particle: 'atoms' },
  { formula: 'Ag', name: 'silver', particle: 'atoms' },
  { formula: 'Au', name: 'gold', particle: 'atoms' },
  { formula: 'Na', name: 'sodium', particle: 'atoms' },
  { formula: 'Ca', name: 'calcium', particle: 'atoms' },
];

export const MOLECULAR: Substance[] = [
  { formula: 'H2O', name: 'water', particle: 'molecules' },
  { formula: 'CO2', name: 'carbon dioxide', particle: 'molecules', gas: true },
  { formula: 'NH3', name: 'ammonia', particle: 'molecules', gas: true },
  { formula: 'CH4', name: 'methane', particle: 'molecules', gas: true },
  { formula: 'O2', name: 'oxygen', particle: 'molecules', gas: true },
  { formula: 'N2', name: 'nitrogen', particle: 'molecules', gas: true },
  { formula: 'Cl2', name: 'chlorine', particle: 'molecules', gas: true },
  { formula: 'H2', name: 'hydrogen', particle: 'molecules', gas: true },
  { formula: 'C6H12O6', name: 'glucose', particle: 'molecules' },
  { formula: 'C3H8', name: 'propane', particle: 'molecules', gas: true },
  { formula: 'SO2', name: 'sulfur dioxide', particle: 'molecules', gas: true },
];

export const IONIC: Substance[] = [
  { formula: 'NaCl', name: 'sodium chloride', particle: 'formula units' },
  { formula: 'KBr', name: 'potassium bromide', particle: 'formula units' },
  { formula: 'MgO', name: 'magnesium oxide', particle: 'formula units' },
  { formula: 'CaCl2', name: 'calcium chloride', particle: 'formula units' },
  { formula: 'Al2O3', name: 'aluminum oxide', particle: 'formula units' },
  { formula: 'NaOH', name: 'sodium hydroxide', particle: 'formula units' },
  { formula: 'CaCO3', name: 'calcium carbonate', particle: 'formula units' },
  { formula: 'KNO3', name: 'potassium nitrate', particle: 'formula units' },
];

export const GASES: Substance[] = [
  ...MOLECULAR.filter((s) => s.gas),
  { formula: 'He', name: 'helium', particle: 'atoms', gas: true },
  { formula: 'Ne', name: 'neon', particle: 'atoms', gas: true },
];

export const ALL_SUBSTANCES: Substance[] = [...METALS, ...MOLECULAR, ...IONIC];

/** "[[H2O]]" markup for a formula. */
export const f = (formula: string) => `[[${formula}]]`;

/** "water, [[H2O]]" */
export const named = (s: Substance) => `${s.name}, ${f(s.formula)}`;

/** Sig-fig formatted number markup. */
export const sf = (n: number, sig: number) => formatSig(n, sig);

/** Molar-mass style: 2 decimals. */
export const mm = (n: number) => formatDecimals(n, 2);

/** 6.02 × 10^{23} markup. */
export const NA_TEXT = '6.02 × 10^{23}';

/** Given value with its written sig figs, e.g. 25.0 stays "25.0". */
export function given(n: number, sig: number): string {
  return formatSig(n, sig);
}

/**
 * A random measured value whose written form unambiguously shows `sig` sig figs
 * (avoids values like "40" that read as 1 sig fig).
 */
export function measured(rng: Rng, min: number, max: number, sig: number): number {
  for (let i = 0; i < 50; i++) {
    const v = rng.sig(min, max, sig);
    const written = formatSig(v, sig);
    if (!written.includes('×') && countSigFigs(written) === sig) return v;
  }
  return rng.sig(min, max, sig);
}
