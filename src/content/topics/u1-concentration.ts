import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, mm, sf } from '../substances';
import { molarMassStep } from '../molarMassHelpers';
import { molarMass } from '../../engine/formula';
import { mcTemplate, type MCItem } from '../quiz';
import type { Rng } from '../../engine/rng';

const SOLUTES = [
  { formula: 'NaCl', name: 'sodium chloride' },
  { formula: 'KNO3', name: 'potassium nitrate' },
  { formula: 'CuSO4', name: 'copper(II) sulfate' },
  { formula: 'NaOH', name: 'sodium hydroxide' },
  { formula: 'C6H12O6', name: 'glucose' },
  { formula: 'CaCl2', name: 'calcium chloride' },
  { formula: 'KCl', name: 'potassium chloride' },
  { formula: 'NH4NO3', name: 'ammonium nitrate' },
];

const mL = (v: number) => given(v, 3);

function litresStep(vmL: number) {
  return {
    prompt: `Convert ${mL(vmL)} mL to litres.`,
    answer: { kind: 'numeric' as const, value: vmL / 1000, unit: 'L', sigFigs: 3 },
    hints: ['Concentration uses litres.', '1 L = 1000 mL.', `${mL(vmL)} ÷ 1000 = ?`] as [string, string, string],
    mistakes: [{ value: vmL * 1000, message: 'mL → L makes the number smaller: divide by 1000.' }],
    explain: `${mL(vmL)} mL = ${sf(vmL / 1000, 3)} L`,
  };
}

function concFromMoles(rng: Rng): Question {
  const s = rng.pick(SOLUTES);
  const n = measured(rng, 0.02, 0.9, 3);
  const vmL = measured(rng, 100, 900, 3);
  const c = n / (vmL / 1000);
  return {
    prompt: `${given(n, 3)} mol of ${s.name} is dissolved to make ${mL(vmL)} mL of solution. What is its concentration?`,
    steps: [
      litresStep(vmL),
      {
        prompt: 'Calculate the concentration in mol/L.',
        answer: { kind: 'numeric', value: c, unit: 'mol/L', sigFigs: 3 },
        hints: ['c = n ÷ V', 'Moles on top, litres on the bottom.', `${given(n, 3)} ÷ ${sf(vmL / 1000, 3)} = ?`],
        mistakes: [
          { value: n / vmL, message: 'Use litres, not millilitres, for the volume.' },
          { value: (vmL / 1000) / n, message: 'Flip it: c = moles ÷ litres.' },
        ],
        explain: `c = ${given(n, 3)} mol ÷ ${sf(vmL / 1000, 3)} L = **${sf(c, 3)} mol/L**`,
      },
    ],
  };
}

function concFromMass(rng: Rng): Question {
  const s = rng.pick(SOLUTES);
  const m = measured(rng, 1, 60, 3);
  const vmL = measured(rng, 100, 900, 3);
  const M = molarMass(s.formula);
  const n = m / M;
  const c = n / (vmL / 1000);
  return {
    prompt: `${given(m, 3)} g of ${s.name}, ${f(s.formula)}, is dissolved in water to make ${mL(vmL)} mL of solution. What is the concentration?`,
    steps: [
      molarMassStep(s.formula),
      {
        prompt: 'Convert the mass to moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['n = m ÷ M', `${given(m, 3)} ÷ ${mm(M)}`, 'Keep an extra digit for now.'],
        mistakes: [{ value: m * M, message: 'Grams → moles: divide by the molar mass.' }],
        explain: `n = ${given(m, 3)} g ÷ ${mm(M)} g/mol = ${sf(n, 4)} mol`,
      },
      {
        prompt: 'Now the concentration (mol/L).',
        answer: { kind: 'numeric', value: c, unit: 'mol/L', sigFigs: 3 },
        hints: ['c = n ÷ V, with V in litres.', `${mL(vmL)} mL = ${sf(vmL / 1000, 3)} L`, `${sf(n, 4)} ÷ ${sf(vmL / 1000, 3)} = ?`],
        mistakes: [{ value: n / vmL, message: 'Change mL to L first.' }, { value: m / (vmL / 1000), message: 'Use moles, not grams, in c = n ÷ V.' }],
        explain: `c = ${sf(n, 4)} mol ÷ ${sf(vmL / 1000, 3)} L = **${sf(c, 3)} mol/L**`,
      },
    ],
  };
}

function molesFromConc(rng: Rng): Question {
  const s = rng.pick(SOLUTES);
  const c = measured(rng, 0.1, 2.5, 3);
  const vmL = measured(rng, 20, 500, 3);
  const n = c * (vmL / 1000);
  return {
    prompt: `How many moles of ${s.name} are in ${mL(vmL)} mL of a ${given(c, 3)} mol/L solution?`,
    steps: [
      litresStep(vmL),
      {
        prompt: 'Calculate the moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol', sigFigs: 3 },
        hints: ['Rearrange c = n ÷ V.', 'n = c × V', `${given(c, 3)} × ${sf(vmL / 1000, 3)} = ?`],
        mistakes: [{ value: c * vmL, message: 'Use the volume in litres.' }, { value: c / (vmL / 1000), message: 'Multiply: n = c × V.' }],
        explain: `n = ${given(c, 3)} mol/L × ${sf(vmL / 1000, 3)} L = **${sf(n, 3)} mol**`,
      },
    ],
  };
}

function preparation(rng: Rng): Question {
  const s = rng.pick(SOLUTES);
  const c = measured(rng, 0.1, 1.5, 3);
  const vmL = rng.pick([100, 250, 500, 1000]);
  const V = vmL / 1000;
  const M = molarMass(s.formula);
  const n = c * V;
  const m = n * M;
  return {
    prompt: `What mass of ${s.name}, ${f(s.formula)}, is needed to make ${vmL}.0 mL of a ${given(c, 3)} mol/L solution?`,
    steps: [
      {
        prompt: 'How many moles are needed?',
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['n = c × V', `V = ${vmL}.0 mL = ${V.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} L`, `${given(c, 3)} × ${V} = ?`],
        mistakes: [{ value: c * vmL, message: 'Use the volume in litres.' }],
        explain: `n = ${given(c, 3)} mol/L × ${V} L = ${sf(n, 4)} mol`,
      },
      molarMassStep(s.formula),
      {
        prompt: 'What mass should you weigh out?',
        answer: { kind: 'numeric', value: m, unit: 'g', sigFigs: 3 },
        hints: ['m = n × M', 'Moles → grams: multiply.', `${sf(n, 4)} × ${mm(M)} = ?`],
        mistakes: [{ value: n / M, message: 'Moles → grams: multiply by the molar mass.' }],
        explain: `m = ${sf(n, 4)} mol × ${mm(M)} g/mol = **${sf(m, 3)} g**. Dissolve it and add water up to the ${vmL} mL mark in a volumetric flask.`,
      },
    ],
  };
}

function dilutionC2(rng: Rng): Question {
  const c1 = measured(rng, 0.5, 6, 3);
  const v1 = measured(rng, 10, 100, 3);
  const v2 = measured(rng, v1 * 2, v1 * 10, 3);
  const c2 = (c1 * v1) / v2;
  return {
    prompt: `${mL(v1)} mL of a ${given(c1, 3)} mol/L solution is diluted with water to a final volume of ${mL(v2)} mL. What is the new concentration?`,
    steps: [
      {
        prompt: 'Calculate the diluted concentration, c₂.',
        answer: { kind: 'numeric', value: c2, unit: 'mol/L', sigFigs: 3 },
        hints: [
          'Diluting adds water but not solute: the moles stay the same.',
          'c₁V₁ = c₂V₂, so c₂ = c₁V₁ ÷ V₂. (mL is fine here as long as both volumes use mL.)',
          `${given(c1, 3)} × ${mL(v1)} ÷ ${mL(v2)} = ?`,
        ],
        mistakes: [{ value: (c1 * v2) / v1, message: 'Diluting should make it **less** concentrated. Check which volume goes on top.' }],
        explain: `c₂ = ${given(c1, 3)} × ${mL(v1)} ÷ ${mL(v2)} = **${sf(c2, 3)} mol/L**`,
      },
    ],
  };
}

function dilutionV1(rng: Rng): Question {
  const c1 = measured(rng, 2, 18, 3);
  const c2 = measured(rng, 0.1, 1.5, 3);
  const v2 = rng.pick([100, 250, 500, 1000]);
  const v1 = (c2 * v2) / c1;
  return {
    prompt: `How many mL of ${given(c1, 3)} mol/L stock solution do you need to make ${v2}.0 mL of ${given(c2, 3)} mol/L solution?`,
    steps: [
      {
        prompt: 'Calculate the volume of stock needed, V₁.',
        answer: { kind: 'numeric', value: v1, unit: 'mL', sigFigs: 3 },
        hints: ['c₁V₁ = c₂V₂', 'V₁ = c₂V₂ ÷ c₁', `${given(c2, 3)} × ${v2}.0 ÷ ${given(c1, 3)} = ?`],
        mistakes: [{ value: (c1 * v2) / c2, message: 'You need **less** of the concentrated stock than the final volume. Check the formula.' }],
        explain: `V₁ = ${given(c2, 3)} × ${v2}.0 ÷ ${given(c1, 3)} = **${sf(v1, 3)} mL** of stock, then add water up to ${v2} mL.`,
      },
    ],
  };
}

function waterToAdd(rng: Rng): Question {
  const c1 = measured(rng, 1, 5, 3);
  const v1 = measured(rng, 20, 200, 3);
  const c2 = measured(rng, c1 / 5, c1 / 1.5, 3);
  const v2 = (c1 * v1) / c2;
  return {
    prompt: `You have ${mL(v1)} mL of ${given(c1, 3)} mol/L solution. How much water must you add to dilute it to ${given(c2, 3)} mol/L?`,
    steps: [
      {
        prompt: 'First, find the final volume, V₂.',
        answer: { kind: 'numeric', value: v2, unit: 'mL', sigFigs: 3 },
        hints: ['c₁V₁ = c₂V₂', 'V₂ = c₁V₁ ÷ c₂', `${given(c1, 3)} × ${mL(v1)} ÷ ${given(c2, 3)} = ?`],
        explain: `V₂ = ${sf(v2, 3)} mL`,
      },
      {
        prompt: 'How much water is added?',
        answer: { kind: 'numeric', value: v2 - v1, unit: 'mL', tolerance: 0.015 },
        hints: ['The final volume includes the solution you started with.', 'Water added = V₂ − V₁.', `${sf(v2, 3)} − ${mL(v1)} = ?`],
        mistakes: [{ value: v2, message: 'That’s the total final volume. Subtract what you started with.' }],
        explain: `Water added = ${sf(v2, 3)} − ${mL(v1)} = **${sf(v2 - v1, 3)} mL**`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'When a solution is diluted, what stays the same?',
    correct: 'The moles of solute',
    wrong: ['The concentration', 'The volume', 'The mass of the whole solution'],
    hints: ['Diluting means adding solvent (water).', 'No solute is added or removed.', 'That’s why c₁V₁ = c₂V₂ works.'],
    explain: 'Only water is added, so the **moles of solute** don’t change: c₁V₁ = n = c₂V₂.',
  },
  {
    q: 'Which solution is the most concentrated?',
    correct: '0.50 mol dissolved in 0.25 L',
    wrong: ['0.50 mol dissolved in 1.0 L', '1.0 mol dissolved in 4.0 L', '0.10 mol dissolved in 0.50 L'],
    hints: ['Concentration = moles ÷ litres.', 'Work out each one.', 'The biggest mol/L wins.'],
    explain: '0.50 ÷ 0.25 = 2.0 mol/L, the highest. The others are 0.50, 0.25, and 0.20 mol/L.',
  },
  {
    q: 'In salt water, which is the **solvent**?',
    correct: 'water',
    wrong: ['salt', 'the salt water itself', 'the dissolved ions'],
    hints: ['Solute + solvent = solution.', 'The solvent does the dissolving.', 'It’s usually the larger amount.'],
    explain: 'Water is the solvent, salt is the solute, and salt water is the solution.',
  },
  {
    q: 'What does “0.25 mol/L” mean?',
    correct: '0.25 mol of solute in every litre of solution',
    wrong: ['0.25 mol of solute added to 1 L of water', '0.25 g of solute per litre', '0.25 L of solute in 1 mol of water'],
    hints: ['mol/L = moles per litre.', 'The litre is of **solution**, not just water.', 'That’s why you fill a volumetric flask to the line.'],
    explain: 'Molar concentration is moles of solute per litre of **solution**.',
  },
];

export const concentrationTopic: Topic = {
  meta: TOPIC_META['u1-concentration'],
  summary: 'Concentration tells you how much solute is packed into each litre of solution, and dilution spreads it out.',
  learn: [
    { type: 'p', text: 'A **solution** is a **solute** dissolved in a **solvent** (usually water). Its concentration tells you how much solute is in each litre.' },
    { type: 'key', title: 'Molar concentration', text: 'c = n ÷ V, in **mol/L** (moles of solute per litre of solution). Sometimes written M.' },
    {
      type: 'table',
      head: ['To find', 'Use'],
      rows: [
        ['concentration', 'c = n ÷ V'],
        ['moles', 'n = c × V'],
        ['volume', 'V = n ÷ c'],
      ],
    },
    { type: 'tip', text: 'V must be in **litres**: divide mL by 1000. If you’re given grams, change to moles first (n = m ÷ M).' },
    { type: 'h', text: 'Dilution' },
    { type: 'p', text: 'Adding water lowers the concentration but doesn’t change the moles of solute. So the moles before equal the moles after:' },
    { type: 'equation', text: 'c₁V₁ = c₂V₂', caption: 'Both volumes just need the same unit (mL is fine).' },
    {
      type: 'p',
      text: 'To prepare a solution in the lab: calculate the mass (or stock volume) needed, dissolve it in some water in a **volumetric flask**, then add water exactly to the line.',
    },
    { type: 'background', title: 'Grams to moles', text: 'Concentration problems often start with a mass. Review Topic 5 if needed.', topicId: 'u1-mole-conversions' },
  ],
  examples: [
    {
      title: 'Concentration from a mass',
      problem: `5.85 g of ${f('NaCl')} is dissolved to make 250. mL of solution. Find the concentration.`,
      steps: [
        { label: 'Moles', work: 'n = 5.85 g ÷ 58.44 g/mol = 0.1001 mol' },
        { label: 'Litres', work: '250. mL = 0.250 L' },
        { label: 'Concentration', work: 'c = 0.1001 mol ÷ 0.250 L = 0.400 mol/L' },
      ],
      answer: '0.400 mol/L',
    },
    {
      title: 'Dilution',
      problem: 'How much 6.00 mol/L HCl is needed to make 500. mL of 0.300 mol/L HCl?',
      steps: [
        { label: 'Rearrange', work: 'V₁ = c₂V₂ ÷ c₁' },
        { label: 'Calculate', work: '0.300 × 500. ÷ 6.00 = 25.0 mL' },
      ],
      answer: '25.0 mL of stock, diluted to 500. mL (add the acid to water!)',
    },
  ],
  stepGuide: [
    'Write what you know: c, n (or m), V. Change mL to L.',
    'Grams? Convert to moles with M first.',
    'Use c = n ÷ V (or rearrange it).',
    'Dilution: c₁V₁ = c₂V₂. Check that diluting made it less concentrated.',
  ],
  practice: [
    { id: 'c-from-n', skill: 'concentration from moles', generate: concFromMoles },
    { id: 'n-from-c', skill: 'moles from concentration', generate: molesFromConc },
    mcTemplate('concepts', 'solutions vocabulary', concepts),
    { id: 'c-from-m', skill: 'concentration from mass', generate: concFromMass },
    { id: 'prep', skill: 'preparing a solution', generate: preparation },
    { id: 'dil-c2', skill: 'dilution: new concentration', generate: dilutionC2 },
    { id: 'dil-v1', skill: 'dilution: volume of stock', generate: dilutionV1 },
    { id: 'water', skill: 'water to add', generate: waterToAdd },
    { id: 'c-from-m-2', skill: 'concentration from mass', generate: concFromMass },
    mcTemplate('concepts-2', 'solutions vocabulary', concepts),
    { id: 'dil-c2-2', skill: 'dilution: new concentration', generate: dilutionC2 },
    { id: 'prep-2', skill: 'preparing a solution', generate: preparation },
  ],
  videos: [],
};
