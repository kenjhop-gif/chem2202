import type { Question, Step, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, mm } from '../substances';
import { molarMassStep } from '../molarMassHelpers';
import { molarMass, parseFormula } from '../../engine/formula';
import { formatDecimals } from '../../engine/numeric';
import { massOf } from '../../data/elements';
import type { Rng } from '../../engine/rng';

/** Real compounds whose formula is already empirical (subscripts share no common factor). */
const EMPIRICAL_POOL = ['Fe2O3', 'P2O5', 'N2O5', 'C3H8', 'SO3', 'NO2', 'CH2O', 'C2H6O', 'KNO3', 'Na2SO4', 'CH4', 'Al2O3', 'MgCl2', 'Cu2O', 'C2H5'];

const MOLECULAR_POOL = [
  { emp: 'CH2O', mol: 'C6H12O6', name: 'glucose' },
  { emp: 'CH', mol: 'C6H6', name: 'benzene' },
  { emp: 'NO2', mol: 'N2O4', name: 'dinitrogen tetroxide' },
  { emp: 'C2H5', mol: 'C4H10', name: 'butane' },
  { emp: 'P2O5', mol: 'P4O10', name: 'tetraphosphorus decoxide' },
  { emp: 'HO', mol: 'H2O2', name: 'hydrogen peroxide' },
  { emp: 'CH2O', mol: 'C2H4O2', name: 'acetic acid' },
  { emp: 'CH2', mol: 'C3H6', name: 'propene' },
  { emp: 'C2H3O', mol: 'C4H6O2', name: 'a compound' },
];

const n2 = (n: number) => formatDecimals(n, 2);
const n3 = (n: number) => formatDecimals(n, 3);

/** Smallest whole number that turns every ratio into (nearly) a whole number. */
function multiplierFor(ratios: number[]): number {
  for (let k = 1; k <= 6; k++) {
    if (ratios.every((r) => Math.abs(r * k - Math.round(r * k)) < 0.1)) return k;
  }
  return 1;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

/**
 * The shared method: amounts of each element → moles → ÷ smallest → × to whole numbers → formula.
 * `amounts` are grams (for % data, the grams in an assumed 100 g sample).
 */
function empiricalSteps(target: string, amounts: Record<string, number>, fromPercent: boolean): Step[] {
  const els = Object.keys(parseFormula(target));
  const moles = els.map((e) => amounts[e] / massOf(e));
  const smallestIdx = moles.indexOf(Math.min(...moles));
  const ratios = moles.map((m) => m / moles[smallestIdx]);
  const k = multiplierFor(ratios);
  const nonWhole = ratios.map((r, i) => ({ r, i })).filter(({ r }) => Math.abs(r - Math.round(r)) >= 0.1);
  const focus = (nonWhole.length ? nonWhole : ratios.map((r, i) => ({ r, i }))).reduce((a, b) => (b.r > a.r ? b : a));
  const fe = els[focus.i];
  const smallEl = els[smallestIdx];

  const steps: Step[] = els.map((e, i) => ({
    prompt: fromPercent
      ? `Assume a 100 g sample, so ${n2(amounts[e])}% ${e} becomes ${n2(amounts[e])} g. How many **moles** of ${e} is that?`
      : `How many **moles** of ${e} are in ${given(amounts[e], 3)} g?`,
    answer: { kind: 'numeric', value: moles[i], unit: `mol ${e}`, tolerance: 0.01 },
    hints: ['Grams → moles.', `n = m ÷ M, with M(${e}) = ${mm(massOf(e))} g/mol.`, `${fromPercent ? n2(amounts[e]) : given(amounts[e], 3)} ÷ ${mm(massOf(e))} = ?`],
    mistakes: [{ value: amounts[e] * massOf(e), message: 'Grams → moles means dividing by the molar mass.' }],
    explain: `n(${e}) = ${fromPercent ? n2(amounts[e]) : given(amounts[e], 3)} g ÷ ${mm(massOf(e))} g/mol = ${n3(moles[i])} mol`,
  }));

  steps.push({
    prompt: `Divide every mole amount by the smallest one (${smallEl}: ${n3(moles[smallestIdx])} mol). What ratio do you get for **${fe}**?`,
    answer: { kind: 'numeric', value: ratios[focus.i], tolerance: 0.02 },
    hints: [
      'The element with the fewest moles becomes 1.',
      `Ratio for ${fe} = moles of ${fe} ÷ moles of ${smallEl}.`,
      `${n3(moles[focus.i])} ÷ ${n3(moles[smallestIdx])} = ?`,
    ],
    mistakes: [{ value: 1 / ratios[focus.i], message: 'Divide by the **smallest** amount, so the ratios come out 1 or bigger.' }],
    explain: `Ratios: ${els.map((e, i) => `${e} = ${n2(ratios[i])}`).join(', ')}`,
  });

  if (k > 1) {
    const options = ['×1 (they’re already whole numbers)', '×2', '×3', '×4'];
    steps.push({
      prompt: 'Not all the ratios are whole numbers. What should you multiply every ratio by?',
      answer: { kind: 'choice', options, correct: k - 1 },
      hints: [
        'Don’t round a number like 1.5 or 2.33. Multiply instead.',
        'Endings: .5 → ×2, .33 or .67 → ×3, .25 or .75 → ×4.',
        `Look at ${fe}: ${n2(ratios[focus.i])}. Which multiplier makes it a whole number?`,
      ],
      explain: `× ${k}: ${els.map((e, i) => `${e} = ${n2(ratios[i])} × ${k} = ${Math.round(ratios[i] * k)}`).join(', ')}`,
    });
  }

  const whole = els.map((_, i) => Math.round(ratios[i] * k));
  // Guard: the data must lead back to the target formula (caught by content tests).
  const targetCounts = parseFormula(target);
  if (els.some((e, i) => whole[i] !== targetCounts[e])) throw new Error(`Empirical data for ${target} gives ${whole.join(':')}`);
  steps.push({
    prompt: 'Write the empirical formula.',
    answer: { kind: 'formula', formula: target, anyOrder: true },
    hints: [
      'The whole-number ratios become the subscripts.',
      'A ratio of 1 means no subscript.',
      `Whole numbers: ${els.map((e, i) => `${e} = ${whole[i]}`).join(', ')}.`,
    ],
    explain: `Empirical formula: **${f(target)}**`,
  });
  return steps;
}

function percentsFor(formula: string): Record<string, number> {
  const counts = parseFormula(formula);
  const M = molarMass(formula);
  return Object.fromEntries(Object.entries(counts).map(([e, n]) => [e, Math.round(((n * massOf(e)) / M) * 10000) / 100]));
}

function percentText(p: Record<string, number>): string {
  return Object.entries(p)
    .map(([e, v]) => `${n2(v)}% ${e}`)
    .join(', ');
}

function empiricalFromPercent(rng: Rng): Question {
  const target = rng.pick(EMPIRICAL_POOL);
  const p = percentsFor(target);
  return {
    prompt: `A compound is ${percentText(p)} by mass. What is its empirical formula?`,
    steps: empiricalSteps(target, p, true),
  };
}

function empiricalFromMasses(rng: Rng): Question {
  const target = rng.pick(EMPIRICAL_POOL.filter((x) => Object.keys(parseFormula(x)).length === 2));
  const counts = parseFormula(target);
  const [a, b] = Object.keys(counts);
  const ma = measured(rng, 1, 20, 3);
  const mb = Number(((ma * counts[b] * massOf(b)) / (counts[a] * massOf(a))).toPrecision(3));
  return {
    prompt: `In a lab, ${given(ma, 3)} g of ${a} combines completely with ${given(mb, 3)} g of ${b}. What is the empirical formula of the product?`,
    steps: empiricalSteps(target, { [a]: ma, [b]: mb }, false),
  };
}

function simplify(rng: Rng): Question {
  const c = rng.pick(MOLECULAR_POOL);
  const counts = parseFormula(c.mol);
  const g = Object.values(counts).reduce(gcd);
  return {
    prompt: `The molecular formula of ${c.name} is ${f(c.mol)}. What is its empirical formula?`,
    steps: [
      {
        prompt: 'What is the largest number that divides into every subscript?',
        answer: { kind: 'numeric', value: g, tolerance: 0 },
        hints: [
          'The empirical formula is the simplest whole-number ratio.',
          `List the subscripts: ${Object.values(counts).join(', ')}.`,
          'Find the greatest common factor of those numbers.',
        ],
        explain: `Every subscript divides by ${g}.`,
      },
      {
        prompt: 'Write the empirical formula.',
        answer: { kind: 'formula', formula: c.emp, anyOrder: true },
        hints: ['Divide each subscript by that number.', 'A subscript of 1 isn’t written.', `${Object.entries(counts).map(([e, n]) => `${e}: ${n} ÷ ${g} = ${n / g}`).join(', ')}`],
        mistakes: [{ formula: c.mol, message: 'That’s the molecular formula. Reduce it to the simplest ratio.' }],
        explain: `${f(c.mol)} ÷ ${g} → **${f(c.emp)}**`,
      },
    ],
  };
}

function molecularSteps(emp: string, mol: string): Step[] {
  const Me = molarMass(emp);
  const Mm = molarMass(mol);
  const n = Math.round(Mm / Me);
  return [
    molarMassStep(emp, `Find the molar mass of the empirical formula, ${f(emp)}.`),
    {
      prompt: 'How many empirical units fit into the molecular formula?',
      answer: { kind: 'numeric', value: n, tolerance: 0.03 },
      hints: [
        'Compare the real molar mass with the empirical formula’s molar mass.',
        'n = molar mass of the compound ÷ molar mass of the empirical formula.',
        `${mm(Mm)} ÷ ${mm(Me)} = ?`,
      ],
      mistakes: [{ value: Me / Mm, message: 'Divide the other way: compound ÷ empirical.' }],
      explain: `n = ${mm(Mm)} ÷ ${mm(Me)} = ${n}`,
    },
    {
      prompt: 'Write the molecular formula.',
      answer: { kind: 'formula', formula: mol, anyOrder: true },
      hints: [
        `Multiply every subscript in ${f(emp)} by ${n}.`,
        'Remember: no subscript means 1.',
        Object.entries(parseFormula(emp))
          .map(([e, c]) => `${e}: ${c} × ${n} = ${c * n}`)
          .join(', '),
      ],
      mistakes: [{ formula: emp, message: `That’s the empirical formula. Multiply its subscripts by ${n}.` }],
      explain: `${f(emp)} × ${n} = **${f(mol)}**`,
    },
  ];
}

function molecularFromEmpirical(rng: Rng): Question {
  const c = rng.pick(MOLECULAR_POOL);
  return {
    prompt: `A compound has the empirical formula ${f(c.emp)} and a molar mass of ${mm(molarMass(c.mol))} g/mol. What is its molecular formula?`,
    steps: molecularSteps(c.emp, c.mol),
  };
}

function fullProblem(rng: Rng): Question {
  const c = rng.pick(MOLECULAR_POOL.filter((x) => ['C6H12O6', 'C6H6', 'C4H10', 'N2O4', 'H2O2'].includes(x.mol)));
  const p = percentsFor(c.emp);
  return {
    prompt: `A compound is ${percentText(p)} by mass, and its molar mass is ${mm(molarMass(c.mol))} g/mol. Find its molecular formula.`,
    steps: [...empiricalSteps(c.emp, p, true), ...molecularSteps(c.emp, c.mol)],
  };
}

function concept(rng: Rng): Question {
  const cases = [
    {
      q: `Which pair of compounds has the **same** empirical formula?`,
      options: [`${f('C2H4')} and ${f('C3H6')}`, `${f('CO')} and ${f('CO2')}`, `${f('H2O')} and ${f('H2O2')}`, `${f('CH4')} and ${f('C2H6')}`],
      correct: 0,
      explain: `${f('C2H4')} and ${f('C3H6')} both reduce to ${f('CH2')}.`,
    },
    {
      q: `A compound’s molecular formula is ${f('C12H22O11')} (sucrose). What is its empirical formula?`,
      options: [f('C12H22O11'), f('C6H11O5'), f('CH2O'), f('C2H4O2')],
      correct: 0,
      explain: 'The subscripts 12, 22, and 11 share no common factor, so the empirical and molecular formulas are the same.',
    },
    {
      q: 'When finding an empirical formula from percentages, why do we assume a 100 g sample?',
      options: [
        'So each percentage turns directly into grams',
        'Because every sample weighs 100 g',
        'So the moles always come out as whole numbers',
        'Because molar masses are measured per 100 g',
      ],
      correct: 0,
      explain: '100 g makes the math easy: 40.0% becomes 40.0 g. Any sample size would give the same ratio.',
    },
  ];
  const c = rng.pick(cases);
  const order = rng.shuffle([0, 1, 2, 3]);
  return {
    prompt: c.q,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: order.map((i) => c.options[i]), correct: order.indexOf(c.correct) },
        hints: [
          'The empirical formula is the simplest whole-number ratio of atoms.',
          'Try dividing each formula’s subscripts by their greatest common factor.',
          'Compare what’s left.',
        ],
        explain: c.explain,
      },
    ],
  };
}

export const empiricalMolecularTopic: Topic = {
  meta: TOPIC_META['u1-empirical-molecular'],
  summary: 'The empirical formula is the simplest ratio of atoms; the molecular formula is the actual number in each molecule.',
  learn: [
    {
      type: 'p',
      text: `Glucose is ${f('C6H12O6')}. Divide every subscript by 6 and you get ${f('CH2O')}: the same ratio of atoms (1 : 2 : 1) in its simplest form.`,
    },
    {
      type: 'table',
      head: ['', 'Meaning', 'Glucose'],
      rows: [
        ['**Empirical formula**', 'Simplest whole-number ratio of atoms', f('CH2O')],
        ['**Molecular formula**', 'Actual number of each atom in one molecule', f('C6H12O6')],
      ],
    },
    { type: 'h', text: 'Finding the empirical formula' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Grams.** If you’re given percentages, assume a 100 g sample so each % becomes grams.',
        '**Moles.** Divide each mass by that element’s molar mass.',
        '**Divide by the smallest.** Divide every mole amount by the smallest one.',
        '**Whole numbers.** If a ratio ends in .5, multiply everything by 2; .33 or .67 → ×3; .25 or .75 → ×4.',
        '**Write it.** The whole numbers are the subscripts.',
      ],
    },
    {
      type: 'tip',
      text: 'Never round 1.5 to 2 or 2.33 to 2. Only round numbers that are very close to whole (like 1.98 → 2), which come from rounding in the data.',
    },
    { type: 'h', text: 'From empirical to molecular' },
    { type: 'equation', text: 'n = M_{compound} ÷ M_{empirical}', caption: 'Then multiply every subscript in the empirical formula by n.' },
    {
      type: 'p',
      text: `Example: ${f('CH2O')} has M = 30.03 g/mol. If the compound’s molar mass is 180.18 g/mol, n = 6, so the molecular formula is ${f('C6H12O6')}.`,
    },
    {
      type: 'background',
      title: 'Grams to moles',
      text: 'Every empirical formula problem starts by turning grams into moles (n = m ÷ M).',
      topicId: 'u1-mole-conversions',
    },
  ],
  examples: [
    {
      title: 'Empirical formula from percentages',
      problem: 'A compound is 69.94% Fe and 30.06% O by mass. Find its empirical formula.',
      steps: [
        { label: 'Grams (100 g sample)', work: '69.94 g Fe, 30.06 g O' },
        { label: 'Moles', work: 'Fe: 69.94 ÷ 55.85 = 1.252 mol. O: 30.06 ÷ 16.00 = 1.879 mol' },
        { label: 'Divide by smallest', work: 'Fe: 1.252 ÷ 1.252 = 1. O: 1.879 ÷ 1.252 = 1.50' },
        { label: 'Whole numbers', work: '1.50 ends in .5, so × 2: Fe = 2, O = 3' },
      ],
      answer: `${f('Fe2O3')}`,
    },
    {
      title: 'Molecular formula',
      problem: `A compound has the empirical formula ${f('CH')} and a molar mass of 78.12 g/mol. Find its molecular formula.`,
      steps: [
        { label: 'Empirical molar mass', work: '12.01 + 1.01 = 13.02 g/mol' },
        { label: 'n', work: '78.12 ÷ 13.02 = 6' },
        { label: 'Multiply', work: 'C_{1×6}H_{1×6}' },
      ],
      answer: `${f('C6H6')} (benzene)`,
    },
  ],
  stepGuide: [
    'Percentages → grams (assume 100 g). Masses given? Use them as they are.',
    'Grams → moles for each element (÷ molar mass).',
    'Divide every mole amount by the smallest.',
    'Multiply to clear decimals: .5 → ×2, .33/.67 → ×3, .25/.75 → ×4.',
    'Write the empirical formula using the whole numbers as subscripts.',
    'For the molecular formula: n = M(compound) ÷ M(empirical), then multiply every subscript by n.',
  ],
  practice: [
    { id: 'emp-percent', skill: 'empirical formula from %', generate: empiricalFromPercent },
    { id: 'simplify', skill: 'molecular → empirical', generate: simplify },
    { id: 'emp-masses', skill: 'empirical formula from lab masses', generate: empiricalFromMasses },
    { id: 'emp-percent-2', skill: 'empirical formula from %', generate: empiricalFromPercent },
    { id: 'molecular', skill: 'molecular formula', generate: molecularFromEmpirical },
    { id: 'concept', skill: 'empirical vs molecular', generate: concept },
    { id: 'emp-masses-2', skill: 'empirical formula from lab masses', generate: empiricalFromMasses },
    { id: 'molecular-2', skill: 'molecular formula', generate: molecularFromEmpirical },
    { id: 'full', skill: 'from % all the way to molecular', generate: fullProblem },
    { id: 'emp-percent-3', skill: 'empirical formula from %', generate: empiricalFromPercent },
  ],
  videos: [
    {
      youtubeId: 'bmjg7lq4m4o',
      title: 'Empirical, molecular, and structural formulas',
      channel: 'Khan Academy',
      note: 'What each kind of formula tells you.',
    },
    {
      youtubeId: '1OfgWe-O3a4',
      title: 'Empirical and Molecular Formulas from Percent Composition',
      channel: 'mommachem',
      note: 'The full method from percentages to the molecular formula. Use your class chart’s molar masses.',
    },
  ],
};
