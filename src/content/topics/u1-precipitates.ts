import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { ionText, ionicFormulaMistakes } from '../ions';
import { mixSolutions, nonIonic } from '../precipitation';
import { solubilityReason } from '../solubility';
import type { Rng } from '../../engine/rng';

function predict(rng: Rng): Question {
  const m = mixSolutions(rng, true);
  const p = m.precipitate!;
  const pairOpts = rng.shuffle([
    `${f(m.p1.formula)} and ${f(m.p2.formula)}`,
    `${f(m.r1.formula)} and ${f(m.r2.formula)}`,
    `${f(m.r1.cation.formula + m.r2.cation.formula)} and ${f(m.r1.anion.formula + m.r2.anion.formula)}`,
  ]);
  const right = `${f(m.p1.formula)} and ${f(m.p2.formula)}`;
  const solOpts = rng.shuffle([f(m.p1.formula), f(m.p2.formula), 'Neither: no precipitate forms']);
  return {
    prompt: `Solutions of ${f(m.r1.formula)} and ${f(m.r2.formula)} are mixed. Predict the precipitate.`,
    steps: [
      {
        prompt: 'The positive ions swap partners. Which two new compounds are possible?',
        answer: { kind: 'choice', options: pairOpts, correct: pairOpts.indexOf(right) },
        hints: [
          'Mixing two ionic solutions is a double displacement.',
          `The ions are ${ionText(m.r1.cation)}, ${ionText(m.r1.anion)}, ${ionText(m.r2.cation)}, and ${ionText(m.r2.anion)}.`,
          'Pair each cation with the **other** compound’s anion.',
        ],
        explain: `${ionText(m.r1.cation)} + ${ionText(m.r2.anion)} → ${f(m.p1.formula)}; ${ionText(m.r2.cation)} + ${ionText(m.r1.anion)} → ${f(m.p2.formula)}`,
      },
      {
        prompt: 'Which new compound has **low** solubility? (Check your solubility table.)',
        answer: { kind: 'choice', options: solOpts, correct: solOpts.indexOf(f(p.formula)) },
        hints: [
          'Look up each new compound in the table.',
          'Low solubility (s) means it forms a precipitate.',
          `Check ${p.anion.name} with ${p.cation.name}.`,
        ],
        explain: `${f(p.formula)} is low solubility. ${solubilityReason(p.cation, p.anion)}`,
      },
      {
        prompt: 'Write the formula of the precipitate.',
        answer: { kind: 'formula', formula: p.formula },
        hints: ['Balance the charges of its two ions.', `${ionText(p.cation)} and ${ionText(p.anion)}`, 'Put brackets around a polyatomic ion if you need more than one.'],
        mistakes: ionicFormulaMistakes(p),
        explain: `The precipitate is **${f(p.formula)}(s)**. ${nonIonic(m)}`,
      },
    ],
  };
}

function yesNo(rng: Rng): Question {
  const m = mixSolutions(rng, rng.next() < 0.55);
  const p = m.precipitate;
  const options = ['Yes', 'No'];
  return {
    prompt: `Will a precipitate form when ${f(m.r1.formula)}(aq) and ${f(m.r2.formula)}(aq) are mixed?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: p ? 0 : 1 },
        hints: ['Swap partners to find the two possible products.', `Possible products: ${f(m.p1.formula)} and ${f(m.p2.formula)}.`, 'If either is low solubility, a precipitate forms.'],
        explain: p
          ? `Yes: **${f(p.formula)}** is low solubility. ${solubilityReason(p.cation, p.anion)}`
          : `No: both ${f(m.p1.formula)} and ${f(m.p2.formula)} are high solubility, so all the ions stay dissolved.`,
      },
    ],
  };
}

function states(rng: Rng): Question {
  const m = mixSolutions(rng, true);
  const eqn = nonIonic(m);
  const wrong1 = eqn.replace(/\(s\)/, '(aq)');
  const swapState = (s: string) => s.replace(/\(aq\)(?=[^(]*$)/, '(s)');
  const reactantSolid = eqn.replace('(aq)', '(s)');
  const options = rng.shuffle([...new Set([eqn, wrong1, swapState(wrong1), reactantSolid])]);
  return {
    prompt: `Which equation shows the correct states for mixing ${f(m.r1.formula)}(aq) and ${f(m.r2.formula)}(aq)?`,
    steps: [
      {
        prompt: 'Choose the equation with correct states.',
        answer: { kind: 'choice', options, correct: options.indexOf(eqn) },
        hints: ['Reactants are both dissolved (aq).', 'Use the table for each product.', 'Low solubility → (s); high solubility → (aq).'],
        explain: eqn,
      },
    ],
  };
}

const TESTS = [
  { target: 'Ag^{+}', other: 'Na^{+}', reagent: `${f('NaCl')}(aq)`, bad: [`${f('KNO3')}(aq)`, `${f('NH4NO3')}(aq)`, `${f('NaNO3')}(aq)`], why: 'Cl^{−} precipitates Ag^{+} as AgCl(s); sodium chloride is high solubility.' },
  { target: 'Ba^{2+}', other: 'K^{+}', reagent: `${f('Na2SO4')}(aq)`, bad: [`${f('NaNO3')}(aq)`, `${f('KCl')}(aq)`, `${f('NH4Cl')}(aq)`], why: 'SO_{4}^{2−} precipitates Ba^{2+} as BaSO_{4}(s); potassium sulfate stays dissolved.' },
  { target: 'Pb^{2+}', other: 'Mg^{2+}', reagent: `${f('KI')}(aq)`, bad: [`${f('KNO3')}(aq)`, `${f('NaNO3')}(aq)`, `${f('NH4NO3')}(aq)`], why: 'I^{−} precipitates Pb^{2+} as PbI_{2}(s) (bright yellow); MgI_{2} stays dissolved.' },
  { target: 'Cu^{2+}', other: 'Na^{+}', reagent: `${f('NaOH')}(aq)`, bad: [`${f('NaNO3')}(aq)`, `${f('KCl')}(aq)`, `${f('NH4NO3')}(aq)`], why: 'OH^{−} precipitates Cu^{2+} as Cu(OH)_{2}(s) (blue); sodium hydroxide is high solubility.' },
  { target: 'Ca^{2+}', other: 'NH_{4}^{+}', reagent: `${f('Na2CO3')}(aq)`, bad: [`${f('NaCl')}(aq)`, `${f('KNO3')}(aq)`, `${f('NaNO3')}(aq)`], why: 'CO_{3}^{2−} precipitates Ca^{2+} as CaCO_{3}(s); ammonium carbonate stays dissolved.' },
];

const ionTests: MCItem[] = TESTS.map((t) => ({
  q: `A solution contains ${t.target} and ${t.other}. Which solution could you add to remove only the ${t.target} as a precipitate?`,
  correct: t.reagent,
  wrong: t.bad,
  hints: ['You need an anion that’s low solubility with the target ion…', '…but high solubility with the other ion.', 'Nitrates and group 1 compounds never precipitate anything.'],
  explain: t.why,
}));

const concepts: MCItem[] = [
  {
    q: 'What is a precipitate?',
    correct: 'A low-solubility solid that forms when solutions are mixed',
    wrong: ['A gas released by a reaction', 'Any solution with ions in it', 'The water left after filtering'],
    hints: ['It appears as cloudiness or a solid.', 'It comes out of solution.', 'Low solubility → (s).'],
    explain: 'A precipitate is a solid formed from solution because the product has low solubility.',
  },
  {
    q: 'Why are nitrate solutions like AgNO_{3} often used to supply metal ions?',
    correct: 'All nitrates are high solubility, so they dissolve completely',
    wrong: ['Nitrates react with everything', 'Nitrates are low solubility', 'Nitrate ions form the precipitate'],
    hints: ['Check the nitrate column of the table.', 'You want the metal ion free in solution.', 'Nitrates never precipitate.'],
    explain: 'All nitrates are high solubility, so a nitrate delivers its metal ion without precipitating.',
  },
];

export const precipitatesTopic: Topic = {
  meta: TOPIC_META['u1-precipitates'],
  summary: 'When two ionic solutions mix, the ions can swap partners. If a new pair has low solubility, it falls out as a precipitate.',
  learn: [
    {
      type: 'p',
      text: 'Mixing two ionic solutions is a **double displacement**: the positive ions swap partners. If one of the new combinations has **low solubility**, it forms a solid **precipitate**.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'List the four ions (two from each solution).',
        'Swap partners to get the two possible new compounds.',
        'Check each one in the solubility table.',
        'Low solubility → precipitate (s). High solubility → stays dissolved (aq).',
      ],
    },
    {
      type: 'table',
      head: ['Ion', 'High solubility (aq)', 'Low solubility (s)'],
      rows: [
        ['Group 1, NH_{4}^{+}, H^{+}', 'all', 'none'],
        ['ClO_{3}^{−}, NO_{3}^{−}, ClO_{4}^{−}', 'all', 'none'],
        ['Cl^{−}, Br^{−}, I^{−}', 'most', 'Ag^{+}, Tl^{+}, Hg^{+}, Cu^{+}, Pb^{2+}'],
        ['CH_{3}COO^{−}', 'most', 'Ag^{+}, Hg^{+}'],
        ['SO_{4}^{2−}', 'most', 'Ca^{2+}, Sr^{2+}, Ba^{2+}, Ra^{2+}, Pb^{2+}, Ag^{+}'],
        ['S^{2−}', 'group 1, group 2, NH_{4}^{+}', 'most'],
        ['OH^{−}', 'group 1, NH_{4}^{+}, Sr^{2+}, Ba^{2+}, Tl^{+}', 'most'],
        ['PO_{4}^{3−}, SO_{3}^{2−}, CO_{3}^{2−}', 'group 1, NH_{4}^{+}', 'most'],
      ],
    },
    { type: 'tip', text: 'This matches the solubility table on your Chemistry 2202 data sheet. High solubility means more than 0.1 mol/L dissolves.' },
    {
      type: 'p',
      text: '**Identifying ions:** you can test for an ion by adding a solution that precipitates only that ion. For example, adding Cl^{−} to a sample makes a white precipitate if Ag^{+} is present.',
    },
  ],
  examples: [
    {
      title: 'Predict a precipitate',
      problem: `Solutions of ${f('AgNO3')} and ${f('NaCl')} are mixed.`,
      steps: [
        { label: 'Swap', work: 'Possible products: AgCl and NaNO_{3}' },
        { label: 'Table', work: 'AgCl: Ag^{+} is an exception for Cl^{−} → low. NaNO_{3}: all nitrates → high' },
      ],
      answer: `AgNO_{3}(aq) + NaCl(aq) → AgCl(s) + NaNO_{3}(aq)`,
    },
  ],
  stepGuide: [
    'Write the four ions.',
    'Swap partners → two possible products.',
    'Check each in the solubility table: (s) or (aq).',
    'Write the precipitate’s formula by balancing charges.',
  ],
  practice: [
    { id: 'yes-no', skill: 'will a precipitate form?', generate: yesNo },
    { id: 'predict', skill: 'predicting the precipitate', generate: predict },
    mcTemplate('concepts', 'precipitates', concepts),
    { id: 'states', skill: 'states in equations', generate: states },
    mcTemplate('tests', 'testing for ions', ionTests),
    { id: 'predict-2', skill: 'predicting the precipitate', generate: predict },
    { id: 'yes-no-2', skill: 'will a precipitate form?', generate: yesNo },
    { id: 'states-2', skill: 'states in equations', generate: states },
    { id: 'predict-3', skill: 'predicting the precipitate', generate: predict },
    mcTemplate('tests-2', 'testing for ions', ionTests),
  ],
  videos: [
    {
      youtubeId: "kAXEhd6DhLM",
      title: "How to predict products for double replacement (precipitate) reactions",
      channel: "Crash Chemistry Academy",
      note: "Swapping partners and spotting the precipitate. Use your class solubility table; some US tables differ slightly.",
    },
    {
      youtubeId: "shx1ZU5W1g0",
      title: "Solubility Rules, Predicting Precipitates and Net Ionic Equations",
      channel: "Michael Patenaude",
      note: "Also previews the next topic (net ionic equations).",
    },
  ],
};
