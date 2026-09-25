import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, sf } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { coefOf, eq, massToMolesSteps, molesToMassStep, pickPair, ratioStep } from '../stoich';
import { molarMass } from '../../engine/formula';
import type { Rng } from '../../engine/rng';

const pctStep = (actual: number, theoretical: number, aText: string, tText: string) => ({
  prompt: 'Calculate the percent yield.',
  answer: { kind: 'numeric' as const, value: (actual / theoretical) * 100, unit: '%', sigFigs: 3 },
  hints: ['% yield = actual ÷ theoretical × 100%', 'Actual = what you really got; theoretical = what the math predicts.', `${aText} ÷ ${tText} × 100 = ?`] as [string, string, string],
  mistakes: [
    { value: (theoretical / actual) * 100, message: 'Flip it: actual on top, theoretical on the bottom.' },
    { value: actual / theoretical, message: 'Almost! Multiply by 100 to make it a percent.' },
  ],
  explain: `% yield = ${aText} ÷ ${tText} × 100% = **${sf((actual / theoretical) * 100, 3)}%**`,
});

function simple(rng: Rng): Question {
  const theo = measured(rng, 5, 80, 3);
  const actual = Number((theo * rng.sig(0.55, 0.97, 3)).toPrecision(3));
  return {
    prompt: `A reaction should produce ${given(theo, 3)} g of product, but the student collects ${given(actual, 3)} g. What is the percent yield?`,
    steps: [pctStep(actual, theo, `${given(actual, 3)} g`, `${given(theo, 3)} g`)],
  };
}

function full(rng: Rng): Question {
  const { r, from, to } = pickPair(rng, (r, a, b) => r.reactants.includes(a) && r.products.includes(b) && b !== 'H2O' && !r.gases.includes(b));
  const m = measured(rng, 5, 60, 3);
  const { steps, n } = massToMolesSteps(from, m);
  const nTo = (n * coefOf(r, to)) / coefOf(r, from);
  const theo = nTo * molarMass(to);
  const actual = Number((theo * rng.sig(0.6, 0.95, 3)).toPrecision(3));
  return {
    prompt: `${r.context}: ${eq(r)}. ${given(m, 3)} g of ${f(from)} reacts completely, and ${given(actual, 3)} g of ${f(to)} is collected. What is the percent yield?`,
    steps: [
      ...steps,
      ratioStep(r, from, to, n, sf(n, 4)),
      { ...molesToMassStep(to, nTo, false), prompt: `Theoretical yield: what mass of ${f(to)} should form?` },
      pctStep(actual, theo, `${given(actual, 3)} g`, `${sf(theo, 4)} g`),
    ],
  };
}

function expectedActual(rng: Rng): Question {
  const theo = measured(rng, 10, 200, 3);
  const pct = measured(rng, 60, 95, 3);
  const actual = (theo * pct) / 100;
  return {
    prompt: `A process has a ${given(pct, 3)}% yield. If the theoretical yield is ${given(theo, 3)} g, how much product is actually expected?`,
    steps: [
      {
        prompt: 'Calculate the expected actual yield.',
        answer: { kind: 'numeric', value: actual, unit: 'g', sigFigs: 3 },
        hints: ['Rearrange: actual = % yield × theoretical ÷ 100.', 'Turn the percent into a decimal.', `${given(theo, 3)} × ${given(pct, 3)} ÷ 100 = ?`],
        mistakes: [{ value: theo * pct, message: 'Divide the percent by 100 first.' }, { value: (theo / pct) * 100, message: 'Multiply by the yield fraction; the actual yield is **less** than theoretical.' }],
        explain: `${given(theo, 3)} g × ${given(pct, 3)}% = **${sf(actual, 3)} g**`,
      },
    ],
  };
}

const whyLow: MCItem[] = [
  {
    q: 'Which is **not** a reason for a percent yield below 100%?',
    correct: 'Mass was created during the reaction',
    wrong: ['Some product stayed stuck to the filter paper', 'The reaction didn’t go to completion', 'Side reactions made other products'],
    hints: ['Think of the real reasons product goes missing.', 'Mass is conserved.', 'Which one breaks the law of conservation of mass?'],
    explain: 'Mass is never created. Low yields come from losses, incomplete reactions, and side reactions.',
  },
  {
    q: 'A student gets a percent yield of 112%. What is the most likely reason?',
    correct: 'The product was still wet or contained impurities',
    wrong: ['The reaction made extra matter', 'The theoretical yield is always too low', 'The student used a catalyst'],
    hints: ['You can’t make more product than the reactants allow.', 'So the measured mass must include something else.', 'What might still be in the product?'],
    explain: 'Over 100% means the “product” includes something extra, usually water or impurities.',
  },
  {
    q: 'What is the theoretical yield?',
    correct: 'The maximum product calculated from the limiting reagent',
    wrong: ['The mass actually collected in the lab', 'Always 100 g', 'The mass of the excess reagent'],
    hints: ['It comes from calculation, not measurement.', 'Stoichiometry predicts it.', 'Use the limiting reagent.'],
    explain: 'Theoretical yield is the calculated maximum; actual yield is what you really collect.',
  },
];

const maximize: MCItem[] = [
  {
    q: 'In the Haber process (N_{2} + 3 H_{2} ⇌ 2 NH_{3}), what do factories do with unreacted N_{2} and H_{2}?',
    correct: 'Recycle it back into the reactor',
    wrong: ['Release it into the air', 'Burn it as fuel', 'Throw it away with the product'],
    hints: ['The reaction doesn’t go to completion in one pass.', 'The gases are valuable.', 'Reuse them.'],
    explain: 'Recycling the unreacted gases lets almost all of them eventually become ammonia, raising the overall yield.',
  },
  {
    q: 'Which is a good way to increase the yield of a product made from an expensive reactant?',
    correct: 'Use an excess of the cheaper reactant',
    wrong: ['Use less of the cheaper reactant', 'Stop the reaction early', 'Use impure reactants'],
    hints: ['Make sure the expensive one fully reacts.', 'Excess of one reactant pushes the other to be used up.', 'Cheap = can afford extra.'],
    explain: 'Adding excess of a cheap reactant makes the expensive (limiting) one react as completely as possible.',
  },
  {
    q: 'Why might a company choose conditions that give a **lower** percent yield?',
    correct: 'Because the reaction is faster or cheaper to run, making more product per day',
    wrong: ['Low yields are always better', 'To use more energy', 'Because percent yield doesn’t matter at all'],
    hints: ['Industry balances yield against speed and cost.', 'A slow 100% yield can be worse than a fast 90%.', 'Think about trade-offs.'],
    explain: 'Industrial chemistry balances yield, rate, energy, safety, and cost: a trade-off, not just maximum yield.',
  },
  {
    q: 'Which lab technique helps reduce product loss when filtering a precipitate?',
    correct: 'Rinse the beaker with a little distilled water into the filter',
    wrong: ['Pour quickly and skip rinsing', 'Weigh the product while it’s still wet', 'Use a dirty beaker'],
    hints: ['Some solid clings to the beaker.', 'Transfer all of it.', 'But dry before weighing.'],
    explain: 'Rinsing transfers all the solid; then dry it fully before weighing so water doesn’t inflate the mass.',
  },
];

export const percentYieldTopic: Topic = {
  meta: TOPIC_META['u1-percent-yield'],
  summary: 'Real reactions rarely give the full calculated amount. Percent yield compares what you got with what was possible.',
  learn: [
    {
      type: 'list',
      items: [
        '**Theoretical yield:** the maximum product, calculated by stoichiometry from the limiting reagent.',
        '**Actual yield:** the amount you really collect.',
      ],
    },
    { type: 'equation', text: '% yield = (actual yield ÷ theoretical yield) × 100%', caption: 'On your data table.' },
    { type: 'h', text: 'Why yields are below 100%' },
    {
      type: 'list',
      items: ['Product lost when transferring, filtering, or drying', 'The reaction doesn’t go to completion (equilibrium)', 'Side reactions make other products', 'Impure reactants'],
    },
    { type: 'tip', text: 'A yield over 100% means the product still contains something extra, usually water or impurities.' },
    { type: 'h', text: 'Maximizing yield' },
    {
      type: 'p',
      text: 'Chemists and industries increase yield by using an **excess** of a cheap reactant, **recycling** unreacted materials (as in the Haber process for ammonia), choosing good temperature and pressure conditions, and careful lab technique. Industry also weighs yield against speed, energy, safety, and cost.',
    },
    { type: 'background', title: 'Theoretical yield', text: 'Finding the theoretical yield is a stoichiometry calculation (Topics 15–16).', topicId: 'u1-stoichiometry' },
  ],
  examples: [
    {
      title: 'Percent yield',
      problem: `${f('CaCO3')} → ${f('CaO')} + ${f('CO2')}. Heating 50.0 g of CaCO_{3} gives 25.2 g of CaO. Find the percent yield.`,
      steps: [
        { label: 'Moles', work: '50.0 g ÷ 100.09 g/mol = 0.4996 mol CaCO_{3}' },
        { label: 'Ratio', work: '1 : 1 → 0.4996 mol CaO' },
        { label: 'Theoretical', work: '0.4996 × 56.08 g/mol = 28.02 g' },
        { label: 'Percent', work: '25.2 ÷ 28.02 × 100% = 89.9%' },
      ],
      answer: '89.9% yield',
    },
  ],
  stepGuide: [
    'Find the theoretical yield by stoichiometry (use the limiting reagent).',
    '% yield = actual ÷ theoretical × 100%.',
    'Expected actual = theoretical × (% yield ÷ 100).',
  ],
  practice: [
    { id: 'simple', skill: 'percent yield', generate: simple },
    mcTemplate('why-low', 'why yields fall short', whyLow),
    { id: 'full', skill: 'theoretical and percent yield', generate: full },
    { id: 'expected', skill: 'expected actual yield', generate: expectedActual },
    mcTemplate('maximize', 'maximizing yield', maximize),
    { id: 'full-2', skill: 'theoretical and percent yield', generate: full },
    { id: 'simple-2', skill: 'percent yield', generate: simple },
    mcTemplate('maximize-2', 'maximizing yield', maximize),
    { id: 'full-3', skill: 'theoretical and percent yield', generate: full },
    { id: 'expected-2', skill: 'expected actual yield', generate: expectedActual },
  ],
  videos: [],
};
