// Equation balancing: atom tallies and a small solver for generated reactions.
import { parseFormula, type ElementCounts } from './formula';

export function tally(formulas: string[], coefficients: number[]): ElementCounts {
  const total: ElementCounts = {};
  formulas.forEach((f, i) => {
    for (const [el, n] of Object.entries(parseFormula(f))) total[el] = (total[el] ?? 0) + n * coefficients[i];
  });
  return total;
}

export function elementsIn(formulas: string[]): string[] {
  const seen: string[] = [];
  for (const f of formulas) for (const el of Object.keys(parseFormula(f))) if (!seen.includes(el)) seen.push(el);
  return seen;
}

export function isBalanced(reactants: string[], products: string[], coefficients: number[]): boolean {
  const left = tally(reactants, coefficients.slice(0, reactants.length));
  const right = tally(products, coefficients.slice(reactants.length));
  const els = elementsIn([...reactants, ...products]);
  return els.every((el) => (left[el] ?? 0) === (right[el] ?? 0));
}

export function gcdAll(nums: number[]): number {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  return nums.reduce((a, b) => g(a, b));
}

/** Smallest whole-number coefficients (each ≤ max), or null if none found. */
export function solveBalance(reactants: string[], products: string[], max = 12): number[] | null {
  const species = [...reactants, ...products].map((f) => parseFormula(f));
  const els = elementsIn([...reactants, ...products]);
  // Row per element: atoms per unit of each species (products negative).
  const rows = els.map((el) => species.map((c, i) => (c[el] ?? 0) * (i < reactants.length ? 1 : -1)));
  const n = species.length;
  const coef = new Array(n).fill(1);
  const balanced = () => rows.every((r) => r.reduce((sum, a, i) => sum + a * coef[i], 0) === 0);
  // Raise the largest allowed coefficient gradually so the first hit is the simplest set.
  for (let limit = 1; limit <= max; limit++) {
    const found = search(0, limit, false);
    if (found) return found;
  }
  return null;

  function search(i: number, limit: number, hitLimit: boolean): number[] | null {
    if (i === n) return hitLimit && balanced() && gcdAll(coef) === 1 ? [...coef] : null;
    for (let c = 1; c <= limit; c++) {
      coef[i] = c;
      const r = search(i + 1, limit, hitLimit || c === limit);
      if (r) return r;
    }
    return null;
  }
}

/** "2 H2 + O2 → 2 H2O" in formula markup (coefficient 1 omitted). */
export function equationText(reactants: string[], products: string[], coefficients?: number[], arrow = '→'): string {
  const side = (fs: string[], offset: number) =>
    fs.map((f, i) => {
      const c = coefficients?.[offset + i];
      return `${c && c !== 1 ? c + ' ' : ''}[[${f}]]`;
    }).join(' + ');
  return `${side(reactants, 0)} ${arrow} ${side(products, reactants.length)}`;
}
