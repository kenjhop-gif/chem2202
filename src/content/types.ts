// Content model shared by every topic. Text fields use the inline markup
// understood by <Rich>: **bold**, [[H2O]] formulas, ^{23} superscripts, _{2} subscripts.
import type { Rng } from '../engine/rng';

export type RichText = string;

export type SectionId = 'basics' | 'u1' | 'u2' | 'u3';

export interface Section {
  id: SectionId;
  title: string;
  shortTitle: string;
  blurb: string;
}

export interface TopicMeta {
  id: string;
  section: SectionId;
  /** Display number within the section, e.g. "B5" or "3". */
  number: string;
  title: string;
  /** Sub-heading inside a section, e.g. "The mole". */
  group?: string;
}

// ---------- Learn blocks ----------

export type Block =
  | { type: 'p'; text: RichText }
  | { type: 'h'; text: RichText }
  | { type: 'list'; items: RichText[]; ordered?: boolean }
  | { type: 'key'; title: RichText; text: RichText }
  | { type: 'equation'; text: RichText; caption?: RichText }
  | { type: 'background'; title: RichText; text: RichText; topicId?: string }
  | { type: 'tip'; text: RichText }
  | { type: 'table'; head: RichText[]; rows: RichText[][] };

export interface WorkedExample {
  title: RichText;
  problem: RichText;
  steps: { label: RichText; work: RichText }[];
  answer: RichText;
}

export interface Video {
  youtubeId: string;
  title: string;
  channel: string;
  /** Why this video is useful, shown under the player. */
  note?: string;
}

// ---------- Practice ----------

export interface NumericAnswer {
  kind: 'numeric';
  value: number;
  /** Unit shown beside the box. */
  unit?: string;
  /** When set, the student picks the unit from these; `unit` is the correct one. */
  unitChoices?: string[];
  /** Sig figs the data supports; wrong count gets a note (or is wrong if strictSigFigs). */
  sigFigs?: number;
  strictSigFigs?: boolean;
  /** Expected decimal places (used for molar masses: 2 decimals like the chart). */
  decimals?: number;
  /** Relative tolerance, default 0.01. */
  tolerance?: number;
  /** Suggest scientific notation when a long plain number is typed. */
  expectScientific?: boolean;
}

export interface ChoiceAnswer {
  kind: 'choice';
  options: RichText[];
  correct: number;
  /** Optional per-option feedback for wrong picks. */
  feedback?: (RichText | undefined)[];
}

export interface FormulaAnswer {
  kind: 'formula';
  formula: string;
}

export type AnswerSpec = NumericAnswer | ChoiceAnswer | FormulaAnswer;

export interface Mistake {
  /** For numeric answers: the wrong value this mistake produces. */
  value?: number;
  /** For formula answers: the wrong formula. */
  formula?: string;
  message: RichText;
}

export interface Step {
  prompt: RichText;
  answer: AnswerSpec;
  /** Nudge, specific, setup. */
  hints: [RichText, RichText, RichText];
  mistakes?: Mistake[];
  /** Shown after the step is answered correctly or revealed. */
  explain: RichText;
}

export interface Question {
  prompt: RichText;
  /** Steps for "walk me through it". The last step's answer is the final answer. */
  steps: Step[];
  /** Extra mistakes checked in "try it first" mode against the final answer. */
  finalMistakes?: Mistake[];
}

export interface QuestionTemplate {
  id: string;
  /** Short label for progress, e.g. "mass to moles". */
  skill: string;
  generate(rng: Rng): Question;
}

export interface Topic {
  meta: TopicMeta;
  summary: RichText;
  learn: Block[];
  examples: WorkedExample[];
  /** The printable step guide: the general method for this topic. */
  stepGuide: RichText[];
  practice: QuestionTemplate[];
  videos: Video[];
}
