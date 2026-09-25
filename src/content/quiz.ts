// Helpers for concept questions: a bank of multiple-choice items becomes a practice template.
import type { Question, QuestionTemplate, RichText } from './types';
import type { Rng } from '../engine/rng';

export interface MCItem {
  q: RichText;
  correct: RichText;
  wrong: RichText[];
  /** Nudge, specific, setup. */
  hints: [RichText, RichText, RichText];
  explain: RichText;
  /** Feedback for particular wrong options, keyed by the option text. */
  why?: Record<string, RichText>;
}

export function mcQuestion(item: MCItem, rng: Rng, stepPrompt = 'Choose one.'): Question {
  const options = rng.shuffle([item.correct, ...item.wrong]);
  return {
    prompt: item.q,
    steps: [
      {
        prompt: stepPrompt,
        answer: {
          kind: 'choice',
          options,
          correct: options.indexOf(item.correct),
          feedback: item.why ? options.map((o) => item.why![o]) : undefined,
        },
        hints: item.hints,
        explain: item.explain,
      },
    ],
  };
}

/** A template that draws one item from a bank each time. */
export function mcTemplate(id: string, skill: string, bank: MCItem[], stepPrompt?: string): QuestionTemplate {
  return { id, skill, generate: (rng) => mcQuestion(rng.pick(bank), rng, stepPrompt) };
}

/** Shorthand for a classification item: "X is a …" with fixed category options. */
export function classify(
  q: RichText,
  answer: string,
  categories: string[],
  hints: [RichText, RichText, RichText],
  explain: RichText,
): MCItem {
  return { q, correct: answer, wrong: categories.filter((c) => c !== answer), hints, explain };
}
