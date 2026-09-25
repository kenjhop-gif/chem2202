// Checks a student's response against an AnswerSpec and produces calm, specific feedback.
import type { AnswerSpec, Mistake, NumericAnswer, RichText } from '../content/types';
import { formatDecimals, formatSig, parseNumber, relativeDiff, roundSig } from './numeric';
import { normalizeFormula, sameCounts, tryParseFormula } from './formula';

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
  | { kind: 'formula'; text: string };

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
  return { status: 'invalid', message: 'Enter an answer first.' };
}

export function formatAnswer(spec: NumericAnswer): string {
  if (spec.sigFigs) return formatSig(spec.value, spec.sigFigs);
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
