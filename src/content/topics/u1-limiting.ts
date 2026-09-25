import type { Question, Step, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, mm, sf } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { REACTIONS, coefOf, eq, type Rx } from '../stoich';
import { molarMass } from '../../engine/formula';
import type { Rng } from '../../engine/rng';

const TWO_REACTANTS = REACTIONS.filter((r) => r.reactants.length === 2 && !r.reactants.includes('H2O'));

interface Setup {
  r: Rx;
  A: string;
  B: string;
  nA: number;
  nB: number;
  limiting: string;
  excess: string;
  product: string;
}

/** Amounts chosen so one reactant is clearly limiting. */
function setup(rng: Rng): Setup {
  const r = rng.pick(TWO_REACTANTS);
  const [A, B] = rng.shuffle(r.reactants);
  const a = coefOf(r, A);
  const b = coefOf(r, B);
  const nA = rng.sig(0.2, 3, 3);
  const factor = rng.pick([rng.sig(0.4, 0.8, 2), rng.sig(1.3, 2.2, 2)]);
  const nB = Number(((nA * b) / a * factor).toPrecision(3));
  const limiting = nA / a < nB / b ? A : B;
  const product = r.products.find((p) => p !== 'H2O') ?? r.products[0];
  return { r, A, B, nA, nB, limiting, excess: limiting === A ? B : A, product };
}

function limitingChoice(s: Setup, rng: Rng, needNB: number): Step {
  const opts = rng.shuffle([f(s.A), f(s.B)]);
  return {
    prompt: 'Which reactant is the limiting reagent?',
    answer: { kind: 'choice', options: opts, correct: opts.indexOf(f(s.limiting)) },
    hints: [
      'The limiting reagent runs out first.',
      `Compare what you need with what you have: ${f(s.B)} needed = ${sf(needNB, 3)} mol; you have ${sf(s.nB, 3)} mol.`,
      needNB > s.nB ? `Not enough ${f(s.B)}, so it runs out first.` : `More than enough ${f(s.B)}, so ${f(s.A)} runs out first.`,
    ],
    explain: `${f(s.limiting)} is limiting; ${f(s.excess)} is in excess.`,
  };
}

function fromMoles(rng: Rng): Question {
  const s = setup(rng);
  const need = (s.nA * coefOf(s.r, s.B)) / coefOf(s.r, s.A);
  return {
    prompt: `${s.r.context}: ${eq(s.r)}. A reaction starts with ${given(s.nA, 3)} mol of ${f(s.A)} and ${given(s.nB, 3)} mol of ${f(s.B)}. Which is the limiting reagent?`,
    steps: [
      {
        prompt: `How many moles of ${f(s.B)} would react with all ${given(s.nA, 3)} mol of ${f(s.A)}?`,
        answer: { kind: 'numeric', value: need, unit: `mol [[${s.B}]]` },
        hints: ['Use the mole ratio.', `${coefOf(s.r, s.B)} ${s.B} : ${coefOf(s.r, s.A)} ${s.A}`, `${given(s.nA, 3)} × ${coefOf(s.r, s.B)}/${coefOf(s.r, s.A)} = ?`],
        explain: `${f(s.B)} needed = ${sf(need, 3)} mol`,
      },
      limitingChoice(s, rng, need),
    ],
  };
}

function fromMasses(rng: Rng): Question {
  const s = setup(rng);
  const mA = s.nA * molarMass(s.A);
  const mB = s.nB * molarMass(s.B);
  const mAt = Number(mA.toPrecision(3));
  const mBt = Number(mB.toPrecision(3));
  const nA = mAt / molarMass(s.A);
  const nB = mBt / molarMass(s.B);
  const lim = nA / coefOf(s.r, s.A) < nB / coefOf(s.r, s.B) ? s.A : s.B;
  const nLim = lim === s.A ? nA : nB;
  const nP = (nLim * coefOf(s.r, s.product)) / coefOf(s.r, lim);
  const need = (nA * coefOf(s.r, s.B)) / coefOf(s.r, s.A);
  const sEff = { ...s, nA, nB, limiting: lim, excess: lim === s.A ? s.B : s.A };
  return {
    prompt: `${s.r.context}: ${eq(s.r)}. ${given(mAt, 3)} g of ${f(s.A)} is mixed with ${given(mBt, 3)} g of ${f(s.B)}. What mass of ${f(s.product)} forms?`,
    steps: [
      {
        prompt: `Moles of ${f(s.A)}. (M = ${mm(molarMass(s.A))} g/mol)`,
        answer: { kind: 'numeric', value: nA, unit: 'mol' },
        hints: ['n = m ÷ M', `${given(mAt, 3)} ÷ ${mm(molarMass(s.A))}`, 'Keep an extra digit.'],
        explain: `n(${f(s.A)}) = ${sf(nA, 4)} mol`,
      },
      {
        prompt: `Moles of ${f(s.B)}. (M = ${mm(molarMass(s.B))} g/mol)`,
        answer: { kind: 'numeric', value: nB, unit: 'mol' },
        hints: ['n = m ÷ M', `${given(mBt, 3)} ÷ ${mm(molarMass(s.B))}`, 'Keep an extra digit.'],
        explain: `n(${f(s.B)}) = ${sf(nB, 4)} mol`,
      },
      limitingChoice(sEff, rng, need),
      {
        prompt: `Using the limiting reagent, what mass of ${f(s.product)} forms?`,
        answer: { kind: 'numeric', value: nP * molarMass(s.product), unit: 'g', sigFigs: 3 },
        hints: [
          'The limiting reagent decides how much product forms.',
          `n(${s.product}) = n(${lim}) × ${coefOf(s.r, s.product)}/${coefOf(s.r, lim)}`,
          `Then × ${mm(molarMass(s.product))} g/mol.`,
        ],
        mistakes: [
          {
            value: (((lim === s.A ? nB : nA) * coefOf(s.r, s.product)) / coefOf(s.r, lim === s.A ? s.B : s.A)) * molarMass(s.product),
            message: 'That’s based on the reagent in excess. Use the limiting one: it runs out first.',
          },
        ],
        explain: `n(${f(s.product)}) = ${sf(nLim, 4)} × ${coefOf(s.r, s.product)}/${coefOf(s.r, lim)} = ${sf(nP, 4)} mol → **${sf(nP * molarMass(s.product), 3)} g**`,
      },
    ],
  };
}

function excessLeft(rng: Rng): Question {
  const s = setup(rng);
  const used = s.limiting === s.A ? (s.nA * coefOf(s.r, s.B)) / coefOf(s.r, s.A) : (s.nB * coefOf(s.r, s.A)) / coefOf(s.r, s.B);
  const have = s.excess === s.A ? s.nA : s.nB;
  const left = have - used;
  const need = (s.nA * coefOf(s.r, s.B)) / coefOf(s.r, s.A);
  return {
    prompt: `${s.r.context}: ${eq(s.r)}. You start with ${given(s.nA, 3)} mol of ${f(s.A)} and ${given(s.nB, 3)} mol of ${f(s.B)}. How many moles of the excess reagent are left over?`,
    steps: [
      limitingChoice(s, rng, need),
      {
        prompt: `How many moles of ${f(s.excess)} actually react?`,
        answer: { kind: 'numeric', value: used, unit: 'mol' },
        hints: ['Only as much excess reacts as the limiting reagent allows.', `Use the ratio with the limiting ${f(s.limiting)}.`, `n(${s.excess}) used = n(${s.limiting}) × ${coefOf(s.r, s.excess)}/${coefOf(s.r, s.limiting)}`],
        explain: `${sf(used, 4)} mol of ${f(s.excess)} reacts.`,
      },
      {
        prompt: `Moles of ${f(s.excess)} left over.`,
        answer: { kind: 'numeric', value: left, unit: 'mol', sigFigs: left >= 0.1 ? 3 : 2, tolerance: 0.02 },
        hints: ['Left over = what you had − what reacted.', `${given(have, 3)} − ${sf(used, 4)}`, 'Subtract.'],
        explain: `${given(have, 3)} − ${sf(used, 4)} = **${sf(left, left >= 0.1 ? 3 : 2)} mol** of ${f(s.excess)} left`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'What is the limiting reagent?',
    correct: 'The reactant that runs out first and stops the reaction',
    wrong: ['The reactant with the smaller mass', 'The reactant with the smaller coefficient', 'The product that forms the least'],
    hints: ['Think of making sandwiches with 10 slices of bread and 3 slices of cheese.', 'You stop when something runs out.', 'It limits how much product you can make.'],
    explain: 'The limiting reagent is used up first, so it decides the maximum amount of product.',
  },
  {
    q: 'You have 10 slices of bread and 3 slices of cheese. Each sandwich needs 2 bread and 1 cheese. What limits you?',
    correct: 'The cheese (you can make 3 sandwiches)',
    wrong: ['The bread (you can make 5 sandwiches)', 'Neither: you can make 13 sandwiches', 'Both run out at the same time'],
    hints: ['Bread allows 10 ÷ 2 = 5 sandwiches.', 'Cheese allows 3 ÷ 1 = 3 sandwiches.', 'The smaller number wins.'],
    explain: 'Cheese allows only 3 sandwiches, so it’s limiting; 4 slices of bread are left over (in excess).',
  },
  {
    q: 'Why is one reactant often added in excess on purpose?',
    correct: 'To make sure the more expensive reactant is completely used up',
    wrong: ['To make the reaction slower', 'Because the equation requires it', 'To create more of the excess reactant'],
    hints: ['Think about cost.', 'Cheap reactants can be used generously.', 'Then none of the valuable one is wasted.'],
    explain: 'Using extra of a cheap reactant (like air) ensures the valuable one reacts completely.',
  },
  {
    q: 'Can you find the limiting reagent by comparing the masses of the reactants?',
    correct: 'No: you must compare moles, using the mole ratio',
    wrong: ['Yes: the smaller mass is always limiting', 'Yes: the larger mass is always limiting', 'Only if both are gases'],
    hints: ['Different substances have different molar masses.', 'The recipe is in moles.', 'Convert to moles first.'],
    explain: 'Always convert to moles and use the coefficients. Mass alone can mislead you.',
  },
];

export const limitingTopic: Topic = {
  meta: TOPIC_META['u1-limiting'],
  summary: 'When reactants aren’t in the perfect ratio, one runs out first. It limits the product; the other is left over.',
  learn: [
    {
      type: 'p',
      text: 'Reactants are rarely mixed in exactly the right ratio. The one that runs out first is the **limiting reagent**; it decides how much product forms. The other is the **excess reagent**, and some is left over.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Convert each reactant to **moles**.',
        'Use the mole ratio to find how much of one reactant is needed for the other.',
        'If you have less than you need, that one is limiting.',
        'Calculate the product from the **limiting** reagent only.',
      ],
    },
    { type: 'tip', text: 'Quick check: divide each reactant’s moles by its coefficient. The **smaller** result is the limiting reagent.' },
  ],
  examples: [
    {
      title: 'Find the limiting reagent',
      problem: `${f('N2')} + 3 ${f('H2')} → 2 ${f('NH3')}. You have 2.00 mol N_{2} and 4.50 mol H_{2}. Which is limiting, and how much NH_{3} forms?`,
      steps: [
        { label: 'H₂ needed', work: '2.00 mol N_{2} × 3/1 = 6.00 mol H_{2} needed; only 4.50 mol available' },
        { label: 'Limiting', work: 'H_{2} runs out first → limiting' },
        { label: 'Product', work: '4.50 mol H_{2} × 2/3 = 3.00 mol NH_{3}' },
      ],
      answer: 'H_{2} is limiting; 3.00 mol NH_{3} forms',
    },
  ],
  stepGuide: [
    'Convert each reactant to moles.',
    'Moles ÷ coefficient for each: the smaller is limiting.',
    'Use the limiting reagent for all product calculations.',
    'Excess left = amount you had − amount that reacted.',
  ],
  practice: [
    mcTemplate('concepts', 'the idea of a limiting reagent', concepts),
    { id: 'moles', skill: 'limiting reagent from moles', generate: fromMoles },
    { id: 'masses', skill: 'limiting reagent from masses', generate: fromMasses },
    { id: 'excess', skill: 'excess left over', generate: excessLeft },
    { id: 'moles-2', skill: 'limiting reagent from moles', generate: fromMoles },
    { id: 'masses-2', skill: 'limiting reagent from masses', generate: fromMasses },
    mcTemplate('concepts-2', 'the idea of a limiting reagent', concepts),
    { id: 'excess-2', skill: 'excess left over', generate: excessLeft },
    { id: 'masses-3', skill: 'limiting reagent from masses', generate: fromMasses },
  ],
  videos: [],
};
