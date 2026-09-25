// Balanced reactions and shared step builders for the stoichiometry topics (Unit 1, 14–18).
import type { Step } from './types';
import { MOLAR_VOLUME_STP, f, given, mm, sf } from './substances';
import { molarMassStep } from './molarMassHelpers';
import { equationText, solveBalance } from '../engine/balance';
import { molarMass } from '../engine/formula';

export interface Rx {
  context: string;
  reactants: string[];
  products: string[];
  coefficients: number[];
  /** Species that are gases at STP (usable with 22.7 L/mol). */
  gases: string[];
  /** Species used as aqueous solutions (usable with mol/L). */
  aqueous: string[];
}

function rx(context: string, reactants: string[], products: string[], gases: string[] = [], aqueous: string[] = [], coefficients?: number[]): Rx {
  const c = coefficients ?? solveBalance(reactants, products);
  if (!c) throw new Error(`Unbalanced: ${reactants} → ${products}`);
  return { context, reactants, products, coefficients: c, gases, aqueous };
}

export const REACTIONS: Rx[] = [
  rx('Hydrogen burns in oxygen', ['H2', 'O2'], ['H2O'], ['H2', 'O2']),
  rx('The Haber process makes ammonia for fertilizer', ['N2', 'H2'], ['NH3'], ['N2', 'H2', 'NH3']),
  rx('Natural gas (methane) burns in a furnace', ['CH4', 'O2'], ['CO2', 'H2O'], ['CH4', 'O2', 'CO2']),
  rx('Propane burns in a barbecue', ['C3H8', 'O2'], ['CO2', 'H2O'], ['C3H8', 'O2', 'CO2']),
  rx('Aluminum reacts with oxygen', ['Al', 'O2'], ['Al2O3'], ['O2']),
  rx('Heating potassium chlorate releases oxygen', ['KClO3'], ['KCl', 'O2'], ['O2']),
  rx('Limestone is heated to make lime', ['CaCO3'], ['CaO', 'CO2'], ['CO2']),
  rx('Zinc reacts with hydrochloric acid', ['Zn', 'HCl'], ['ZnCl2', 'H2'], ['H2'], ['HCl']),
  rx('Magnesium reacts with hydrochloric acid', ['Mg', 'HCl'], ['MgCl2', 'H2'], ['H2'], ['HCl']),
  rx('A blast furnace turns iron ore into iron', ['Fe2O3', 'CO'], ['Fe', 'CO2'], ['CO', 'CO2']),
  rx('A car airbag inflates with nitrogen', ['NaN3'], ['Na', 'N2'], ['N2']),
  rx('Cellular respiration releases energy from glucose', ['C6H12O6', 'O2'], ['CO2', 'H2O'], ['O2', 'CO2']),
  rx('Photosynthesis makes glucose', ['CO2', 'H2O'], ['C6H12O6', 'O2'], ['CO2', 'O2']),
  rx('Silver nitrate and sodium chloride form a precipitate', ['AgNO3', 'NaCl'], ['AgCl', 'NaNO3'], [], ['AgNO3', 'NaCl']),
  rx('Lead(II) nitrate and potassium iodide form a yellow precipitate', ['Pb(NO3)2', 'KI'], ['PbI2', 'KNO3'], [], ['Pb(NO3)2', 'KI']),
  rx('Sodium hydroxide neutralizes sulfuric acid', ['NaOH', 'H2SO4'], ['Na2SO4', 'H2O'], [], ['NaOH', 'H2SO4']),
  rx('Octane burns in a car engine', ['C8H18', 'O2'], ['CO2', 'H2O'], ['O2', 'CO2'], [], [2, 25, 16, 18]),
  rx('Ammonia is oxidized to make nitric acid', ['NH3', 'O2'], ['NO', 'H2O'], ['NH3', 'O2', 'NO']),
  rx('An antacid (calcium carbonate) neutralizes stomach acid', ['CaCO3', 'HCl'], ['CaCl2', 'H2O', 'CO2'], ['CO2'], ['HCl']),
  rx('Sodium reacts with chlorine gas', ['Na', 'Cl2'], ['NaCl'], ['Cl2']),
  rx('Iron rusts', ['Fe', 'O2'], ['Fe2O3'], ['O2']),
];

export const species = (r: Rx) => [...r.reactants, ...r.products];
export const coefOf = (r: Rx, formula: string) => r.coefficients[species(r).indexOf(formula)];
export const eq = (r: Rx) => equationText(r.reactants, r.products, r.coefficients);

/** Mole-ratio step: moles of `from` → moles of `to`. */
export function ratioStep(r: Rx, from: string, to: string, nFrom: number, nText: string): Step {
  const a = coefOf(r, from);
  const b = coefOf(r, to);
  const nTo = (nFrom * b) / a;
  return {
    prompt: `Use the mole ratio to find the moles of ${f(to)}.`,
    answer: { kind: 'numeric', value: nTo, unit: `mol [[${to}]]` },
    hints: [
      `From the balanced equation: ${eq(r)}`,
      `The ratio is ${b} ${to} : ${a} ${from}.`,
      `n(${to}) = ${nText} × ${b}/${a}`,
    ],
    mistakes: a !== b ? [{ value: (nFrom * a) / b, message: `The ratio is upside down. Multiply by (${b} ${to} ÷ ${a} ${from}): wanted over given.` }, { value: nFrom, message: 'Use the coefficients from the balanced equation. The ratio isn’t 1 : 1 here.' }] : [],
    explain: `n(${f(to)}) = ${nText} mol × ${b}/${a} = ${sf(nTo, 4)} mol`,
  };
}

export function massToMolesSteps(formula: string, m: number): { steps: Step[]; n: number } {
  const M = molarMass(formula);
  const n = m / M;
  return {
    n,
    steps: [
      molarMassStep(formula),
      {
        prompt: `Convert ${given(m, 3)} g of ${f(formula)} to moles.`,
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['n = m ÷ M', `${given(m, 3)} ÷ ${mm(M)}`, 'Keep an extra digit for now.'],
        mistakes: [{ value: m * M, message: 'Grams → moles: divide by the molar mass.' }],
        explain: `n = ${given(m, 3)} g ÷ ${mm(M)} g/mol = ${sf(n, 4)} mol`,
      },
    ],
  };
}

export function molesToMassStep(formula: string, n: number, final = true): Step {
  const M = molarMass(formula);
  return {
    prompt: `Convert moles of ${f(formula)} to grams.`,
    answer: { kind: 'numeric', value: n * M, unit: 'g', ...(final ? { sigFigs: 3 } : {}) },
    hints: ['m = n × M', `M(${f(formula)}) = ${mm(M)} g/mol`, `${sf(n, 4)} × ${mm(M)} = ?`],
    mistakes: [{ value: n / M, message: 'Moles → grams: multiply by the molar mass.' }],
    explain: `m = ${sf(n, 4)} mol × ${mm(M)} g/mol = **${sf(n * M, 3)} g**`,
  };
}

export function molesToVolumeStep(formula: string, n: number): Step {
  const V = n * MOLAR_VOLUME_STP;
  return {
    prompt: `What volume of ${f(formula)} is that at STP?`,
    answer: { kind: 'numeric', value: V, unit: 'L', sigFigs: 3 },
    hints: ['At STP, 1 mol of gas = 22.7 L.', 'V = n × 22.7 L/mol', `${sf(n, 4)} × 22.7 = ?`],
    mistakes: [{ value: n / MOLAR_VOLUME_STP, message: 'Moles → litres: multiply by 22.7 L/mol.' }],
    explain: `V = ${sf(n, 4)} mol × 22.7 L/mol = **${sf(V, 3)} L**`,
  };
}

/** Pick a reaction and two different species, filtered by a predicate. */
export function pickPair(
  rng: { pick<T>(a: readonly T[]): T; shuffle<T>(a: readonly T[]): T[] },
  ok: (r: Rx, from: string, to: string) => boolean,
): { r: Rx; from: string; to: string } {
  const options: { r: Rx; from: string; to: string }[] = [];
  for (const r of REACTIONS) {
    for (const from of species(r)) for (const to of species(r)) if (from !== to && ok(r, from, to)) options.push({ r, from, to });
  }
  return rng.pick(options);
}
