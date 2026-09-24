// Parsing, sig-fig counting, and formatting for student-typed numbers.

export interface ParsedNumber {
  value: number;
  /** Significant figures as written. Trailing zeros without a decimal point are not counted. */
  sigFigs: number;
  /** Decimal places in the mantissa as written. */
  decimals: number;
  /** True when typed in scientific notation. */
  scientific: boolean;
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+',
};

/**
 * Accepts: 12.5, -0.0030, 3.01e23, 3.01E-4, 3.01 x 10^23, 3.01×10^23,
 * 3.01*10^23, 3.01 X 10 ^ -4, 3.01×10²³, 1,250 (thousands separators).
 */
export function parseNumber(input: string): ParsedNumber | null {
  let s = input.trim().replace(/[−–]/g, '-');
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + [...m].map((c) => SUPERSCRIPT_DIGITS[c]).join(''));
  s = s.replace(/\s+/g, '');
  if (!s) return null;

  let mantissa = s;
  let exponent = 0;
  let scientific = false;

  const tenPower = s.match(/^(.+?)[x×*·]10\^?\(?([+-]?\d+)\)?$/i);
  const eNotation = s.match(/^(.+?)e([+-]?\d+)$/i);
  if (tenPower) {
    mantissa = tenPower[1];
    exponent = Number(tenPower[2]);
    scientific = true;
  } else if (eNotation) {
    mantissa = eNotation[1];
    exponent = Number(eNotation[2]);
    scientific = true;
  }

  // Thousands separators only in the canonical 1,234,567 form.
  if (/^-?\d{1,3}(,\d{3})+(\.\d*)?$/.test(mantissa)) mantissa = mantissa.replace(/,/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(mantissa)) return null;

  const value = Number(mantissa) * 10 ** exponent;
  if (!Number.isFinite(value)) return null;

  const decimals = mantissa.includes('.') ? mantissa.split('.')[1].length : 0;
  return { value: cleanFloat(value), sigFigs: countSigFigs(mantissa), decimals, scientific };
}

export function countSigFigs(mantissa: string): number {
  const m = mantissa.replace(/^[+-]/, '');
  const hasPoint = m.includes('.');
  let digits = m.replace('.', '').replace(/^0+/, '');
  if (!digits) return 1; // "0" or "0.000"
  if (!hasPoint) digits = digits.replace(/0+$/, '');
  return Math.max(digits.length, 1);
}

/** Removes float noise such as 0.30000000000000004. */
export function cleanFloat(n: number): number {
  return n === 0 ? 0 : Number(n.toPrecision(12));
}

export function roundSig(n: number, sig: number): number {
  if (n === 0) return 0;
  // Nudge so values like 0.4275 (stored as 0.42749999…) round half up, as on paper.
  return Number((n * (1 + 1e-12)).toPrecision(sig));
}

export function roundDecimals(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(cleanFloat(n * f)) / f;
}

/**
 * Formats with the given sig figs as rich-text markup, e.g. "1.51 × 10^{24}".
 * Uses scientific notation when |exponent| >= sciThreshold.
 */
export function formatSig(n: number, sig: number, sciThreshold = 5): string {
  if (n === 0) return '0';
  const rounded = roundSig(n, sig);
  const exp = Math.floor(Math.log10(Math.abs(rounded)));
  const scientific = () => `${(rounded / 10 ** exp).toFixed(Math.max(sig - 1, 0))} × 10^{${exp}}`;
  if (Math.abs(exp) >= sciThreshold) return scientific();
  const plain = rounded.toFixed(Math.max(sig - 1 - exp, 0));
  // "120" can't show 3 sig figs, so write 1.20 × 10^2 instead.
  return countSigFigs(plain) === sig ? plain : scientific();
}

export function formatDecimals(n: number, decimals: number): string {
  return roundDecimals(n, decimals).toFixed(decimals);
}

export function relativeDiff(a: number, b: number): number {
  if (b === 0) return Math.abs(a);
  return Math.abs(a - b) / Math.abs(b);
}
