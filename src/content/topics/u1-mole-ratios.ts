import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, sf } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { coefOf, eq, pickPair } from '../stoich';
import type { Rng } from '../../engine/rng';

function ratioChoice(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => coefOf(r, a) !== coefOf(r, b));
  const a = coefOf(r, from);
  const b = coefOf(r, to);
  const right = `${b} mol ${f(to)} : ${a} mol ${f(from)}`;
  const opts = rng.shuffle([...new Set([right, `${a} mol ${f(to)} : ${b} mol ${f(from)}`, `1 mol ${f(to)} : 1 mol ${f(from)}`, `${a + b} mol ${f(to)} : ${a} mol ${f(from)}`])]);
  return {
    prompt: `${r.context}: ${eq(r)}. What is the mole ratio of ${f(to)} to ${f(from)}?`,
    steps: [
      {
        prompt: 'Choose the mole ratio.',
        answer: { kind: 'choice', options: opts, correct: opts.indexOf(right) },
        hints: ['The coefficients in a balanced equation are mole ratios.', `Find the coefficient in front of ${f(to)} and in front of ${f(from)}.`, 'No coefficient means 1.'],
        explain: `The coefficients give **${right}**.`,
      },
    ],
  };
}

function moleToMole(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, () => true);
  const a = coefOf(r, from);
  const b = coefOf(r, to);
  const n = measured(rng, 0.1, 9.99, 3);
  const ans = (n * b) / a;
  const reacting = r.reactants.includes(from) ? 'react' : 'are produced';
  const verb = r.reactants.includes(to) ? 'react' : 'are produced';
  return {
    prompt: `${r.context}: ${eq(r)}. If ${given(n, 3)} mol of ${f(from)} ${reacting}, how many moles of ${f(to)} ${verb}?`,
    steps: [
      {
        prompt: `What is the mole ratio of ${f(to)} to ${f(from)}?`,
        answer: { kind: 'numeric', value: b / a, tolerance: 0.005 },
        hints: ['Wanted ÷ given, from the coefficients.', `Coefficient of ${f(to)} = ${b}; of ${f(from)} = ${a}.`, `${b} ÷ ${a} = ?`],
        mistakes: a !== b ? [{ value: a / b, message: 'Flip it: wanted (the one you’re finding) over given.' }] : [],
        explain: `${b} mol ${f(to)} : ${a} mol ${f(from)}`,
      },
      {
        prompt: `Calculate the moles of ${f(to)}.`,
        answer: { kind: 'numeric', value: ans, unit: `mol [[${to}]]`, sigFigs: 3 },
        hints: ['n(wanted) = n(given) × wanted/given', `${given(n, 3)} × ${b}/${a}`, 'Round to the sig figs of the data.'],
        mistakes: a !== b ? [{ value: (n * a) / b, message: 'The ratio is upside down: multiply by wanted over given.' }, { value: n, message: 'The coefficients aren’t 1 : 1 here. Use the mole ratio.' }] : [],
        explain: `n(${f(to)}) = ${given(n, 3)} mol × ${b}/${a} = **${sf(ans, 3)} mol**`,
      },
    ],
  };
}

function howManyNeeded(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => r.reactants.includes(a) && r.reactants.includes(b));
  const a = coefOf(r, from);
  const b = coefOf(r, to);
  const n = measured(rng, 0.2, 8, 3);
  const ans = (n * b) / a;
  return {
    prompt: `${r.context}: ${eq(r)}. How many moles of ${f(to)} are needed to react completely with ${given(n, 3)} mol of ${f(from)}?`,
    steps: [
      {
        prompt: `Moles of ${f(to)} needed.`,
        answer: { kind: 'numeric', value: ans, unit: `mol [[${to}]]`, sigFigs: 3 },
        hints: ['Use the mole ratio from the coefficients.', `${b} ${to} : ${a} ${from}`, `${given(n, 3)} × ${b}/${a} = ?`],
        mistakes: a !== b ? [{ value: (n * a) / b, message: 'Upside-down ratio: wanted over given.' }] : [],
        explain: `${given(n, 3)} × ${b}/${a} = **${sf(ans, 3)} mol** of ${f(to)}`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: `In 2 ${f('H2')} + ${f('O2')} → 2 ${f('H2O')}, what does the coefficient 2 in front of ${f('H2')} mean?`,
    correct: '2 mol (or 2 molecules) of H_{2}',
    wrong: ['2 g of H_{2}', '2 atoms of H', '2 L of H_{2} at any conditions'],
    hints: ['Coefficients count particles.', 'They also count moles.', 'They do **not** give masses.'],
    explain: 'Coefficients are ratios of particles, and therefore of **moles**. They don’t give masses directly.',
  },
  {
    q: 'Why can’t you use the coefficients as a **mass** ratio?',
    correct: 'Different substances have different molar masses',
    wrong: ['Mass isn’t conserved in reactions', 'Coefficients are always 1', 'Only gases follow coefficients'],
    hints: ['1 mol of H_{2} and 1 mol of O_{2} have different masses.', 'Coefficients count particles.', 'To get masses, convert through molar mass.'],
    explain: '1 mol H_{2} = 2.02 g but 1 mol O_{2} = 32.00 g. Always convert to moles before using a ratio.',
  },
  {
    q: 'What is the first step in almost every stoichiometry problem?',
    correct: 'Write a balanced chemical equation',
    wrong: ['Convert everything to grams', 'Multiply by Avogadro’s number', 'Add all the masses together'],
    hints: ['Mole ratios come from somewhere.', 'An unbalanced equation gives wrong ratios.', 'Balanced…'],
    explain: 'Mole ratios only work from a **balanced** equation.',
  },
];

export const moleRatiosTopic: Topic = {
  meta: TOPIC_META['u1-mole-ratios'],
  summary: 'The coefficients in a balanced equation are mole ratios: the recipe for how many moles react and form.',
  learn: [
    {
      type: 'p',
      text: `A balanced equation is a recipe. In ${f('N2')} + 3 ${f('H2')} → 2 ${f('NH3')}, 1 mol of N_{2} reacts with 3 mol of H_{2} to make 2 mol of NH_{3}.`,
    },
    { type: 'key', title: 'Mole ratio', text: 'The ratio of coefficients between any two substances in a **balanced** equation.' },
    { type: 'equation', text: 'n(wanted) = n(given) × (coefficient wanted ÷ coefficient given)' },
    {
      type: 'tip',
      text: 'Coefficients are ratios of **moles**, not grams. Convert masses to moles before using a ratio (that’s Topic 15).',
    },
    { type: 'background', title: 'Balancing', text: 'The ratios only work if the equation is balanced.', topicId: 'u1-reactions' },
  ],
  examples: [
    {
      title: 'Mole to mole',
      problem: `${f('N2')} + 3 ${f('H2')} → 2 ${f('NH3')}. How many moles of NH_{3} form from 4.50 mol of H_{2}?`,
      steps: [
        { label: 'Ratio', work: '2 mol NH_{3} : 3 mol H_{2}' },
        { label: 'Multiply', work: '4.50 mol × 2/3 = 3.00 mol' },
      ],
      answer: '3.00 mol NH_{3}',
    },
  ],
  stepGuide: ['Balance the equation.', 'Ratio = coefficient wanted ÷ coefficient given.', 'n(wanted) = n(given) × ratio.', 'Round to the data’s sig figs.'],
  practice: [
    { id: 'ratio', skill: 'reading mole ratios', generate: ratioChoice },
    { id: 'mol-mol', skill: 'mole-to-mole', generate: moleToMole },
    mcTemplate('concepts', 'what coefficients mean', concepts),
    { id: 'needed', skill: 'moles needed to react', generate: howManyNeeded },
    { id: 'mol-mol-2', skill: 'mole-to-mole', generate: moleToMole },
    { id: 'ratio-2', skill: 'reading mole ratios', generate: ratioChoice },
    { id: 'mol-mol-3', skill: 'mole-to-mole', generate: moleToMole },
    { id: 'needed-2', skill: 'moles needed to react', generate: howManyNeeded },
    mcTemplate('concepts-2', 'what coefficients mean', concepts),
    { id: 'mol-mol-4', skill: 'mole-to-mole', generate: moleToMole },
  ],
  videos: [],
};
