import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { mcTemplate, type MCItem } from '../quiz';
import { cleanFloat, countSigFigs, formatSig, roundSig } from '../../engine/numeric';
import type { Rng } from '../../engine/rng';

/** A random digit string of the given length with nonzero first and last digits. */
function digits(rng: Rng, n: number, captiveZero = false): string {
  let s = String(rng.int(1, 9));
  for (let i = 1; i < n - 1; i++) s += String(captiveZero && i === 1 ? 0 : rng.int(0, 9));
  if (n > 1) s += String(rng.int(1, 9));
  return s;
}

/** Numbers written in forms that test each sig-fig rule. */
function sigFigNumber(rng: Rng): { text: string; rule: string } {
  const n = rng.int(1, 4);
  switch (rng.int(0, 5)) {
    case 0: // leading zeros
      return { text: `0.${'0'.repeat(rng.int(1, 3))}${digits(rng, n)}`, rule: 'Leading zeros (before the first nonzero digit) never count.' };
    case 1: // trailing zeros after a decimal point
      return { text: `${digits(rng, n)}.${'0'.repeat(rng.int(1, 2))}`, rule: 'Trailing zeros after a decimal point count.' };
    case 2: // captive zeros
      return { text: digits(rng, Math.max(n, 3), true), rule: 'Zeros between nonzero digits always count.' };
    case 3: // trailing zeros, no decimal point
      return { text: `${digits(rng, n)}${'0'.repeat(rng.int(1, 3))}`, rule: 'Trailing zeros in a whole number without a decimal point don’t count.' };
    case 4: // decimal with trailing zero
      return { text: `${digits(rng, n)}.${digits(rng, 1)}0`, rule: 'Trailing zeros after a decimal point count.' };
    default: // scientific notation
      return { text: `${digits(rng, 1)}.${digits(rng, n)} × 10^{${rng.int(-5, 8)}}`, rule: 'In scientific notation, every digit in the first number counts.' };
  }
}

function countQ(rng: Rng): Question {
  const { text, rule } = sigFigNumber(rng);
  const plain = text.split(' ')[0];
  const sf = countSigFigs(plain);
  return {
    prompt: `How many significant figures are in **${text}**?`,
    steps: [
      {
        prompt: 'Count the significant figures.',
        answer: { kind: 'numeric', value: sf, unit: 'sig figs', tolerance: 0 },
        hints: [
          'All nonzero digits count. The question is which zeros count.',
          'Leading zeros never count; captive zeros always count; trailing zeros count only if there’s a decimal point.',
          rule,
        ],
        explain: `${text} has **${sf}** significant figure${sf === 1 ? '' : 's'}. ${rule}`,
      },
    ],
  };
}

function roundQ(rng: Rng): Question {
  let value = 0;
  let sf = 3;
  for (let i = 0; i < 30; i++) {
    sf = rng.int(2, 4);
    value = cleanFloat(rng.int(10000, 999999) * 10 ** rng.int(-7, 0));
    const r = formatSig(value, sf);
    if (!r.includes('×') && roundSig(value, sf) !== value) break;
  }
  const answer = roundSig(value, sf);
  return {
    prompt: `Round **${value}** to ${sf} significant figures.`,
    steps: [
      {
        prompt: `Round to ${sf} sig figs.`,
        answer: { kind: 'numeric', value: answer, sigFigs: sf, strictSigFigs: true, tolerance: 1e-9 },
        hints: [
          'Start counting at the first nonzero digit.',
          `Keep ${sf} digits. Look at the next digit: 5 or more rounds up.`,
          'Don’t drop place-holding zeros in whole numbers (12 345 → 12 000, not 12).',
        ],
        explain: `${value} → **${formatSig(answer, sf)}**`,
      },
    ],
  };
}

function toScientific(rng: Rng): Question {
  const sf = rng.int(2, 4);
  const mant = Number(`${digits(rng, 1)}.${digits(rng, sf - 1)}`);
  const exp = rng.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
  const value = cleanFloat(mant * 10 ** exp);
  const written = exp < 0 ? value.toFixed(-exp + sf - 1) : String(value);
  return {
    prompt: `Write **${written}** in scientific notation.`,
    steps: [
      {
        prompt: 'Scientific notation (use ×10ⁿ or e).',
        answer: { kind: 'numeric', value, sigFigs: sf, strictSigFigs: true, notation: 'scientific', expectScientific: true, tolerance: 1e-9 },
        hints: [
          'Move the decimal so there’s one nonzero digit in front of it.',
          'Count how many places you moved it: that’s the exponent.',
          exp > 0 ? 'Big number → positive exponent.' : 'Small number (less than 1) → negative exponent.',
        ],
        explain: `${written} = **${formatSig(value, sf, 0)}**`,
      },
    ],
  };
}

function toStandard(rng: Rng): Question {
  const sf = rng.int(2, 3);
  const mant = Number(`${digits(rng, 1)}.${digits(rng, sf - 1)}`);
  const exp = rng.pick([-5, -4, -3, -2, -1, 2, 3, 4]);
  const value = cleanFloat(mant * 10 ** exp);
  return {
    prompt: `Write **${formatSig(value, sf, 0)}** as a regular (standard) number.`,
    steps: [
      {
        prompt: 'Standard form.',
        answer: { kind: 'numeric', value, sigFigs: sf, strictSigFigs: true, notation: 'standard', tolerance: 1e-9 },
        hints: [
          'The exponent tells you how many places to move the decimal.',
          exp > 0 ? 'Positive exponent → move the decimal right (bigger number).' : 'Negative exponent → move the decimal left (smaller number).',
          `Move it ${Math.abs(exp)} place${Math.abs(exp) === 1 ? '' : 's'}.`,
        ],
        explain: `${formatSig(value, sf, 0)} = **${formatSig(value, sf, 99)}**`,
      },
    ],
  };
}

const UNITS = [
  { from: 'g', to: 'mg', factor: 1000, rule: '1 g = 1000 mg' },
  { from: 'mg', to: 'g', factor: 0.001, rule: '1000 mg = 1 g' },
  { from: 'kg', to: 'g', factor: 1000, rule: '1 kg = 1000 g' },
  { from: 'g', to: 'kg', factor: 0.001, rule: '1000 g = 1 kg' },
  { from: 'L', to: 'mL', factor: 1000, rule: '1 L = 1000 mL' },
  { from: 'mL', to: 'L', factor: 0.001, rule: '1000 mL = 1 L' },
  { from: 'cm', to: 'm', factor: 0.01, rule: '100 cm = 1 m' },
];

function convert(rng: Rng): Question {
  const u = rng.pick(UNITS);
  const sf = 3;
  let x = 0;
  for (let i = 0; i < 30; i++) {
    x = Number(`${digits(rng, 1)}.${digits(rng, 2)}`) * 10 ** rng.int(0, 2);
    x = cleanFloat(x);
    if (!formatSig(x, sf).includes('×') && !formatSig(x * u.factor, sf).includes('×')) break;
  }
  const value = cleanFloat(x * u.factor);
  return {
    prompt: `Convert ${formatSig(x, sf)} ${u.from} to ${u.to}.`,
    steps: [
      {
        prompt: `How many ${u.to}?`,
        answer: { kind: 'numeric', value, unit: u.to, sigFigs: sf },
        hints: [
          `${u.rule}.`,
          u.factor > 1 ? 'Converting to a smaller unit → the number gets bigger (multiply).' : 'Converting to a bigger unit → the number gets smaller (divide).',
          `${formatSig(x, sf)} ${u.factor > 1 ? '×' : '÷'} ${u.factor > 1 ? u.factor : Math.round(1 / u.factor)} = ?`,
        ],
        mistakes: [{ value: x / u.factor, message: 'You went the wrong way. Check whether the number should get bigger or smaller.' }],
        explain: `${formatSig(x, sf)} ${u.from} = **${formatSig(value, sf)} ${u.to}**`,
      },
    ],
  };
}

function multiplyQ(rng: Rng): Question {
  const sa = rng.int(2, 4);
  const sb = rng.int(2, 4);
  const a = Number(`${digits(rng, 1)}.${digits(rng, sa - 1)}`) * 10 ** rng.int(0, 1);
  const b = Number(`${digits(rng, 1)}.${digits(rng, sb - 1)}`);
  const divide = rng.next() < 0.5;
  const raw = divide ? a / b : a * b;
  const sf = Math.min(sa, sb);
  const at = formatSig(a, sa);
  const bt = formatSig(b, sb);
  return {
    prompt: `Calculate ${at} ${divide ? '÷' : '×'} ${bt} and give the answer with the correct sig figs.`,
    steps: [
      {
        prompt: 'Answer with correct sig figs.',
        answer: { kind: 'numeric', value: raw, sigFigs: sf, strictSigFigs: true },
        hints: [
          'For × and ÷, the answer keeps the **fewest sig figs** of the numbers used.',
          `${at} has ${sa}; ${bt} has ${sb}.`,
          `Calculator: ${formatSig(raw, 6)} → round to ${sf} sig figs.`,
        ],
        explain: `${formatSig(raw, 6)} → **${formatSig(raw, sf)}** (${sf} sig figs, the fewest in the data).`,
      },
    ],
  };
}

function addQ(rng: Rng): Question {
  let da = 0, db = 0, a = 0, b = 0, subtract = false, d = 0, raw = 0, written = '0';
  // Avoid whole-number answers ending in 0 (their sig figs would be ambiguous).
  for (let i = 0; i < 40; i++) {
    da = rng.int(0, 3);
    db = rng.int(0, 3);
    a = Number((rng.int(100, 9999) / 10 ** da).toFixed(da));
    b = Number((rng.int(100, 9999) / 10 ** db).toFixed(db));
    subtract = rng.next() < 0.4 && a > b;
    d = Math.min(da, db);
    raw = subtract ? a - b : a + b;
    written = Number(raw.toFixed(d)).toFixed(d);
    if (!(d === 0 && written.endsWith('0'))) break;
  }
  const rounded = Number(written);
  const sf = countSigFigs(written);
  return {
    prompt: `Calculate ${a.toFixed(da)} ${subtract ? '−' : '+'} ${b.toFixed(db)} and give the answer with the correct precision.`,
    steps: [
      {
        prompt: 'Answer with the correct number of decimal places.',
        answer: { kind: 'numeric', value: rounded, sigFigs: sf, strictSigFigs: true, tolerance: 1e-9 },
        hints: [
          'For + and −, it’s about **decimal places**, not sig figs.',
          `${a.toFixed(da)} has ${da} decimal place${da === 1 ? '' : 's'}; ${b.toFixed(db)} has ${db}.`,
          `Calculator: ${cleanFloat(raw)} → round to ${d} decimal place${d === 1 ? '' : 's'}.`,
        ],
        explain: `${cleanFloat(raw)} → **${written}** (${d} decimal place${d === 1 ? '' : 's'}, the fewest in the data).`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'A student measures 12.3 g, 12.35 g, and 12.346 g. Which measurement is the most **precise**?',
    correct: '12.346 g',
    wrong: ['12.3 g', '12.35 g', 'They’re all equally precise'],
    hints: ['Precision is about how finely something is measured.', 'More decimal places = a finer measurement.', 'Which has the most decimal places?'],
    explain: '12.346 g is measured to the thousandth of a gram, the most precise of the three.',
  },
  {
    q: 'Why do sig figs matter in chemistry?',
    correct: 'They show how precisely a value was measured',
    wrong: ['They make numbers easier to type', 'They make every answer a whole number', 'They only matter for very large numbers'],
    hints: ['Every measurement has some uncertainty.', 'A calculator can’t make a measurement more precise.', 'Sig figs carry that uncertainty through a calculation.'],
    explain: 'A calculated answer can’t be more precise than the measurements it came from. Sig figs keep that honest.',
  },
  {
    q: 'Which number is **exact** and has unlimited sig figs?',
    correct: 'The 12 eggs in a dozen',
    wrong: ['A mass of 12.0 g', 'A volume of 25.0 mL', 'A temperature of 22 °C'],
    hints: ['Measured values have limited sig figs.', 'Some numbers are counted or defined, not measured.', 'Which one is a definition?'],
    explain: 'Counted and defined numbers (12 in a dozen, 1000 mL in 1 L) are exact. They never limit sig figs.',
  },
];

export const measurementTopic: Topic = {
  meta: TOPIC_META['b-measurement'],
  summary: 'Every measurement has limited precision. Sig figs, scientific notation, and unit conversions keep your answers honest.',
  learn: [
    { type: 'h', text: 'Significant figures: which digits count?' },
    {
      type: 'list',
      items: [
        'All **nonzero** digits count: 3.45 → 3',
        '**Captive** zeros (between nonzero digits) count: 1005 → 4',
        '**Leading** zeros never count: 0.0045 → 2',
        '**Trailing** zeros count only with a decimal point: 2.50 → 3, but 250 → 2 (and 250. → 3)',
        'In **scientific notation**, all digits in the first number count: 2.50 × 10^{3} → 3',
      ],
    },
    { type: 'h', text: 'Sig figs in calculations' },
    {
      type: 'table',
      head: ['Operation', 'Rule', 'Example'],
      rows: [
        ['× and ÷', 'Fewest **sig figs**', '2.5 × 3.42 = 8.55 → **8.6**'],
        ['+ and −', 'Fewest **decimal places**', '12.11 + 1.3 = 13.41 → **13.4**'],
      ],
    },
    { type: 'tip', text: 'Keep all the digits during a calculation and round only once, at the end.' },
    { type: 'h', text: 'Scientific notation' },
    {
      type: 'p',
      text: 'Write a number as (a number from 1 to 9.99…) × 10^{n}. Big numbers have a positive exponent: 45 600 = 4.56 × 10^{4}. Small numbers have a negative exponent: 0.00032 = 3.2 × 10^{−4}.',
    },
    { type: 'h', text: 'Metric conversions' },
    {
      type: 'table',
      head: ['Prefix', 'kilo- (k)', 'centi- (c)', 'milli- (m)'],
      rows: [['Means', '× 1000', '÷ 100', '÷ 1000']],
    },
    { type: 'p', text: '1 kg = 1000 g · 1 g = 1000 mg · 1 L = 1000 mL · 1 m = 100 cm' },
  ],
  examples: [
    {
      title: 'Counting sig figs',
      problem: 'How many sig figs are in 0.004050?',
      steps: [
        { label: 'Leading zeros', work: '0.00 — don’t count' },
        { label: 'The rest', work: '4, 0 (captive), 5, 0 (trailing after a decimal point) — all count' },
      ],
      answer: '4 sig figs',
    },
    {
      title: 'Multiplying',
      problem: 'Calculate 4.52 × 2.1.',
      steps: [
        { label: 'Calculator', work: '9.492' },
        { label: 'Fewest sig figs', work: '4.52 has 3, 2.1 has 2 → answer gets 2' },
      ],
      answer: '9.5',
    },
    {
      title: 'Converting',
      problem: 'Convert 250. mL to L.',
      steps: [{ label: 'Bigger unit → smaller number', work: '250. ÷ 1000 = 0.250 L' }],
      answer: '0.250 L',
    },
  ],
  stepGuide: [
    'Count sig figs: nonzero and captive zeros count; leading zeros don’t; trailing zeros only with a decimal point.',
    '× and ÷: answer has the fewest sig figs. + and −: answer has the fewest decimal places.',
    'Scientific notation: one nonzero digit before the decimal, × 10 to the number of places moved.',
    'Conversions: to a smaller unit, multiply; to a bigger unit, divide.',
  ],
  practice: [
    { id: 'count', skill: 'counting sig figs', generate: countQ },
    { id: 'round', skill: 'rounding to sig figs', generate: roundQ },
    { id: 'to-sci', skill: 'writing scientific notation', generate: toScientific },
    { id: 'multiply', skill: 'sig figs in × and ÷', generate: multiplyQ },
    { id: 'convert', skill: 'metric conversions', generate: convert },
    { id: 'count-2', skill: 'counting sig figs', generate: countQ },
    { id: 'add', skill: 'precision in + and −', generate: addQ },
    { id: 'to-standard', skill: 'standard notation', generate: toStandard },
    mcTemplate('concepts', 'precision and exact numbers', concepts),
    { id: 'round-2', skill: 'rounding to sig figs', generate: roundQ },
    { id: 'convert-2', skill: 'metric conversions', generate: convert },
    { id: 'count-3', skill: 'counting sig figs', generate: countQ },
  ],
  videos: [],
};
