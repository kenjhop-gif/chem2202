import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { AVOGADRO, IONIC, METALS, MOLECULAR, NA_TEXT, f, given, measured, named, sf } from '../substances';
import { cleanFloat } from '../../engine/numeric';
import { parseFormula } from '../../engine/formula';
import type { Rng } from '../../engine/rng';

const OPS_TO_PARTICLES = ['n × N_{A}', 'n ÷ N_{A}', 'N_{A} ÷ n'];
const OPS_TO_MOLES = ['N ÷ N_{A}', 'N × N_{A}', 'N_{A} ÷ N'];

function bigCount(rng: Rng): number {
  return cleanFloat(measured(rng, 1.0, 9.99, 3) * 10 ** rng.int(21, 25));
}

function molesToParticles(rng: Rng, pool = METALS): Question {
  const s = rng.pick(pool);
  const n = measured(rng, 0.1, 9.99, 3);
  const N = n * AVOGADRO;
  const order = rng.shuffle([0, 1, 2]);
  return {
    prompt: `How many ${s.particle} are in ${given(n, 3)} mol of ${named(s)}?`,
    steps: [
      {
        prompt: 'Which calculation turns moles into a number of particles?',
        answer: {
          kind: 'choice',
          options: order.map((i) => OPS_TO_PARTICLES[i]),
          correct: order.indexOf(0),
          feedback: order.map((i) =>
            i === 1 || i === 2
              ? 'Going from moles to particles, the number should get much bigger. Which operation does that?'
              : undefined,
          ),
        },
        hints: [
          'One mole is a *huge* number of particles. Should your answer be bigger or smaller than the number of moles?',
          'Think of dozens: 3 dozen eggs = 3 × 12 eggs.',
          `Multiply the moles by ${NA_TEXT}.`,
        ],
        explain: `Each mole holds ${NA_TEXT} particles, so **N = n × N_{A}**.`,
      },
      {
        prompt: `Calculate the number of ${s.particle}.`,
        answer: { kind: 'numeric', value: N, unit: s.particle, sigFigs: 3, expectScientific: true },
        hints: [
          `Use N = n × N_{A} with n = ${given(n, 3)} mol.`,
          `Type ${NA_TEXT} on your calculator with the EXP or ×10^{x} key.`,
          `${given(n, 3)} × ${NA_TEXT} = ?`,
        ],
        mistakes: [
          { value: n / AVOGADRO, message: 'You divided. Moles → particles should give a very big number, so multiply.' },
        ],
        explain: `N = ${given(n, 3)} mol × ${NA_TEXT} /mol = **${sf(N, 3)} ${s.particle}**`,
      },
    ],
  };
}

function particlesToMoles(rng: Rng): Question {
  const s = rng.pick([...MOLECULAR, ...METALS]);
  const N = bigCount(rng);
  const n = N / AVOGADRO;
  const order = rng.shuffle([0, 1, 2]);
  return {
    prompt: `How many moles are in ${sf(N, 3)} ${s.particle} of ${named(s)}?`,
    steps: [
      {
        prompt: 'Which calculation turns a number of particles into moles?',
        answer: {
          kind: 'choice',
          options: order.map((i) => OPS_TO_MOLES[i]),
          correct: order.indexOf(0),
        },
        hints: [
          'You are grouping particles into bundles of 6.02 × 10^{23}. Does that make the number bigger or smaller?',
          'Like turning 36 eggs into dozens: 36 ÷ 12.',
          `Divide the particles by ${NA_TEXT}.`,
        ],
        explain: '**n = N ÷ N_{A}**: count how many bundles of 6.02 × 10^{23} you have.',
      },
      {
        prompt: 'Calculate the number of moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol', sigFigs: 3 },
        hints: [
          `Use n = N ÷ N_{A}.`,
          `Enter ${sf(N, 3)} as a whole number in scientific notation on your calculator, then divide.`,
          `${sf(N, 3)} ÷ ${NA_TEXT} = ?`,
        ],
        mistakes: [
          { value: N * AVOGADRO, message: 'You multiplied. Particles → moles should give a small number, so divide.' },
        ],
        explain: `n = ${sf(N, 3)} ÷ ${NA_TEXT} /mol = **${sf(n, 3)} mol**`,
      },
    ],
  };
}

function particleType(rng: Rng): Question {
  const s = rng.pick([...METALS.slice(0, 4), ...MOLECULAR.slice(0, 6), ...IONIC.slice(0, 5)]);
  const options = ['atoms', 'molecules', 'formula units'];
  const why: Record<string, string> = {
    atoms: `${f(s.formula)} is an element made of single atoms, so we count **atoms**.`,
    molecules: `${f(s.formula)} is made of non-metal atoms bonded together, so we count **molecules**.`,
    'formula units': `${f(s.formula)} is an ionic compound (metal + non-metal). There are no separate molecules, so we count **formula units**.`,
  };
  return {
    prompt: `What kind of particle do we count in a sample of ${named(s)}?`,
    steps: [
      {
        prompt: `Choose the particle for ${f(s.formula)}.`,
        answer: { kind: 'choice', options, correct: options.indexOf(s.particle) },
        hints: [
          'Is it a single element, a compound of non-metals, or a metal + non-metal compound?',
          'Metal elements → atoms. Non-metals bonded together → molecules. Metal + non-metal → ionic.',
          'Ionic compounds form a lattice, so we count formula units instead of molecules.',
        ],
        explain: why[s.particle],
      },
    ],
  };
}

function atomsInMolecules(rng: Rng): Question {
  const s = rng.pick(MOLECULAR.filter((m) => Object.keys(parseFormula(m.formula)).length > 1));
  const counts = parseFormula(s.formula);
  const el = rng.pick(Object.keys(counts));
  const k = counts[el];
  const n = measured(rng, 0.1, 4.99, 3);
  const molecules = n * AVOGADRO;
  const atoms = molecules * k;
  return {
    prompt: `How many ${el} atoms are in ${given(n, 3)} mol of ${named(s)}?`,
    steps: [
      {
        prompt: `First, how many molecules of ${f(s.formula)} are there?`,
        answer: { kind: 'numeric', value: molecules, unit: 'molecules', expectScientific: true },
        hints: ['Moles → particles: multiply or divide?', `N = n × N_{A}`, `${given(n, 3)} × ${NA_TEXT} = ?`],
        explain: `${given(n, 3)} mol × ${NA_TEXT} = ${sf(molecules, 4)} molecules`,
      },
      {
        prompt: `How many ${el} atoms are in **one** molecule of ${f(s.formula)}?`,
        answer: { kind: 'numeric', value: k, unit: `${el} atoms`, tolerance: 0 },
        hints: [
          'Look at the subscript right after the symbol.',
          'No subscript means 1.',
          `In ${f(s.formula)}, find ${el} and read the small number after it.`,
        ],
        explain: `Each ${f(s.formula)} molecule has ${k} ${el} atom${k === 1 ? '' : 's'}.`,
      },
      {
        prompt: `Now calculate the total number of ${el} atoms.`,
        answer: { kind: 'numeric', value: atoms, unit: `${el} atoms`, sigFigs: 3, expectScientific: true },
        hints: [
          'Each molecule brings some atoms of this element.',
          'Multiply the number of molecules by the atoms in one molecule.',
          `${sf(molecules, 4)} × ${k} = ?`,
        ],
        mistakes:
          k === 1
            ? []
            : [{ value: molecules, message: `That’s the number of molecules. Each one has ${k} ${el} atoms, so there’s one more step.` }],
        explain: `${sf(molecules, 4)} molecules × ${k} = **${sf(atoms, 3)} ${el} atoms**`,
      },
    ],
    finalMistakes:
      k === 1 ? [] : [{ value: molecules, message: `That’s the number of molecules. Each molecule contains ${k} ${el} atoms.` }],
  };
}

function molesOfAtoms(rng: Rng): Question {
  const pool = ['H2SO4', 'C6H12O6', 'CO2', 'H2O', 'NH3', 'CH4', 'Al2O3', 'CaCO3'];
  const formula = rng.pick(pool);
  const counts = parseFormula(formula);
  const el = rng.pick(Object.keys(counts).filter((e) => counts[e] > 1));
  const k = counts[el];
  const n = measured(rng, 0.2, 5.0, 2);
  return {
    prompt: `How many **moles** of ${el} atoms are in ${given(n, 2)} mol of ${f(formula)}?`,
    steps: [
      {
        prompt: `How many ${el} atoms are in one unit of ${f(formula)}?`,
        answer: { kind: 'numeric', value: k, unit: `${el} atoms`, tolerance: 0 },
        hints: ['Read the subscript after the symbol.', 'A subscript after a bracket multiplies everything inside.', `Find ${el} in ${f(formula)}.`],
        explain: `One ${f(formula)} contains ${k} ${el} atoms, so one **mole** of ${f(formula)} contains ${k} **moles** of ${el}.`,
      },
      {
        prompt: `Calculate the moles of ${el} atoms.`,
        answer: { kind: 'numeric', value: n * k, unit: `mol ${el}`, sigFigs: 2 },
        hints: [
          'Moles work just like counts: the ratio in the formula is also a mole ratio.',
          `Multiply the moles of ${f(formula)} by ${k}.`,
          `${given(n, 2)} × ${k} = ?`,
        ],
        mistakes: [{ value: n * k * AVOGADRO, message: 'The question asks for **moles** of atoms, so you don’t need Avogadro’s number here.' }],
        explain: `${given(n, 2)} mol × ${k} = **${sf(n * k, 2)} mol ${el}**`,
      },
    ],
  };
}

function mostAtoms(rng: Rng): Question {
  const sets = [
    ['He', 'H2O', 'CH4'],
    ['Fe', 'CO2', 'NH3'],
    ['Ne', 'O2', 'C3H8'],
    ['Cu', 'H2O', 'C6H12O6'],
  ];
  const set = rng.pick(sets);
  const atomTotals = set.map((x) => Object.values(parseFormula(x)).reduce((a, b) => a + b, 0));
  const best = atomTotals.indexOf(Math.max(...atomTotals));
  const order = rng.shuffle([0, 1, 2]);
  return {
    prompt: `Each sample below is **1.00 mol**. Which one contains the most **atoms** in total?`,
    steps: [
      {
        prompt: 'Choose the sample with the most atoms.',
        answer: {
          kind: 'choice',
          options: order.map((i) => `1.00 mol ${f(set[i])}`),
          correct: order.indexOf(best),
        },
        hints: [
          'All three samples have the same number of **particles** (6.02 × 10^{23}).',
          'So compare how many atoms are in each particle.',
          `Count the atoms: ${set.map((x, i) => `${f(x)} has ${atomTotals[i]}`).join(', ')}.`,
        ],
        explain: `Equal moles means equal numbers of particles. ${f(set[best])} has ${atomTotals[best]} atoms per particle, the most of the three.`,
      },
    ],
  };
}

function sameNumber(rng: Rng): Question {
  const [a, b] = rng.shuffle(METALS).slice(0, 2);
  const options = [
    'They have the same number of atoms',
    `${f(a.formula)} has more atoms`,
    `${f(b.formula)} has more atoms`,
    'You need their masses to tell',
  ];
  return {
    prompt: `Compare 2.00 mol of ${named(a)} with 2.00 mol of ${named(b)}. Which statement is true?`,
    steps: [
      {
        prompt: 'Choose the true statement.',
        answer: {
          kind: 'choice',
          options,
          correct: 0,
          feedback: [
            undefined,
            'Their masses differ, but a mole is a count. What does 2.00 mol of anything contain?',
            'Their masses differ, but a mole is a count. What does 2.00 mol of anything contain?',
            'The mole is a counting unit, so you don’t need masses to compare counts.',
          ],
        },
        hints: [
          'A mole is a counting unit, like a dozen.',
          'Is 2 dozen apples the same number of items as 2 dozen watermelons?',
          `2.00 mol of anything = 2.00 × ${NA_TEXT} particles.`,
        ],
        explain: `Both contain 2.00 × ${NA_TEXT} = 1.20 × 10^{24} atoms. They have different **masses**, but the same **count**.`,
      },
    ],
  };
}

export const moleTopic: Topic = {
  meta: TOPIC_META['u1-mole'],
  summary: 'Atoms are far too small to count one by one, so chemists count them in bundles called moles.',
  learn: [
    {
      type: 'p',
      text: 'Atoms and molecules are incredibly small. A single drop of water holds about 1.7 × 10^{21} water molecules. That’s far too many to count one at a time, so chemists count particles in huge bundles called **moles**.',
    },
    {
      type: 'key',
      title: 'The mole',
      text: `1 mole (mol) = ${NA_TEXT} particles. This number is called **Avogadro’s number**, N_{A}.`,
    },
    {
      type: 'p',
      text: 'It works just like a dozen. A dozen always means 12, whether it’s eggs or cars. A mole always means 6.02 × 10^{23}, whether it’s atoms of gold or molecules of water.',
    },
    { type: 'h', text: 'What counts as a “particle”?' },
    {
      type: 'table',
      head: ['Type of substance', 'Particle', 'Examples'],
      rows: [
        ['Element (metals, noble gases)', 'atoms', `${f('Fe')}, ${f('Cu')}, ${f('He')}`],
        ['Molecular compound or diatomic element', 'molecules', `${f('H2O')}, ${f('CO2')}, ${f('O2')}`],
        ['Ionic compound (metal + non-metal)', 'formula units', `${f('NaCl')}, ${f('CaCl2')}`],
      ],
    },
    {
      type: 'background',
      title: 'Not sure what makes something ionic or molecular?',
      text: 'Ionic compounds usually contain a metal and a non-metal. Molecular compounds are non-metals bonded together. There’s a refresher in Chemistry Basics.',
      topicId: 'b-matter',
    },
    { type: 'h', text: 'Converting between moles and particles' },
    { type: 'equation', text: 'N = n × N_{A}', caption: 'N = number of particles, n = moles, N_{A} = 6.02 × 10^{23} /mol' },
    { type: 'equation', text: 'n = N ÷ N_{A}', caption: 'Rearranged to find moles' },
    {
      type: 'tip',
      text: 'Moles → particles: the number gets **much bigger**, so multiply. Particles → moles: the number gets **much smaller**, so divide. Use this to check your answer.',
    },
    { type: 'h', text: 'Atoms inside molecules' },
    {
      type: 'p',
      text: `One molecule of ${f('H2O')} contains 3 atoms: 2 H and 1 O. So 1 mol of ${f('H2O')} contains **2 mol of H atoms** and **1 mol of O atoms**. The subscripts in a formula work as a mole ratio too.`,
    },
    {
      type: 'tip',
      text: 'On your calculator, enter 6.02 × 10^{23} using the **EXP** or **×10^{x}** key (6.02 EXP 23). Typing “× 10 ^ 23” by hand can give wrong answers when you divide.',
    },
  ],
  examples: [
    {
      title: 'Moles to atoms',
      problem: `How many atoms are in 2.50 mol of copper, ${f('Cu')}?`,
      steps: [
        { label: 'Identify', work: 'Given n = 2.50 mol. Copper is an element, so we count **atoms**.' },
        { label: 'Choose the formula', work: 'Moles → particles, so N = n × N_{A}' },
        { label: 'Calculate', work: `N = 2.50 mol × ${NA_TEXT} /mol = 1.505 × 10^{24}` },
        { label: 'Round', work: '2.50 has 3 sig figs → 1.51 × 10^{24}' },
      ],
      answer: '1.51 × 10^{24} atoms of Cu',
    },
    {
      title: 'Molecules to moles',
      problem: `How many moles are in 3.01 × 10^{22} molecules of ${f('CO2')}?`,
      steps: [
        { label: 'Choose the formula', work: 'Particles → moles, so n = N ÷ N_{A}' },
        { label: 'Calculate', work: `n = 3.01 × 10^{22} ÷ ${NA_TEXT} /mol = 0.0500 mol` },
        { label: 'Check', work: 'Fewer than 6.02 × 10^{23} molecules, so less than 1 mol ✓' },
      ],
      answer: `0.0500 mol ${f('CO2')}`,
    },
    {
      title: 'Atoms inside molecules',
      problem: `How many hydrogen atoms are in 0.500 mol of methane, ${f('CH4')}?`,
      steps: [
        { label: 'Molecules', work: `N = 0.500 mol × ${NA_TEXT} /mol = 3.01 × 10^{23} molecules` },
        { label: 'Atoms per molecule', work: `Each ${f('CH4')} has 4 H atoms` },
        { label: 'Total', work: '3.01 × 10^{23} × 4 = 1.204 × 10^{24} → 1.20 × 10^{24}' },
      ],
      answer: '1.20 × 10^{24} H atoms',
    },
  ],
  stepGuide: [
    'Write down what you’re given (moles or particles) and what you need.',
    'Decide what particle you’re counting: atoms, molecules, or formula units.',
    `Moles → particles: **multiply** by ${NA_TEXT}. Particles → moles: **divide**.`,
    'If you need atoms *inside* a molecule, multiply by that atom’s subscript.',
    'Check the size makes sense, then round to the sig figs in the data and add units.',
  ],
  practice: [
    { id: 'mol-to-atoms', skill: 'moles → atoms', generate: (r) => molesToParticles(r, METALS) },
    { id: 'particles-to-mol', skill: 'particles → moles', generate: particlesToMoles },
    { id: 'particle-type', skill: 'choosing the particle', generate: particleType },
    { id: 'mol-to-molecules', skill: 'moles → molecules', generate: (r) => molesToParticles(r, MOLECULAR) },
    { id: 'atoms-in-molecules', skill: 'atoms inside molecules', generate: atomsInMolecules },
    { id: 'mol-to-formula-units', skill: 'moles → formula units', generate: (r) => molesToParticles(r, IONIC) },
    { id: 'moles-of-atoms', skill: 'moles of atoms in a compound', generate: molesOfAtoms },
    { id: 'most-atoms', skill: 'comparing atoms per mole', generate: mostAtoms },
    { id: 'same-number', skill: 'the mole is a count', generate: sameNumber },
    { id: 'particles-to-mol-2', skill: 'particles → moles', generate: particlesToMoles },
  ],
  videos: [
    {
      youtubeId: 'wI56mHUDJgQ',
      title: 'Introduction to Moles',
      channel: 'Tyler DeWitt',
      note: 'Why chemists count in moles, using the “dozen” idea.',
    },
    {
      youtubeId: 'hY7lzRBylSk',
      title: 'Counting Atoms: Intro to Moles Part 2',
      channel: 'Tyler DeWitt',
      note: 'Converting between moles and numbers of atoms and molecules.',
    },
  ],
};
