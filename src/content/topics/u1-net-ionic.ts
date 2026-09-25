import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { ionText } from '../ions';
import { ionList, mixSolutions, netIonic, nonIonic, spectators, totalIonic } from '../precipitation';
import type { Rng } from '../../engine/rng';

function totalIonicQ(rng: Rng): Question {
  const m = mixSolutions(rng, true);
  const right = totalIonic(m);
  // Distractors: precipitate split into ions; coefficients ignored; states all (aq).
  const splitAll = right.replace(/(\d+ )?\[\[([^\]]+)\]\]\(s\)/, () => `${ionText(m.precipitate!.cation)}(aq) + ${ionText(m.precipitate!.anion)}(aq)`);
  const noCoef = right.replace(/\b\d+ (?=[^\d])/g, '');
  const opts = rng.shuffle([...new Set([right, splitAll, noCoef, nonIonic(m)])]);
  return {
    prompt: `Write the total ionic equation for: ${nonIonic(m)}`,
    steps: [
      {
        prompt: 'Choose the correct total ionic equation.',
        answer: { kind: 'choice', options: opts, correct: opts.indexOf(right) },
        hints: [
          'Split every **(aq)** ionic compound into its ions.',
          'Keep the **(s)** precipitate together. It isn’t dissolved.',
          'Multiply each ion by its coefficient and subscript.',
        ],
        explain: right,
      },
    ],
  };
}

function spectatorQ(rng: Rng): Question {
  const m = mixSolutions(rng, true);
  const spec = spectators(m);
  const p = m.precipitate!;
  const right = ionList(spec);
  const opts = rng.shuffle([
    ...new Set([right, ionList([p.cation, p.anion]), ionList([spec[0], p.anion]), ionList([p.cation, spec[1]])]),
  ]);
  return {
    prompt: `In the reaction ${nonIonic(m)}, which ions are spectators?`,
    steps: [
      {
        prompt: 'Choose the spectator ions.',
        answer: { kind: 'choice', options: opts, correct: opts.indexOf(right) },
        hints: [
          'Spectator ions are unchanged: dissolved (aq) before and after.',
          `The precipitate ${f(p.formula)} uses ${ionText(p.cation)} and ${ionText(p.anion)}. Those ions react.`,
          'The other two ions are spectators.',
        ],
        explain: `${right} stay dissolved the whole time: they’re **spectators**.`,
      },
    ],
  };
}

function netIonicQ(rng: Rng): Question {
  const m = mixSolutions(rng, true);
  const p = m.precipitate!;
  const right = netIonic(m);
  const withSpectators = totalIonic(m);
  const oneEach = `${ionText(p.cation)}(aq) + ${ionText(p.anion)}(aq) → [[${p.formula}]](s)`;
  const reversed = `[[${p.formula}]](s) → ${p.nCation > 1 ? p.nCation + ' ' : ''}${ionText(p.cation)}(aq) + ${p.nAnion > 1 ? p.nAnion + ' ' : ''}${ionText(p.anion)}(aq)`;
  const opts = rng.shuffle([...new Set([right, withSpectators, oneEach, reversed])]);
  return {
    prompt: `Write the net ionic equation when ${f(m.r1.formula)}(aq) and ${f(m.r2.formula)}(aq) are mixed.`,
    steps: [
      {
        prompt: 'Which compound precipitates?',
        answer: (() => {
          const o = rng.shuffle([f(m.p1.formula), f(m.p2.formula)]);
          return { kind: 'choice' as const, options: o, correct: o.indexOf(f(p.formula)) };
        })(),
        hints: ['Swap partners to find the products.', 'Check them in the solubility table.', 'The low-solubility one is the precipitate.'],
        explain: `${f(p.formula)}(s) precipitates.`,
      },
      {
        prompt: 'Choose the net ionic equation.',
        answer: { kind: 'choice', options: opts, correct: opts.indexOf(right) },
        hints: [
          'Remove the spectator ions. Keep only what changes.',
          'The net ionic equation shows the precipitate forming from its ions.',
          `Balance the charges: ${p.nCation} × ${ionText(p.cation)} and ${p.nAnion} × ${ionText(p.anion)}.`,
        ],
        explain: `Net ionic: **${right}**. Spectators: ${ionList(spectators(m))}.`,
      },
    ],
  };
}

function noReaction(rng: Rng): Question {
  const m = mixSolutions(rng, false);
  const opts = rng.shuffle([
    'There is no net ionic equation: all ions are spectators',
    `${ionText(m.r1.cation)}(aq) + ${ionText(m.r2.anion)}(aq) → [[${m.p1.formula}]](s)`,
    `${ionText(m.r2.cation)}(aq) + ${ionText(m.r1.anion)}(aq) → [[${m.p2.formula}]](s)`,
  ]);
  return {
    prompt: `${f(m.r1.formula)}(aq) and ${f(m.r2.formula)}(aq) are mixed. What is the net ionic equation?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: opts, correct: opts.indexOf('There is no net ionic equation: all ions are spectators') },
        hints: ['Find the two possible products.', 'Check both in the solubility table.', 'If both are high solubility, nothing changes.'],
        explain: `${f(m.p1.formula)} and ${f(m.p2.formula)} are both high solubility, so no precipitate forms. Every ion is a spectator.`,
      },
    ],
  };
}

const neutralization: MCItem[] = [
  {
    q: `What is the net ionic equation for ${f('HCl')}(aq) + ${f('NaOH')}(aq) → ${f('NaCl')}(aq) + ${f('H2O')}(l)?`,
    correct: 'H^{+}(aq) + OH^{−}(aq) → H_{2}O(l)',
    wrong: ['Na^{+}(aq) + Cl^{−}(aq) → NaCl(s)', 'HCl(aq) + NaOH(aq) → NaCl(aq) + H_{2}O(l)', 'H^{+}(aq) + Cl^{−}(aq) → HCl(aq)'],
    hints: ['Na^{+} and Cl^{−} are spectators.', 'What actually changes?', 'Acid H^{+} + base OH^{−} → ?'],
    explain: 'Every strong acid + strong base neutralization has the same net ionic equation: H^{+}(aq) + OH^{−}(aq) → H_{2}O(l).',
  },
  {
    q: 'What is a spectator ion?',
    correct: 'An ion that is in solution before and after the reaction, unchanged',
    wrong: ['An ion that forms the precipitate', 'An ion that is used up', 'Any positive ion'],
    hints: ['It “watches” the reaction.', 'It’s (aq) on both sides.', 'It cancels out of the net ionic equation.'],
    explain: 'Spectator ions appear unchanged on both sides, so they cancel out of the net ionic equation.',
  },
  {
    q: 'In a total ionic equation, which substances are **not** split into ions?',
    correct: 'Solids (precipitates), liquids like water, and gases',
    wrong: ['All ionic compounds', 'Anything with a metal', 'Only acids'],
    hints: ['Only dissolved ionic compounds exist as free ions.', 'A precipitate is not dissolved.', 'Water is molecular.'],
    explain: 'Only (aq) ionic compounds (and strong acids) are split. Keep (s), (l), and (g) substances together.',
  },
];

export const netIonicTopic: Topic = {
  meta: TOPIC_META['u1-net-ionic'],
  summary: 'Three ways to write the same reaction. The net ionic equation shows only what actually changes.',
  learn: [
    { type: 'p', text: 'For AgNO_{3}(aq) + NaCl(aq), there are three ways to write the equation:' },
    {
      type: 'table',
      head: ['Equation', 'What it shows'],
      rows: [
        ['**Non-ionic** (molecular): AgNO_{3}(aq) + NaCl(aq) → AgCl(s) + NaNO_{3}(aq)', 'whole formulas with states'],
        ['**Total ionic:** Ag^{+}(aq) + NO_{3}^{−}(aq) + Na^{+}(aq) + Cl^{−}(aq) → AgCl(s) + Na^{+}(aq) + NO_{3}^{−}(aq)', 'every dissolved ionic compound split into ions'],
        ['**Net ionic:** Ag^{+}(aq) + Cl^{−}(aq) → AgCl(s)', 'only the ions that change'],
      ],
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Write the balanced non-ionic equation with states (use the solubility table).',
        'Split every **(aq)** ionic compound into ions. Coefficient × subscript gives each ion’s count. Keep (s), (l), and (g) together.',
        'Cross out **spectator ions**: identical on both sides.',
        'What’s left is the net ionic equation. Reduce to lowest terms.',
      ],
    },
    { type: 'tip', text: 'Neutralization of a strong acid and a strong base always has the net ionic equation H^{+}(aq) + OH^{−}(aq) → H_{2}O(l).' },
    { type: 'background', title: 'Predicting the precipitate', text: 'You need to know which product is (s). That’s Topic 12.', topicId: 'u1-precipitates' },
  ],
  examples: [
    {
      title: 'All three equations',
      problem: `Write the equations for mixing ${f('Pb(NO3)2')}(aq) and ${f('KI')}(aq).`,
      steps: [
        { label: 'Non-ionic', work: 'Pb(NO_{3})_{2}(aq) + 2 KI(aq) → PbI_{2}(s) + 2 KNO_{3}(aq)' },
        { label: 'Total ionic', work: 'Pb^{2+}(aq) + 2 NO_{3}^{−}(aq) + 2 K^{+}(aq) + 2 I^{−}(aq) → PbI_{2}(s) + 2 K^{+}(aq) + 2 NO_{3}^{−}(aq)' },
        { label: 'Cancel spectators', work: 'K^{+} and NO_{3}^{−} appear unchanged on both sides' },
      ],
      answer: 'Pb^{2+}(aq) + 2 I^{−}(aq) → PbI_{2}(s)',
    },
  ],
  stepGuide: [
    'Balanced non-ionic equation with states from the solubility table.',
    'Total ionic: split (aq) ionic compounds; keep (s), (l), (g) whole.',
    'Cancel spectator ions.',
    'Net ionic: what’s left, in lowest terms.',
  ],
  practice: [
    { id: 'spectators', skill: 'spotting spectator ions', generate: spectatorQ },
    { id: 'total', skill: 'total ionic equations', generate: totalIonicQ },
    { id: 'net', skill: 'net ionic equations', generate: netIonicQ },
    mcTemplate('concepts', 'neutralization and spectators', neutralization),
    { id: 'none', skill: 'when nothing precipitates', generate: noReaction },
    { id: 'net-2', skill: 'net ionic equations', generate: netIonicQ },
    { id: 'total-2', skill: 'total ionic equations', generate: totalIonicQ },
    { id: 'spectators-2', skill: 'spotting spectator ions', generate: spectatorQ },
    { id: 'net-3', skill: 'net ionic equations', generate: netIonicQ },
    mcTemplate('concepts-2', 'neutralization and spectators', neutralization),
  ],
  videos: [],
};
