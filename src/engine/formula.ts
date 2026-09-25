// Chemical formula parsing: element counts, molar mass, and comparison helpers.
import { ELEMENT_BY_SYMBOL, massOf } from '../data/elements';

export type ElementCounts = Record<string, number>;

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/** Converts subscript digits and hydrate dots to plain ASCII: "CuSO₄·5H₂O" -> "CuSO4*5H2O". */
export function normalizeFormula(input: string): string {
  return input
    .trim()
    .replace(/[₀-₉]/g, (c) => SUBSCRIPT_DIGITS[c])
    .replace(/\s+/g, '')
    // State symbols aren't part of the formula: HCl(aq) → HCl.
    .replace(/\((s|l|g|aq)\)/gi, '')
    .replace(/[·•∙.]/g, '*')
    .replace(/[[{]/g, '(')
    .replace(/[\]}]/g, ')');
}

export class FormulaError extends Error {}

/**
 * Parses a formula into element counts. Supports nested parentheses and hydrates.
 * Element symbols must be correctly capitalized.
 */
export function parseFormula(input: string): ElementCounts {
  const s = normalizeFormula(input);
  if (!s) throw new FormulaError('Empty formula');
  const total: ElementCounts = {};
  for (const part of s.split('*')) {
    const m = part.match(/^(\d*)(.*)$/)!;
    const multiplier = m[1] ? Number(m[1]) : 1;
    addInto(total, parseGroup(m[2]), multiplier);
  }
  return total;
}

function parseGroup(s: string): ElementCounts {
  let i = 0;
  const readNumber = () => {
    const m = s.slice(i).match(/^\d+/);
    if (!m) return 1;
    i += m[0].length;
    return Number(m[0]);
  };
  const parse = (depth: number): ElementCounts => {
    const counts: ElementCounts = {};
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') {
        i++;
        const inner = parse(depth + 1);
        if (s[i] !== ')') throw new FormulaError('Missing )');
        i++;
        addInto(counts, inner, readNumber());
      } else if (ch === ')') {
        if (depth === 0) throw new FormulaError('Unexpected )');
        return counts;
      } else if (/[A-Z]/.test(ch)) {
        let sym = ch;
        i++;
        if (i < s.length && /[a-z]/.test(s[i])) sym += s[i++];
        if (!ELEMENT_BY_SYMBOL[sym]) throw new FormulaError(`Unknown element ${sym}`);
        addInto(counts, { [sym]: 1 }, readNumber());
      } else {
        throw new FormulaError(`Unexpected "${ch}"`);
      }
    }
    if (depth > 0) throw new FormulaError('Missing )');
    return counts;
  };
  const result = parse(0);
  if (Object.keys(result).length === 0) throw new FormulaError('No elements');
  return result;
}

function addInto(target: ElementCounts, src: ElementCounts, times: number) {
  for (const [el, n] of Object.entries(src)) target[el] = (target[el] ?? 0) + n * times;
}

export function tryParseFormula(input: string): ElementCounts | null {
  try {
    return parseFormula(input);
  } catch {
    return null;
  }
}

/** Molar mass using chart values, rounded to 2 decimals (as students compute it). */
export function molarMass(formula: string): number {
  const counts = parseFormula(formula);
  let sum = 0;
  for (const [el, n] of Object.entries(counts)) sum += massOf(el) * n;
  return Math.round(sum * 100) / 100;
}

export function sameCounts(a: ElementCounts, b: ElementCounts): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

/** Total number of atoms in one formula unit. */
export function atomCount(formula: string): number {
  return Object.values(parseFormula(formula)).reduce((a, b) => a + b, 0);
}

/**
 * Molar mass computed with a common mistake: ignoring the number after a closing
 * parenthesis (e.g. Ca(NO3)2 treated as CaNO3). Returns null if no parentheses.
 */
export function molarMassIgnoringGroupSubscript(formula: string): number | null {
  const f = normalizeFormula(formula);
  if (!/\)\d/.test(f)) return null;
  return molarMass(f.replace(/\)\d+/g, ')'));
}

/** Molar mass with every subscript ignored (each symbol counted once). */
export function molarMassIgnoringSubscripts(formula: string): number {
  const f = normalizeFormula(formula).split('*')[0];
  const symbols = new Set(f.match(/[A-Z][a-z]?/g) ?? []);
  let sum = 0;
  for (const s of symbols) sum += massOf(s);
  return Math.round(sum * 100) / 100;
}
