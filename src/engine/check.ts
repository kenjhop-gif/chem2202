// Checks a student's response against an AnswerSpec and produces calm, specific feedback.
import type { AnswerSpec, Mistake, NumericAnswer, RichText } from '../content/types';
import { formatDecimals, formatSig, parseNumber, relativeDiff, roundSig } from './numeric';
import { normalizeFormula, sameCounts, tryParseFormula } from './formula';
import { elementsIn, gcdAll, isBalanced, tally } from './balance';

export type CheckStatus =
  /** Right answer. May carry a gentle note (sig figs, notation). */
  | 'correct'
  /** Wrong answer; counts as a retry. */
  | 'incorrect'
  /** Couldn't read the input; not counted as a retry. */
  | 'invalid';

export interface CheckResult {
  status: CheckStatus;
  message?: RichText;
  /** Extra gentle note shown alongside a correct answer. */
  note?: RichText;
}

export type Response =
  | { kind: 'numeric'; text: string; unit?: string }
  | { kind: 'choice'; index: number }
  | { kind: 'formula'; text: string }
  | { kind: 'name'; text: string }
  | { kind: 'balance'; coefficients: (number | null)[] };

export function checkAnswer(spec: AnswerSpec, response: Response, mistakes: Mistake[] = []): CheckResult {
  if (spec.kind === 'numeric' && response.kind === 'numeric') return checkNumeric(spec, response, mistakes);
  if (spec.kind === 'choice' && response.kind === 'choice') {
    if (response.index === spec.correct) return { status: 'correct' };
    return {
      status: 'incorrect',
      message: spec.feedback?.[response.index] ?? 'Not quite. Take another look, or try a hint.',
    };
  }
  if (spec.kind === 'formula' && response.kind === 'formula') return checkFormula(spec.formula, response.text, mistakes, spec.anyOrder);
  if (spec.kind === 'name' && response.kind === 'name') return checkName(spec, response.text, mistakes);
  if (spec.kind === 'balance' && response.kind === 'balance') return checkBalance(spec, response.coefficients);
  return { status: 'invalid', message: 'Enter an answer first.' };
}

function checkBalance(spec: Extract<AnswerSpec, { kind: 'balance' }>, raw: (number | null)[]): CheckResult {
  // A blank box means 1, as on paper.
  const coef = raw.map((c) => (c === null ? 1 : c));
  if (coef.some((c) => !Number.isInteger(c) || c < 1)) {
    return { status: 'invalid', message: 'Use whole numbers of 1 or more (leave a box blank for 1).' };
  }
  if (isBalanced(spec.reactants, spec.products, coef)) {
    const g = gcdAll(coef);
    if (g > 1) {
      return { status: 'incorrect', message: `Balanced! But every coefficient can be divided by ${g}. Use the lowest whole numbers.` };
    }
    return { status: 'correct' };
  }
  const left = tally(spec.reactants, coef.slice(0, spec.reactants.length));
  const right = tally(spec.products, coef.slice(spec.reactants.length));
  const off = elementsIn([...spec.reactants, ...spec.products]).filter((el) => (left[el] ?? 0) !== (right[el] ?? 0));
  const el = off[0];
  return {
    status: 'incorrect',
    message: `Not balanced yet: ${el} is ${left[el] ?? 0} on the left and ${right[el] ?? 0} on the right.${off.length > 1 ? ` (${off.length} elements are off.)` : ''}`,
  };
}

/** Forgives capitals, extra spaces, and a space before a Roman numeral: "Iron (III)  chloride" → "iron(iii) chloride". */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‐-―]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*,\s*/g, ',')
    .trim();
}

const ROMAN = /\(([ivx]+)\)/;

function checkName(spec: Extract<AnswerSpec, { kind: 'name' }>, text: string, mistakes: Mistake[]): CheckResult {
  const input = normalizeName(text);
  if (!input) return { status: 'invalid', message: 'Enter a name first.' };
  const accepted = spec.accepted.map(normalizeName);
  if (accepted.includes(input)) return { status: 'correct' };

  if (spec.oldNames?.map(normalizeName).includes(input)) {
    return {
      status: 'invalid',
      message: 'That’s a real name, but it’s an older one. This course uses the IUPAC name. Try again!',
    };
  }
  for (const m of mistakes) {
    if (m.name && normalizeName(m.name) === input) return { status: 'incorrect', message: m.message };
  }

  const goal = accepted[0];
  const goalRoman = goal.match(ROMAN);
  const inputRoman = input.match(ROMAN);
  if (goalRoman && !inputRoman && input === goal.replace(ROMAN, '')) {
    return { status: 'incorrect', message: 'This metal can form more than one ion. Add a Roman numeral to show its charge.' };
  }
  if (goalRoman && inputRoman && input.replace(ROMAN, '()') === goal.replace(ROMAN, '()')) {
    return { status: 'incorrect', message: 'Check the Roman numeral. Work out the metal’s charge from the negative ion(s).' };
  }
  if (!goalRoman && inputRoman && input.replace(ROMAN, '') === goal) {
    return { status: 'incorrect', message: 'This metal has only one possible charge, so it doesn’t need a Roman numeral.' };
  }
  if (goal.endsWith('ide') && input === goal.replace(/ide$/, 'ine')) {
    return { status: 'incorrect', message: 'Close! A negative ion made from one element ends in **-ide** (chloride, not chlorine).' };
  }
  if (/^(mono|di|tri|tetra)/.test(input.split(' ').slice(-1)[0]) && !/(mono|di|tri|tetra|penta|hexa)/.test(goal)) {
    return { status: 'incorrect', message: 'Ionic compounds don’t use prefixes like mono- or di-. The charges set the ratio.' };
  }
  const words = goal.split(' ');
  const got = input.split(' ');
  if (words.length === got.length && words[0] === got[0]) {
    return { status: 'incorrect', message: 'The first part is right. Check the name of the second part.' };
  }
  if (words.length === got.length && words.slice(1).join(' ') === got.slice(1).join(' ')) {
    return { status: 'incorrect', message: 'The second part is right. Check the first part.' };
  }
  return { status: 'incorrect', message: 'Not quite. Check your spelling and each part of the name, or try a hint.' };
}

export function formatAnswer(spec: NumericAnswer): string {
  if (spec.sigFigs) {
    const threshold = spec.notation === 'scientific' ? 0 : spec.notation === 'standard' ? 99 : 5;
    return formatSig(spec.value, spec.sigFigs, threshold);
  }
  if (spec.decimals !== undefined) return formatDecimals(spec.value, spec.decimals);
  return String(spec.value);
}

function checkNumeric(
  spec: NumericAnswer,
  response: { text: string; unit?: string },
  mistakes: Mistake[],
): CheckResult {
  if (!response.text.trim()) return { status: 'invalid', message: 'Enter an answer first.' };
  const parsed = parseNumber(response.text);
  if (!parsed) {
    return {
      status: 'invalid',
      message: 'That doesn’t look like a number. Try something like 2.35 or 6.02e23.',
    };
  }
  if (spec.unitChoices && !response.unit) {
    return { status: 'invalid', message: 'Pick a unit too.' };
  }

  const target = spec.value;
  const tolerance = spec.tolerance ?? 0.01;
  const withinTolerance = relativeDiff(parsed.value, target) <= tolerance;
  // Fewer digits than the answer but correctly rounded still has the right value.
  const correctlyRounded =
    parsed.value !== 0 &&
    relativeDiff(parsed.value, roundSig(target, parsed.sigFigs)) < 1e-9;
  const valueOk = withinTolerance || correctlyRounded;

  const unitOk = !spec.unitChoices || response.unit === spec.unit;

  if (valueOk && !unitOk) {
    return { status: 'incorrect', message: `Right number, but check the unit. What does this quantity measure?` };
  }

  if (valueOk && spec.notation === 'scientific' && !parsed.scientific) {
    return { status: 'incorrect', message: 'Right value! Now write it in scientific notation (like 4.56 × 10^{4}).' };
  }
  if (valueOk && spec.notation === 'standard' && parsed.scientific) {
    return { status: 'incorrect', message: 'Right value! Now write it as a regular number, without × 10.' };
  }

  if (valueOk) {
    const shown = formatAnswer(spec);
    if (spec.sigFigs && parsed.sigFigs !== spec.sigFigs) {
      const detail = `Your answer has ${parsed.sigFigs} sig fig${parsed.sigFigs === 1 ? '' : 's'}, but the data supports ${spec.sigFigs}.`;
      if (spec.strictSigFigs) return { status: 'incorrect', message: `Right value! ${detail} Round it again.` };
      return { status: 'correct', note: `${detail} Rounded correctly, it's **${shown}**.` };
    }
    if (!spec.sigFigs && spec.decimals !== undefined && spec.showRoundingNote !== false && parsed.decimals !== spec.decimals) {
      return {
        status: 'correct',
        note: `Keep ${spec.decimals} decimal places, like the periodic chart: **${shown}**.`,
      };
    }
    if (spec.expectScientific && !parsed.scientific && Math.abs(Math.log10(Math.abs(target))) >= 4) {
      return { status: 'correct', note: `Tip: numbers this size are easier to read in scientific notation: **${shown}**.` };
    }
    return { status: 'correct' };
  }

  for (const m of mistakes) {
    if (m.value !== undefined && relativeDiff(parsed.value, m.value) <= Math.max(tolerance, 0.005)) {
      return { status: 'incorrect', message: m.message };
    }
  }

  if (parsed.value !== 0 && target !== 0) {
    const ratio = Math.log10(Math.abs(parsed.value / target));
    const rounded = Math.round(ratio);
    if (rounded !== 0 && Math.abs(ratio - rounded) < 0.005) {
      return {
        status: 'incorrect',
        message: 'The digits look right, but it’s off by a power of 10. Check the exponent or the decimal point.',
      };
    }
    if (Math.sign(parsed.value) !== Math.sign(target) && relativeDiff(-parsed.value, target) <= tolerance) {
      return { status: 'incorrect', message: 'Check the sign. Should this be negative?' };
    }
  }

  return { status: 'incorrect', message: 'Not quite. Check your work, or try a hint.' };
}

function checkFormula(target: string, text: string, mistakes: Mistake[], anyOrder = false): CheckResult {
  const input = normalizeFormula(text);
  if (!input) return { status: 'invalid', message: 'Enter a formula first.' };
  const goal = normalizeFormula(target);
  if (input === goal) return { status: 'correct' };

  if (input.toLowerCase() === goal.toLowerCase()) {
    return {
      status: 'incorrect',
      message:
        'Almost! Check your capital letters. Each symbol starts with a capital and any second letter is lowercase (Ca, not CA). **Co** is cobalt, but **CO** is carbon monoxide!',
    };
  }

  for (const m of mistakes) {
    if (m.formula && normalizeFormula(m.formula) === input) return { status: 'incorrect', message: m.message };
  }

  const counts = tryParseFormula(input);
  if (!counts) {
    return {
      status: 'incorrect',
      message: 'That formula has a symbol or bracket that doesn’t work. Check the capital letters and brackets.',
    };
  }
  const goalCounts = tryParseFormula(goal);
  if (goalCounts && sameCounts(counts, goalCounts)) {
    if (anyOrder) return { status: 'correct' };
    if (goal.includes('(') && !input.includes('(')) {
      return { status: 'incorrect', message: 'Right atoms! Now keep the polyatomic ion together in brackets, like Ca(NO_{3})_{2}.' };
    }
    return { status: 'incorrect', message: 'Right atoms, but written in a different order. Write the positive ion (usually the metal) first.' };
  }
  return { status: 'incorrect', message: 'Not quite. Check the subscripts, or try a hint.' };
}
