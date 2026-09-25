import type { NumericAnswer, Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, mm, sf } from '../substances';
import { molarMassStep } from '../molarMassHelpers';
import { molarMass, parseFormula } from '../../engine/formula';
import { formatDecimals } from '../../engine/numeric';
import { ELEMENT_BY_SYMBOL, massOf } from '../../data/elements';
import type { Rng } from '../../engine/rng';

interface Compound {
  formula: string;
  name: string;
}

const COMPOUNDS: Compound[] = [
  { formula: 'H2O', name: 'water' },
  { formula: 'CO2', name: 'carbon dioxide' },
  { formula: 'NH3', name: 'ammonia' },
  { formula: 'CH4', name: 'methane' },
  { formula: 'NaCl', name: 'sodium chloride' },
  { formula: 'CaCO3', name: 'calcium carbonate' },
  { formula: 'Fe2O3', name: 'iron(III) oxide' },
  { formula: 'Al2O3', name: 'aluminum oxide' },
  { formula: 'C6H12O6', name: 'glucose' },
  { formula: 'H2SO4', name: 'sulfuric acid' },
  { formula: 'KNO3', name: 'potassium nitrate' },
  { formula: 'Ca(OH)2', name: 'calcium hydroxide' },
  { formula: 'C3H8', name: 'propane' },
  { formula: 'NaHCO3', name: 'sodium hydrogen carbonate' },
];

const BINARY = COMPOUNDS.filter((c) => Object.keys(parseFormula(c.formula)).length === 2);

const HYDRATES: Compound[] = [
  { formula: 'CuSO4·5H2O', name: 'copper(II) sulfate pentahydrate' },
  { formula: 'MgSO4·7H2O', name: 'magnesium sulfate heptahydrate' },
  { formula: 'CaCl2·2H2O', name: 'calcium chloride dihydrate' },
  { formula: 'Na2CO3·10H2O', name: 'sodium carbonate decahydrate' },
  { formula: 'BaCl2·2H2O', name: 'barium chloride dihydrate' },
];

const pct = (n: number) => formatDecimals(n, 2);

function pctAnswer(value: number): NumericAnswer {
  return { kind: 'numeric', value, unit: '%', decimals: 2, showRoundingNote: false, tolerance: 0.005 };
}

/** % by mass of an element in a formula, using the 2-decimal molar mass students calculate. */
function percentOf(formula: string, el: string): number {
  return ((parseFormula(formula)[el] * massOf(el)) / molarMass(formula)) * 100;
}

function elementMassStep(formula: string, el: string) {
  const k = parseFormula(formula)[el];
  const m = k * massOf(el);
  return {
    prompt: `What mass of ${el} is in **one mole** of ${f(formula)}?`,
    answer: { kind: 'numeric' as const, value: m, unit: 'g', decimals: 2, showRoundingNote: false, tolerance: 0.002 },
    hints: [
      `How many ${el} atoms are in the formula?`,
      `Multiply the molar mass of ${el} by its subscript.`,
      `${k} × ${mm(massOf(el))} = ?`,
    ] as [string, string, string],
    mistakes: k > 1 ? [{ value: massOf(el), message: `That’s one ${el} atom. The formula has ${k}, so multiply by ${k}.` }] : [],
    explain: `${k} × ${mm(massOf(el))} g/mol = ${mm(m)} g of ${el} per mole`,
  };
}

function percentStep(formula: string, el: string) {
  const k = parseFormula(formula)[el];
  const m = k * massOf(el);
  const M = molarMass(formula);
  const p = percentOf(formula, el);
  return {
    prompt: `Calculate the percent by mass of ${el} in ${f(formula)}.`,
    answer: pctAnswer(p),
    hints: [
      'Percent = part ÷ whole × 100.',
      `The part is the mass of ${el}; the whole is the molar mass of ${f(formula)}.`,
      `${mm(m)} ÷ ${mm(M)} × 100 = ?`,
    ] as [string, string, string],
    mistakes: [
      { value: (M / m) * 100, message: 'You divided the wrong way. Put the part (the element) on top: part ÷ whole.' },
      { value: m / M, message: 'Almost! Now multiply by 100 to turn it into a percent.' },
      ...(k > 1 ? [{ value: (massOf(el) / M) * 100, message: `You used only one ${el}. The formula has ${k}.` }] : []),
    ],
    explain: `% ${el} = ${mm(m)} ÷ ${mm(M)} × 100 = **${pct(p)}%**`,
  };
}

function percentFromFormula(rng: Rng): Question {
  const c = rng.pick(COMPOUNDS);
  const el = rng.pick(Object.keys(parseFormula(c.formula)));
  return {
    prompt: `What is the percent by mass of ${ELEMENT_BY_SYMBOL[el].name} in ${c.name}, ${f(c.formula)}?`,
    steps: [molarMassStep(c.formula), elementMassStep(c.formula, el), percentStep(c.formula, el)],
  };
}

function otherPercent(rng: Rng): Question {
  const c = rng.pick(BINARY);
  const [a, b] = rng.shuffle(Object.keys(parseFormula(c.formula)));
  const pa = percentOf(c.formula, a);
  const pb = 100 - pa;
  return {
    prompt: `${c.name[0].toUpperCase() + c.name.slice(1)}, ${f(c.formula)}, is ${pct(pa)}% ${a} by mass. What percent is ${b}?`,
    steps: [
      {
        prompt: `Find the percent of ${b}.`,
        answer: pctAnswer(pb),
        hints: [
          'The compound only contains two elements.',
          'All the percentages in a compound add up to 100%.',
          `100 − ${pct(pa)} = ?`,
        ],
        explain: `The percentages must add to 100%: 100 − ${pct(pa)} = **${pct(pb)}%** ${b}. (Check: ${pct(percentOf(c.formula, b))}% from the formula ✓)`,
      },
    ],
  };
}

function fromLabMasses(rng: Rng): Question {
  const c = rng.pick(COMPOUNDS);
  const el = rng.pick(Object.keys(parseFormula(c.formula)));
  const sample = measured(rng, 2, 50, 3);
  const part = Number((sample * (percentOf(c.formula, el) / 100)).toPrecision(3));
  const p = (part / sample) * 100;
  return {
    prompt: `In a lab, a ${given(sample, 3)} g sample of ${f(c.formula)} is found to contain ${given(part, 3)} g of ${el}. What is the percent by mass of ${el}?`,
    steps: [
      {
        prompt: `Calculate the percent by mass of ${el}.`,
        answer: { kind: 'numeric', value: p, unit: '%', sigFigs: 3 },
        hints: [
          'Percent = part ÷ whole × 100.',
          `The part is ${given(part, 3)} g of ${el}; the whole is the ${given(sample, 3)} g sample.`,
          `${given(part, 3)} ÷ ${given(sample, 3)} × 100 = ?`,
        ],
        mistakes: [
          { value: (sample / part) * 100, message: 'Put the part (the element) on top: part ÷ whole.' },
          { value: part / sample, message: 'Now multiply by 100 to get a percent.' },
        ],
        explain: `% ${el} = ${given(part, 3)} g ÷ ${given(sample, 3)} g × 100 = **${sf(p, 3)}%**. (The formula predicts ${pct(percentOf(c.formula, el))}%.)`,
      },
    ],
  };
}

function decomposition(rng: Rng): Question {
  const c = rng.pick(BINARY);
  const [a, b] = Object.keys(parseFormula(c.formula));
  const sample = measured(rng, 5, 60, 3);
  const ma = Number((sample * (percentOf(c.formula, a) / 100)).toPrecision(3));
  const mb = sample - ma;
  const pb = (mb / sample) * 100;
  return {
    prompt: `A ${given(sample, 3)} g sample of ${f(c.formula)} is broken down into its elements, giving ${given(ma, 3)} g of ${a}. What is the percent by mass of ${b}?`,
    steps: [
      {
        prompt: `First, what mass of ${b} was in the sample?`,
        answer: { kind: 'numeric', value: mb, unit: 'g', tolerance: 0.01 },
        hints: ['Mass is conserved: the elements add up to the sample.', `Mass of ${b} = sample − mass of ${a}.`, `${given(sample, 3)} − ${given(ma, 3)} = ?`],
        explain: `${given(sample, 3)} g − ${given(ma, 3)} g = ${formatDecimals(mb, 2)} g of ${b}`,
      },
      {
        prompt: `Now the percent by mass of ${b}.`,
        answer: pctAnswer(pb),
        hints: ['Percent = part ÷ whole × 100.', `Part = mass of ${b}; whole = the sample.`, `${formatDecimals(mb, 2)} ÷ ${given(sample, 3)} × 100 = ?`],
        mistakes: [{ value: (ma / sample) * 100, message: `That’s the percent of ${a}. The question asks about ${b}.` }],
        explain: `% ${b} = ${formatDecimals(mb, 2)} ÷ ${given(sample, 3)} × 100 = **${pct(pb)}%**`,
      },
    ],
  };
}

function hydrateWater(rng: Rng): Question {
  const c = rng.pick(HYDRATES);
  const [salt, water] = c.formula.split('·');
  const n = Number(water.match(/^\d+/)![0]);
  const M = molarMass(c.formula);
  const mw = n * 18.02;
  const p = (mw / M) * 100;
  return {
    prompt: `What percent of the mass of ${c.name}, ${f(c.formula)}, is water?`,
    steps: [
      molarMassStep(c.formula),
      {
        prompt: `What mass of water is in one mole of the hydrate?`,
        answer: { kind: 'numeric', value: mw, unit: 'g', decimals: 2, showRoundingNote: false, tolerance: 0.002 },
        hints: [`How many H_{2}O are in the formula?`, 'Molar mass of water = 18.02 g/mol.', `${n} × 18.02 = ?`],
        mistakes: [{ value: 18.02, message: `There are ${n} waters in the formula, not one.` }],
        explain: `${n} × 18.02 = ${mm(mw)} g of water`,
      },
      {
        prompt: 'Calculate the percent water.',
        answer: pctAnswer(p),
        hints: ['Percent = part ÷ whole × 100.', 'Part = the water; whole = the entire hydrate.', `${mm(mw)} ÷ ${mm(M)} × 100 = ?`],
        mistakes: [{ value: (mw / molarMass(salt)) * 100, message: 'Divide by the molar mass of the **whole** hydrate, including the water.' }],
        explain: `% water = ${mm(mw)} ÷ ${mm(M)} × 100 = **${pct(p)}%**`,
      },
    ],
  };
}

function massFromPercent(rng: Rng): Question {
  const c = rng.pick(COMPOUNDS.filter((x) => /Fe|Al|Ca|Na|K/.test(x.formula)));
  const el = Object.keys(parseFormula(c.formula))[0];
  const sample = measured(rng, 10, 200, 3);
  const p = percentOf(c.formula, el);
  const m = (sample * p) / 100;
  return {
    prompt: `How many grams of ${ELEMENT_BY_SYMBOL[el].name} are in ${given(sample, 3)} g of ${f(c.formula)}?`,
    steps: [
      { ...percentStep(c.formula, el), prompt: `First, find the percent by mass of ${el} in ${f(c.formula)}.` },
      {
        prompt: `Now find the mass of ${el} in the ${given(sample, 3)} g sample.`,
        answer: { kind: 'numeric', value: m, unit: 'g', sigFigs: 3 },
        hints: [
          `If the compound is ${pct(p)}% ${el}, then ${pct(p)}% of any sample is ${el}.`,
          'Turn the percent into a decimal and multiply by the sample mass.',
          `${given(sample, 3)} × ${formatDecimals(p / 100, 4)} = ?`,
        ],
        mistakes: [{ value: sample * p, message: 'Divide the percent by 100 first (e.g. 70% = 0.70).' }],
        explain: `${given(sample, 3)} g × ${pct(p)}% = **${sf(m, 3)} g** of ${el}`,
      },
    ],
  };
}

function compareRichness(rng: Rng): Question {
  const sets = [
    { el: 'Fe', options: ['FeO', 'Fe2O3', 'Fe3O4'] },
    { el: 'N', options: ['NH3', 'NH4NO3', 'KNO3'] },
    { el: 'C', options: ['CH4', 'C2H6', 'CO2'] },
    { el: 'Cu', options: ['Cu2O', 'CuO', 'CuSO4'] },
  ];
  const s = rng.pick(sets);
  const order = rng.shuffle([0, 1, 2]);
  const vals = s.options.map((o) => percentOf(o, s.el));
  const best = vals.indexOf(Math.max(...vals));
  return {
    prompt: `Which compound has the **highest** percent by mass of ${ELEMENT_BY_SYMBOL[s.el].name}?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: order.map((i) => f(s.options[i])), correct: order.indexOf(best) },
        hints: [
          'You can’t just count atoms. The other elements add mass too.',
          `Work out % ${s.el} for each: (mass of ${s.el}) ÷ (molar mass) × 100.`,
          `Try ${f(s.options[order[0]])} first: ${pct(vals[order[0]])}%. Now the others.`,
        ],
        explain: s.options.map((o, i) => `${f(o)}: ${pct(vals[i])}%`).join(' · '),
      },
    ],
  };
}

export const percentCompositionTopic: Topic = {
  meta: TOPIC_META['u1-percent-composition'],
  summary: 'Percent composition tells you what fraction of a compound’s mass comes from each element.',
  learn: [
    {
      type: 'p',
      text: 'Water is 11.21% hydrogen and 88.79% oxygen **by mass**. That’s its **percent composition**. It’s the same for every sample of pure water, from a raindrop to an ocean.',
    },
    { type: 'key', title: 'Percent by mass', text: '% of an element = (mass of the element ÷ mass of the compound) × 100' },
    { type: 'h', text: 'From a formula' },
    {
      type: 'p',
      text: 'Use one mole of the compound. The “whole” is the molar mass; the “part” is the element’s molar mass times its subscript.',
    },
    { type: 'equation', text: '% X = (subscript × M_{X}) ÷ M_{compound} × 100' },
    { type: 'h', text: 'From lab data' },
    {
      type: 'p',
      text: 'If you’re given actual masses from an experiment, divide the mass of the element by the mass of the whole sample, then × 100.',
    },
    {
      type: 'tip',
      text: 'Check: the percentages of all the elements in a compound add up to 100% (allowing for small rounding differences).',
    },
    { type: 'h', text: 'Percent water in a hydrate' },
    {
      type: 'p',
      text: `The same idea works for the water in a hydrate. In ${f('CuSO4·5H2O')}, the “part” is 5 × 18.02 = 90.10 g and the “whole” is 249.72 g, so it’s 36.08% water.`,
    },
    {
      type: 'background',
      title: 'Molar mass refresher',
      text: 'Percent composition starts with a molar mass. Review Topic 4 if that step feels shaky.',
      topicId: 'u1-molar-mass',
    },
  ],
  examples: [
    {
      title: 'One element from a formula',
      problem: `What is the percent by mass of oxygen in water, ${f('H2O')}?`,
      steps: [
        { label: 'Molar mass', work: '2(1.01) + 16.00 = 18.02 g/mol' },
        { label: 'Part', work: '1 × 16.00 = 16.00 g of O per mole' },
        { label: 'Percent', work: '16.00 ÷ 18.02 × 100 = 88.79%' },
      ],
      answer: '88.79% oxygen',
    },
    {
      title: 'Full composition',
      problem: `Find the percent composition of calcium carbonate, ${f('CaCO3')}.`,
      steps: [
        { label: 'Molar mass', work: '40.08 + 12.01 + 3(16.00) = 100.09 g/mol' },
        { label: 'Ca', work: '40.08 ÷ 100.09 × 100 = 40.04%' },
        { label: 'C', work: '12.01 ÷ 100.09 × 100 = 12.00%' },
        { label: 'O', work: '48.00 ÷ 100.09 × 100 = 47.96%' },
        { label: 'Check', work: '40.04 + 12.00 + 47.96 = 100.00% ✓' },
      ],
      answer: '40.04% Ca, 12.00% C, 47.96% O',
    },
    {
      title: 'From lab masses',
      problem: 'A 4.20 g sample of a compound contains 2.52 g of carbon. What percent is carbon?',
      steps: [{ label: 'Percent', work: '2.52 g ÷ 4.20 g × 100 = 60.0%' }],
      answer: '60.0% carbon',
    },
  ],
  stepGuide: [
    'Find the “whole”: the molar mass of the compound (or the sample mass, for lab data).',
    'Find the “part”: the element’s molar mass × its subscript (or its measured mass).',
    'Percent = part ÷ whole × 100.',
    'Check that all the percentages add up to about 100%.',
  ],
  practice: [
    { id: 'from-formula', skill: 'percent from a formula', generate: percentFromFormula },
    { id: 'other', skill: 'using the 100% total', generate: otherPercent },
    { id: 'lab', skill: 'percent from lab masses', generate: fromLabMasses },
    { id: 'from-formula-2', skill: 'percent from a formula', generate: percentFromFormula },
    { id: 'decomposition', skill: 'decomposition data', generate: decomposition },
    { id: 'hydrate', skill: 'percent water in a hydrate', generate: hydrateWater },
    { id: 'mass-from-percent', skill: 'mass of an element in a sample', generate: massFromPercent },
    { id: 'compare', skill: 'comparing compounds', generate: compareRichness },
    { id: 'from-formula-3', skill: 'percent from a formula', generate: percentFromFormula },
    { id: 'lab-2', skill: 'percent from lab masses', generate: fromLabMasses },
  ],
  videos: [
    {
      youtubeId: 'lh1endFwo80',
      title: 'Percent Composition Common Mistakes',
      channel: 'Tyler DeWitt',
      note: 'The mistakes students make most often, and how to avoid them.',
    },
    {
      youtubeId: 'xRFa-VUgRcA',
      title: 'Percent Composition and Empirical Formulas',
      channel: "Teacher's Pet",
      note: 'Worked examples. The second half previews the next topic (empirical formulas).',
    },
  ],
};
