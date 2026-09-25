import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { mcTemplate, type MCItem } from '../quiz';
import { ELEMENT_BY_SYMBOL } from '../../data/elements';
import { formatDecimals } from '../../engine/numeric';
import type { Rng } from '../../engine/rng';

/** Common isotopes: [symbol, mass number]. */
const ISOTOPES: [string, number][] = [
  ['H', 1], ['H', 2], ['He', 4], ['Li', 7], ['C', 12], ['C', 14], ['N', 14], ['O', 16], ['O', 18], ['F', 19],
  ['Na', 23], ['Mg', 24], ['Al', 27], ['Si', 28], ['P', 31], ['S', 32], ['Cl', 35], ['Cl', 37], ['K', 39],
  ['Ca', 40], ['Fe', 56], ['Cu', 63], ['Zn', 64], ['Br', 79], ['Ag', 107], ['I', 127], ['Au', 197], ['U', 235], ['U', 238],
];

/** Common ions with a typical mass number. */
const IONS: [string, number, number][] = [
  ['Na', 23, 1], ['K', 39, 1], ['Mg', 24, 2], ['Ca', 40, 2], ['Al', 27, 3], ['O', 16, -2], ['S', 32, -2], ['F', 19, -1], ['Cl', 35, -1], ['N', 14, -3], ['Br', 79, -1],
];

const nameOf = (s: string) => ELEMENT_BY_SYMBOL[s].name;
const isoText = (s: string, a: number) => `${nameOf(s)}-${a} (^{${a}}${s})`;
const chargeText = (q: number) => `${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '−'}`;

function particles(rng: Rng): Question {
  const [s, a] = rng.pick(ISOTOPES);
  const z = ELEMENT_BY_SYMBOL[s].z;
  return {
    prompt: `An atom of ${isoText(s, a)} is neutral. How many protons, neutrons, and electrons does it have?`,
    steps: [
      {
        prompt: 'How many **protons**?',
        answer: { kind: 'numeric', value: z, unit: 'protons', tolerance: 0 },
        hints: ['Protons = atomic number.', 'Find the element on the periodic chart.', `${nameOf(s)} is element number ${z}.`],
        mistakes: [{ value: a, message: 'That’s the mass number. Protons = the **atomic** number.' }],
        explain: `Atomic number ${z} → ${z} protons.`,
      },
      {
        prompt: 'How many **neutrons**?',
        answer: { kind: 'numeric', value: a - z, unit: 'neutrons', tolerance: 0 },
        hints: ['Mass number = protons + neutrons.', 'Neutrons = mass number − atomic number.', `${a} − ${z} = ?`],
        mistakes: [{ value: a + z, message: 'Subtract: neutrons = mass number − protons.' }],
        explain: `${a} − ${z} = ${a - z} neutrons.`,
      },
      {
        prompt: 'How many **electrons**?',
        answer: { kind: 'numeric', value: z, unit: 'electrons', tolerance: 0 },
        hints: ['The atom is neutral.', 'Neutral means the negatives cancel the positives.', 'Electrons = protons in a neutral atom.'],
        explain: `Neutral atom → electrons = protons = ${z}.`,
      },
    ],
  };
}

function ionParticles(rng: Rng): Question {
  const [s, a, q] = rng.pick(IONS);
  const z = ELEMENT_BY_SYMBOL[s].z;
  const e = z - q;
  return {
    prompt: `How many electrons are in the ion ^{${a}}[[${s}^{${chargeText(q)}}]]?`,
    steps: [
      {
        prompt: 'How many protons does it have?',
        answer: { kind: 'numeric', value: z, unit: 'protons', tolerance: 0 },
        hints: ['Protons never change when an ion forms.', 'Protons = atomic number.', `${nameOf(s)} is element ${z}.`],
        explain: `${z} protons (same as the atom).`,
      },
      {
        prompt: 'How many electrons does the ion have?',
        answer: { kind: 'numeric', value: e, unit: 'electrons', tolerance: 0 },
        hints: [
          q > 0 ? 'A positive ion has **lost** electrons.' : 'A negative ion has **gained** electrons.',
          `The charge ${chargeText(q)} tells you how many.`,
          `${z} ${q > 0 ? '−' : '+'} ${Math.abs(q)} = ?`,
        ],
        mistakes: [
          { value: z + q, message: q > 0 ? 'A positive ion has **fewer** electrons: it lost them.' : 'A negative ion has **more** electrons: it gained them.' },
        ],
        explain: `${z} protons, charge ${chargeText(q)} → ${e} electrons.`,
      },
    ],
  };
}

function whichIsotope(rng: Rng): Question {
  const [s, a] = rng.pick(ISOTOPES.filter(([, m]) => m > 2));
  const z = ELEMENT_BY_SYMBOL[s].z;
  const n = a - z;
  const opts = rng.shuffle([a, a + 1, a - 1, z + 0 === a ? a + 2 : z]).filter((v, i, arr) => arr.indexOf(v) === i);
  return {
    prompt: `An atom of ${nameOf(s)} has ${n} neutrons. What is its mass number?`,
    steps: [
      {
        prompt: 'Choose the mass number.',
        answer: { kind: 'choice', options: opts.map(String), correct: opts.indexOf(a) },
        hints: ['Mass number = protons + neutrons.', `${nameOf(s)} has ${z} protons.`, `${z} + ${n} = ?`],
        explain: `${z} + ${n} = ${a}, so it’s ${isoText(s, a)}.`,
      },
    ],
  };
}

const AVG = [
  { s: 'Cl', iso: [[34.97, 75.78], [36.97, 24.22]] },
  { s: 'B', iso: [[10.01, 19.9], [11.01, 80.1]] },
  { s: 'Cu', iso: [[62.93, 69.15], [64.93, 30.85]] },
  { s: 'Li', iso: [[6.02, 7.59], [7.02, 92.41]] },
  { s: 'Br', iso: [[78.92, 50.69], [80.92, 49.31]] },
  { s: 'Mg', iso: [[23.99, 78.99], [24.99, 10.0], [25.98, 11.01]] },
];

function averageMass(rng: Rng): Question {
  const { s, iso } = rng.pick(AVG);
  const avg = iso.reduce((sum, [m, p]) => sum + (m * p) / 100, 0);
  const list = iso.map(([m, p]) => `${formatDecimals(p, 2)}% with a mass of ${formatDecimals(m, 2)}`).join('; ');
  return {
    prompt: `Naturally occurring ${nameOf(s)} is ${list}. What is its average atomic mass?`,
    steps: [
      {
        prompt: 'Calculate the weighted average.',
        answer: { kind: 'numeric', value: avg, unit: 'u', decimals: 2, showRoundingNote: false, tolerance: 0.001 },
        hints: [
          'It’s a **weighted** average: common isotopes count more.',
          'Change each % to a decimal and multiply by that isotope’s mass, then add.',
          iso.map(([m, p]) => `${formatDecimals(m, 2)} × ${formatDecimals(p / 100, 4)}`).join(' + '),
        ],
        mistakes: [
          { value: iso.reduce((x, [m]) => x + m, 0) / iso.length, message: 'That’s a plain average. Weight each isotope by how common it is.' },
          { value: avg * 100, message: 'Change the percentages to decimals first (75.78% → 0.7578).' },
        ],
        explain: `${iso.map(([m, p]) => `${formatDecimals(m, 2)}(${formatDecimals(p / 100, 4)})`).join(' + ')} = **${formatDecimals(avg, 2)}**, which matches the periodic chart (${ELEMENT_BY_SYMBOL[s].mass.toFixed(2)}).`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'Which particle has a **negative** charge?',
    correct: 'electron',
    wrong: ['proton', 'neutron', 'nucleus'],
    hints: ['Three subatomic particles: proton, neutron, electron.', 'Protons are positive; neutrons have no charge.', 'The negative one moves around the nucleus.'],
    explain: 'Electrons are negative (−1). Protons are positive (+1). Neutrons are neutral.',
  },
  {
    q: 'Where is almost all of an atom’s mass?',
    correct: 'In the nucleus',
    wrong: ['In the electron cloud', 'Spread evenly through the atom', 'In the electrons'],
    hints: ['Electrons are very light, about 1/1836 the mass of a proton.', 'Protons and neutrons are much heavier.', 'Where are the protons and neutrons?'],
    explain: 'Protons and neutrons (in the nucleus) make up almost all the mass. Electrons are tiny.',
  },
  {
    q: 'Isotopes of the same element have…',
    correct: 'the same number of protons but different numbers of neutrons',
    wrong: ['different numbers of protons', 'the same mass number', 'different numbers of electrons in the neutral atom'],
    hints: ['The number of protons decides which element it is.', 'Isotopes are the same element.', 'So what can change?'],
    explain: 'Same element → same protons. Isotopes differ in **neutrons**, so their mass numbers differ.',
  },
  {
    q: 'What does the atomic number tell you?',
    correct: 'The number of protons',
    wrong: ['The number of neutrons', 'Protons + neutrons', 'The mass of the atom in grams'],
    hints: ['Every atom of an element has the same one.', 'It’s the whole number on the periodic chart.', 'It identifies the element.'],
    explain: 'Atomic number = number of protons, which identifies the element.',
  },
  {
    q: 'Why is the average atomic mass of chlorine (35.45) not a whole number?',
    correct: 'It’s a weighted average of chlorine’s isotopes',
    wrong: ['Chlorine atoms have half a neutron', 'It’s rounded incorrectly', 'Electrons add the extra 0.45'],
    hints: ['Not all chlorine atoms are identical.', 'Chlorine has two common isotopes, Cl-35 and Cl-37.', 'The chart shows an average.'],
    explain: 'About 76% of Cl atoms are Cl-35 and 24% are Cl-37. The weighted average is 35.45.',
  },
];

export const atomsTopic: Topic = {
  meta: TOPIC_META['b-atoms'],
  summary: 'Atoms are made of protons, neutrons, and electrons. Their numbers tell you the element, the isotope, and the charge.',
  learn: [
    {
      type: 'table',
      head: ['Particle', 'Charge', 'Location', 'Relative mass'],
      rows: [
        ['proton (p^{+})', '+1', 'nucleus', '1'],
        ['neutron (n^{0})', '0', 'nucleus', '1'],
        ['electron (e^{−})', '−1', 'around the nucleus', '≈ 1/1836'],
      ],
    },
    { type: 'key', title: 'The key numbers', text: '**Atomic number** = protons. **Mass number** = protons + neutrons. In a neutral atom, electrons = protons.' },
    { type: 'equation', text: 'neutrons = mass number − atomic number' },
    { type: 'h', text: 'Isotopes' },
    {
      type: 'p',
      text: 'Atoms of the same element always have the same number of protons, but they can have different numbers of neutrons. These are **isotopes**. Carbon-12 (^{12}C) has 6 neutrons; carbon-14 (^{14}C) has 8.',
    },
    {
      type: 'p',
      text: 'The molar mass on the periodic chart is a **weighted average** of an element’s isotopes, which is why it usually isn’t a whole number.',
    },
    { type: 'equation', text: 'average = (mass₁ × fraction₁) + (mass₂ × fraction₂) + …' },
    { type: 'h', text: 'Ions' },
    {
      type: 'p',
      text: 'An ion has gained or lost electrons. Protons never change. **Positive ions lost electrons**; **negative ions gained electrons**. Mg^{2+} has 12 protons and 10 electrons.',
    },
  ],
  examples: [
    {
      title: 'Counting particles',
      problem: 'How many protons, neutrons, and electrons are in a neutral atom of chlorine-37?',
      steps: [
        { label: 'Protons', work: 'Atomic number of Cl = 17 → 17 protons' },
        { label: 'Neutrons', work: '37 − 17 = 20 neutrons' },
        { label: 'Electrons', work: 'Neutral → 17 electrons' },
      ],
      answer: '17 p, 20 n, 17 e',
    },
    {
      title: 'Weighted average',
      problem: 'Boron is 19.9% boron-10 (10.01) and 80.1% boron-11 (11.01). Find its average atomic mass.',
      steps: [
        { label: 'Decimals', work: '19.9% → 0.199, 80.1% → 0.801' },
        { label: 'Multiply and add', work: '10.01(0.199) + 11.01(0.801) = 1.992 + 8.819 = 10.81' },
      ],
      answer: '10.81 (matches the periodic chart)',
    },
  ],
  stepGuide: [
    'Protons = atomic number (from the periodic chart).',
    'Neutrons = mass number − atomic number.',
    'Electrons = protons − charge (a 2+ ion has 2 fewer; a 2− ion has 2 more).',
    'Average atomic mass = Σ (isotope mass × fraction).',
  ],
  practice: [
    { id: 'particles', skill: 'protons, neutrons, electrons', generate: particles },
    mcTemplate('concepts', 'subatomic particles and isotopes', concepts),
    { id: 'ions', skill: 'electrons in ions', generate: ionParticles },
    { id: 'mass-number', skill: 'mass number', generate: whichIsotope },
    { id: 'particles-2', skill: 'protons, neutrons, electrons', generate: particles },
    { id: 'average', skill: 'average atomic mass', generate: averageMass },
    mcTemplate('concepts-2', 'subatomic particles and isotopes', concepts),
    { id: 'ions-2', skill: 'electrons in ions', generate: ionParticles },
    { id: 'particles-3', skill: 'protons, neutrons, electrons', generate: particles },
    { id: 'average-2', skill: 'average atomic mass', generate: averageMass },
  ],
  videos: [
    {
      youtubeId: "tW_ItPxFwvY",
      title: "Protons, Neutrons, Electrons, Isotopes and Average Mass",
      channel: "The Organic Chemistry Tutor",
      note: "Counting particles, isotopes, ions, and average atomic mass.",
    },
    {
      youtubeId: "WX3JlcwkdLU",
      title: "Atomic Structure, Isotopes and Average Atomic Mass",
      channel: "Jazz Sommers",
      note: "A second walkthrough with more worked examples.",
    },
  ],
};
