import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, mm } from '../substances';
import { molarMass, parseFormula } from '../../engine/formula';
import { breakdown, countsText, molarMassMistakes, molarMassStep } from '../molarMassHelpers';
import { ELEMENT_BY_SYMBOL, massOf } from '../../data/elements';
import type { Rng } from '../../engine/rng';

interface Compound {
  formula: string;
  name: string;
}

const SIMPLE: Compound[] = [
  { formula: 'H2O', name: 'water' },
  { formula: 'CO2', name: 'carbon dioxide' },
  { formula: 'NH3', name: 'ammonia' },
  { formula: 'CH4', name: 'methane' },
  { formula: 'CaCl2', name: 'calcium chloride' },
  { formula: 'Al2O3', name: 'aluminum oxide' },
  { formula: 'H2SO4', name: 'sulfuric acid' },
  { formula: 'C6H12O6', name: 'glucose' },
  { formula: 'NaHCO3', name: 'sodium hydrogen carbonate' },
  { formula: 'KMnO4', name: 'potassium permanganate' },
  { formula: 'Na2CO3', name: 'sodium carbonate' },
  { formula: 'C3H8', name: 'propane' },
];

const BRACKETS: Compound[] = [
  { formula: 'Ca(NO3)2', name: 'calcium nitrate' },
  { formula: 'Mg(OH)2', name: 'magnesium hydroxide' },
  { formula: '(NH4)2SO4', name: 'ammonium sulfate' },
  { formula: 'Al2(SO4)3', name: 'aluminum sulfate' },
  { formula: 'Ca3(PO4)2', name: 'calcium phosphate' },
  { formula: 'Fe(OH)3', name: 'iron(III) hydroxide' },
  { formula: '(NH4)3PO4', name: 'ammonium phosphate' },
  { formula: 'Ba(NO3)2', name: 'barium nitrate' },
];

const HYDRATES: Compound[] = [
  { formula: 'CuSO4·5H2O', name: 'copper(II) sulfate pentahydrate' },
  { formula: 'MgSO4·7H2O', name: 'magnesium sulfate heptahydrate' },
  { formula: 'CaCl2·2H2O', name: 'calcium chloride dihydrate' },
  { formula: 'Na2CO3·10H2O', name: 'sodium carbonate decahydrate' },
];

const ELEMENTS_POOL = ['Fe', 'Cu', 'Na', 'K', 'Ca', 'Mg', 'Al', 'S', 'P', 'Zn', 'Ag', 'Pb', 'Ni', 'Sn'];
const DIATOMIC = [
  { formula: 'O2', name: 'oxygen gas' },
  { formula: 'N2', name: 'nitrogen gas' },
  { formula: 'Cl2', name: 'chlorine gas' },
  { formula: 'H2', name: 'hydrogen gas' },
  { formula: 'Br2', name: 'bromine' },
  { formula: 'I2', name: 'iodine' },
];

const ATOMIC_NUMBER_MISTAKE = 'That’s the atomic number (the whole number at the top). Molar mass is the number with decimals.';

function totalStep(formula: string) {
  return molarMassStep(formula, `Calculate the molar mass of ${f(formula)}.`);
}

function elementMass(rng: Rng): Question {
  const sym = rng.pick(ELEMENTS_POOL);
  const el = ELEMENT_BY_SYMBOL[sym];
  return {
    prompt: `What is the molar mass of ${el.name}, ${f(sym)}?`,
    steps: [
      {
        prompt: `Use the periodic chart to find the molar mass of ${f(sym)}.`,
        answer: { kind: 'numeric', value: el.mass, unit: 'g/mol', decimals: 2, tolerance: 0.002 },
        hints: [
          'Find the element on the periodic chart.',
          'Molar mass is the number with two decimal places, not the whole number.',
          `${el.name} is element number ${el.z}.`,
        ],
        mistakes: [{ value: el.z, message: ATOMIC_NUMBER_MISTAKE }],
        explain: `The chart gives ${f(sym)} = **${mm(el.mass)} g/mol**. One mole of ${el.name} atoms has a mass of ${mm(el.mass)} g.`,
      },
    ],
  };
}

function diatomic(rng: Rng): Question {
  const c = rng.pick(DIATOMIC);
  const sym = c.formula.replace(/\d/g, '');
  const single = massOf(sym);
  return {
    prompt: `What is the molar mass of ${c.name}, ${f(c.formula)}?`,
    steps: [
      {
        prompt: `How many atoms are in one ${f(c.formula)} molecule?`,
        answer: { kind: 'numeric', value: 2, unit: 'atoms', tolerance: 0 },
        hints: ['Look at the subscript.', `${c.name} is **diatomic**: its atoms travel in pairs.`, 'The subscript 2 means two atoms.'],
        explain: `${f(c.formula)} is diatomic, so each molecule has 2 atoms.`,
      },
      {
        ...totalStep(c.formula),
        mistakes: [
          { value: single, message: `That’s the mass of one ${sym} atom. The molecule has two!` },
          { value: ELEMENT_BY_SYMBOL[sym].z * 2, message: ATOMIC_NUMBER_MISTAKE },
        ],
      },
    ],
  };
}

function simpleCompound(rng: Rng): Question {
  const c = rng.pick(SIMPLE);
  const counts = parseFormula(c.formula);
  const el = rng.pick(Object.keys(counts).filter((e) => counts[e] > 1));
  return {
    prompt: `What is the molar mass of ${c.name}, ${f(c.formula)}?`,
    steps: [
      {
        prompt: `How many ${el} atoms are in one ${f(c.formula)}?`,
        answer: { kind: 'numeric', value: counts[el], unit: `${el} atoms`, tolerance: 0 },
        hints: ['Read the subscript right after the symbol.', 'No subscript means 1.', `Find every ${el} in ${f(c.formula)} and add them.`],
        explain: `${f(c.formula)} contains ${countsText(c.formula)}.`,
      },
      totalStep(c.formula),
    ],
  };
}

function bracketCompound(rng: Rng): Question {
  const c = rng.pick(BRACKETS);
  const counts = parseFormula(c.formula);
  const inside = c.formula.match(/\(([^)]*)\)/)![1];
  const el = rng.pick(Object.keys(parseFormula(inside)));
  return {
    prompt: `What is the molar mass of ${c.name}, ${f(c.formula)}?`,
    steps: [
      {
        prompt: `How many ${el} atoms are in one ${f(c.formula)}?`,
        answer: { kind: 'numeric', value: counts[el], unit: `${el} atoms`, tolerance: 0 },
        hints: [
          'The number after a bracket multiplies everything inside.',
          `Count ${el} inside the brackets, then multiply by the number outside.`,
          `In ${f(c.formula)}: (${el} inside) × (number after the bracket).`,
        ],
        mistakes: [
          {
            value: parseFormula(inside)[el],
            message: 'That’s the count inside the brackets. Now multiply by the number after the bracket.',
          },
        ],
        explain: `${f(c.formula)} contains ${countsText(c.formula)}.`,
      },
      totalStep(c.formula),
    ],
    finalMistakes: molarMassMistakes(c.formula),
  };
}

function hydrate(rng: Rng): Question {
  const c = rng.pick(HYDRATES);
  const [salt, waterPart] = c.formula.split('·');
  const waters = Number(waterPart.match(/^\d+/)![0]);
  const Msalt = molarMass(salt);
  const Mtotal = molarMass(c.formula);
  return {
    prompt: `What is the molar mass of ${c.name}, ${f(c.formula)}?`,
    steps: [
      {
        prompt: `First, the molar mass of the salt part, ${f(salt)}.`,
        answer: { kind: 'numeric', value: Msalt, unit: 'g/mol', decimals: 2, tolerance: 0.002 },
        hints: ['Ignore the water for now.', `Count: ${countsText(salt)}.`, `M = ${breakdown(salt)}`],
        mistakes: molarMassMistakes(salt),
        explain: `${f(salt)}: ${breakdown(salt)} = ${mm(Msalt)} g/mol`,
      },
      {
        prompt: `How many water molecules are in one formula unit of ${f(c.formula)}?`,
        answer: { kind: 'numeric', value: waters, unit: `${f('H2O')}`, tolerance: 0 },
        hints: ['Look after the dot.', 'The big number before H_{2}O is a coefficient.', `${c.name.split(' ').pop()} hints at the number, too!`],
        explain: `The ·${waters}H_{2}O means ${waters} water molecules per formula unit.`,
      },
      {
        prompt: `Calculate the molar mass of the whole hydrate.`,
        answer: { kind: 'numeric', value: Mtotal, unit: 'g/mol', decimals: 2, tolerance: 0.002 },
        hints: [
          `Add the salt and the water: ${mm(Msalt)} + ${waters} × (mass of H_{2}O).`,
          `Molar mass of ${f('H2O')} = 18.02 g/mol.`,
          `${mm(Msalt)} + ${waters}(18.02) = ?`,
        ],
        mistakes: [
          { value: Msalt, message: 'Don’t forget the water. It’s part of the crystal, so it counts.' },
          { value: Msalt + 18.02, message: `The ${waters} before H_{2}O means ${waters} water molecules, not one.` },
        ],
        explain: `M = ${mm(Msalt)} + ${waters}(18.02) = **${mm(Mtotal)} g/mol**`,
      },
    ],
  };
}

function unknownElement(rng: Rng): Question {
  const sets = [
    { suffix: 'Cl2', candidates: ['Mg', 'Ca', 'Sr', 'Ba', 'Zn'] },
    { suffix: 'O', candidates: ['Mg', 'Ca', 'Zn', 'Cu', 'Ba'] },
    { suffix: 'Cl', candidates: ['Li', 'Na', 'K', 'Rb', 'Ag'] },
  ];
  const set = rng.pick(sets);
  const options = rng.shuffle(set.candidates).slice(0, 4);
  const answer = rng.pick(options);
  const formula = `${answer}${set.suffix}`;
  const M = molarMass(formula);
  const rest = molarMass(set.suffix);
  const xMass = Math.round((M - rest) * 100) / 100;
  const shown = `X${set.suffix}`;
  return {
    prompt: `An unknown element X forms the compound ${f(shown)}, which has a molar mass of ${mm(M)} g/mol. Which element is X?`,
    steps: [
      {
        prompt: `What is the total molar mass of the known part, ${f(set.suffix)}?`,
        answer: { kind: 'numeric', value: rest, unit: 'g/mol', decimals: 2, tolerance: 0.002 },
        hints: ['Find everything in the formula except X.', `Count: ${countsText(set.suffix)}.`, `M = ${breakdown(set.suffix)}`],
        explain: `${f(set.suffix)} = ${breakdown(set.suffix)} = ${mm(rest)} g/mol`,
      },
      {
        prompt: 'So what is the molar mass of X?',
        answer: { kind: 'numeric', value: xMass, unit: 'g/mol', decimals: 2, tolerance: 0.003 },
        hints: ['Total = X + known part.', 'Subtract the known part from the total.', `${mm(M)} − ${mm(rest)} = ?`],
        explain: `X = ${mm(M)} − ${mm(rest)} = ${mm(xMass)} g/mol`,
      },
      {
        prompt: 'Which element is X?',
        answer: {
          kind: 'choice',
          options: options.map((s) => `${ELEMENT_BY_SYMBOL[s].name} (${s})`),
          correct: options.indexOf(answer),
        },
        hints: ['Look for an element with that molar mass.', 'Check each option on the periodic chart.', `Which option is ${mm(xMass)} g/mol?`],
        explain: `${ELEMENT_BY_SYMBOL[answer].name} has a molar mass of ${mm(massOf(answer))} g/mol, so X is **${answer}** and the compound is ${f(formula)}.`,
      },
    ],
  };
}

function compare(rng: Rng): Question {
  const [a, b] = rng.shuffle([...SIMPLE, ...BRACKETS]).slice(0, 2);
  const Ma = molarMass(a.formula);
  const Mb = molarMass(b.formula);
  const bigger = Ma > Mb ? 0 : 1;
  return {
    prompt: `Which has the larger molar mass: ${f(a.formula)} or ${f(b.formula)}?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: [f(a.formula), f(b.formula)], correct: bigger },
        hints: [
          'Estimate each molar mass using rounded values (H ≈ 1, C ≈ 12, O ≈ 16…).',
          'Heavier elements and more atoms both increase molar mass.',
          `Calculate both: ${f(a.formula)} = ${breakdown(a.formula)}.`,
        ],
        explain: `${f(a.formula)} = ${mm(Ma)} g/mol and ${f(b.formula)} = ${mm(Mb)} g/mol.`,
      },
    ],
  };
}

export const molarMassTopic: Topic = {
  meta: TOPIC_META['u1-molar-mass'],
  summary: 'Molar mass is the mass of one mole of a substance. It links grams you can weigh to moles you can count.',
  learn: [
    {
      type: 'p',
      text: 'You can’t count atoms directly, but you **can** weigh things on a balance. Molar mass is the bridge: it tells you how many grams one mole of a substance has.',
    },
    {
      type: 'key',
      title: 'Molar mass (M)',
      text: 'The mass of one mole of a substance, in **grams per mole (g/mol)**.',
    },
    { type: 'h', text: 'Elements: read it off the chart' },
    {
      type: 'p',
      text: `Each box on the periodic chart shows the molar mass with two decimal places. Carbon is 12.01 g/mol, so one mole of carbon atoms has a mass of 12.01 g.`,
    },
    {
      type: 'background',
      title: 'Reading the periodic chart',
      text: 'The whole number at the top of each box is the **atomic number** (number of protons). The number with decimals is the **molar mass**. Don’t mix them up!',
      topicId: 'b-periodic-table',
    },
    { type: 'h', text: 'Compounds: add up every atom' },
    {
      type: 'list',
      items: [
        'A **subscript** counts the atom right before it: H_{2}O has 2 H and 1 O.',
        'A **subscript after a bracket** multiplies everything inside: Ca(NO_{3})_{2} has 1 Ca, 2 N, and 6 O.',
        'In a **hydrate**, the number before H_{2}O counts whole water molecules: CuSO_{4}·5H_{2}O includes 5 H_{2}O.',
        `**Diatomic elements** exist as pairs: ${f('H2')}, ${f('N2')}, ${f('O2')}, ${f('F2')}, ${f('Cl2')}, ${f('Br2')}, ${f('I2')}. Oxygen gas is 32.00 g/mol, not 16.00.`,
      ],
    },
    {
      type: 'table',
      head: ['Element in Ca(NO_{3})_{2}', 'Count', 'Molar mass', 'Total'],
      rows: [
        ['Ca', '1', '40.08', '40.08'],
        ['N', '1 × 2 = 2', '14.01', '28.02'],
        ['O', '3 × 2 = 6', '16.00', '96.00'],
        ['**Sum**', '', '', '**164.10 g/mol**'],
      ],
    },
    {
      type: 'tip',
      text: 'Use the molar masses from your class periodic chart. Keep **2 decimal places**, the same as the chart.',
    },
  ],
  examples: [
    {
      title: 'A simple molecule',
      problem: `Calculate the molar mass of water, ${f('H2O')}.`,
      steps: [
        { label: 'Count', work: '2 H, 1 O' },
        { label: 'Look up', work: 'H = 1.01 g/mol, O = 16.00 g/mol' },
        { label: 'Add', work: '2(1.01) + 16.00 = 18.02' },
      ],
      answer: '18.02 g/mol',
    },
    {
      title: 'Brackets',
      problem: `Calculate the molar mass of calcium nitrate, ${f('Ca(NO3)2')}.`,
      steps: [
        { label: 'Count', work: '1 Ca, 2 N, 6 O (the 2 multiplies everything in the brackets)' },
        { label: 'Multiply', work: 'Ca: 40.08; N: 2 × 14.01 = 28.02; O: 6 × 16.00 = 96.00' },
        { label: 'Add', work: '40.08 + 28.02 + 96.00 = 164.10' },
      ],
      answer: '164.10 g/mol',
    },
    {
      title: 'A hydrate',
      problem: `Calculate the molar mass of ${f('CuSO4·5H2O')}.`,
      steps: [
        { label: 'Salt', work: `${f('CuSO4')} = 63.55 + 32.07 + 4(16.00) = 159.62` },
        { label: 'Water', work: `5 × ${f('H2O')} = 5(18.02) = 90.10` },
        { label: 'Add', work: '159.62 + 90.10 = 249.72' },
      ],
      answer: '249.72 g/mol',
    },
  ],
  stepGuide: [
    'Count the atoms of each element. Watch for brackets and hydrates.',
    'Look up each element’s molar mass on the periodic chart.',
    'Multiply each molar mass by its count.',
    'Add them up. Write the answer to 2 decimal places in g/mol.',
  ],
  practice: [
    { id: 'element', skill: 'element molar mass', generate: elementMass },
    { id: 'simple-1', skill: 'simple compound', generate: simpleCompound },
    { id: 'diatomic', skill: 'diatomic element', generate: diatomic },
    { id: 'brackets-1', skill: 'compound with brackets', generate: bracketCompound },
    { id: 'simple-2', skill: 'simple compound', generate: simpleCompound },
    { id: 'compare', skill: 'comparing molar masses', generate: compare },
    { id: 'brackets-2', skill: 'compound with brackets', generate: bracketCompound },
    { id: 'hydrate', skill: 'hydrate', generate: hydrate },
    { id: 'unknown', skill: 'identifying an element', generate: unknownElement },
    { id: 'brackets-3', skill: 'compound with brackets', generate: bracketCompound },
  ],
  videos: [
    {
      youtubeId: 'Qflq48Foh2w',
      title: 'How to Calculate Molar Mass Practice Problems',
      channel: 'Tyler DeWitt',
      note: 'Worked practice problems, including brackets. Videos may round molar masses differently. Use your class chart’s values.',
    },
    {
      youtubeId: 'PAqzpZ-nMlg',
      title: 'Worked example: Calculating molar mass and number of moles',
      channel: 'Khan Academy',
      note: 'A short worked example that also previews grams → moles (next topic).',
    },
  ],
};
