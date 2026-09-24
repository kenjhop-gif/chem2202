// Molar-mass wording and mistakes shared by every topic that asks for a molar mass.
import type { Mistake, Step } from './types';
import { f, mm } from './substances';
import {
  molarMass,
  molarMassIgnoringGroupSubscript,
  molarMassIgnoringSubscripts,
  parseFormula,
} from '../engine/formula';
import { massOf } from '../data/elements';

/** Written sum like "2(1.01) + 16.00" in formula order. */
export function breakdown(formula: string): string {
  return Object.entries(parseFormula(formula))
    .map(([el, n]) => (n === 1 ? mm(massOf(el)) : `${n}(${mm(massOf(el))})`))
    .join(' + ');
}

/** "2 H, 1 O" */
export function countsText(formula: string): string {
  return Object.entries(parseFormula(formula))
    .map(([el, n]) => `${n} ${el}`)
    .join(', ');
}

export function molarMassMistakes(formula: string): Mistake[] {
  const out: Mistake[] = [];
  const noGroup = molarMassIgnoringGroupSubscript(formula);
  if (noGroup !== null) {
    out.push({
      value: noGroup,
      message: 'It looks like you missed the number after the bracket. It multiplies **everything** inside the brackets.',
    });
  }
  const noSubs = molarMassIgnoringSubscripts(formula);
  if (noSubs !== molarMass(formula)) {
    out.push({ value: noSubs, message: 'It looks like each element was counted only once. Multiply by the subscripts.' });
  }
  return out;
}

/** A complete "find the molar mass" step. */
export function molarMassStep(formula: string, prompt = `Find the molar mass of ${f(formula)}.`): Step {
  const M = molarMass(formula);
  return {
    prompt,
    answer: { kind: 'numeric', value: M, unit: 'g/mol', decimals: 2, tolerance: 0.002 },
    hints: [
      'Add up the molar mass of **every** atom in the formula.',
      `Count the atoms: ${countsText(formula)}.`,
      `M = ${breakdown(formula)}`,
    ],
    mistakes: molarMassMistakes(formula),
    explain: `M(${f(formula)}) = ${breakdown(formula)} = **${mm(M)} g/mol**`,
  };
}
