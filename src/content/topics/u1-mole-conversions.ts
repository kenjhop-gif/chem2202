import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import {
  AVOGADRO,
  GASES,
  IONIC,
  MOLAR_VOLUME_STP,
  MOLECULAR,
  NA_TEXT,
  f,
  given,
  measured,
  mm,
  named,
  sf,
} from '../substances';
import { molarMass } from '../../engine/formula';
import { molarMassStep } from '../molarMassHelpers';
import { cleanFloat } from '../../engine/numeric';
import type { Rng } from '../../engine/rng';

const MASS_POOL = [...MOLECULAR.filter((s) => s.formula !== 'H2'), ...IONIC];

function massToMoles(rng: Rng): Question {
  const s = rng.pick(MASS_POOL);
  const sig = rng.pick([2, 3, 3, 4]);
  const m = measured(rng, 1, 99, sig);
  const M = molarMass(s.formula);
  const n = m / M;
  return {
    prompt: `How many moles are in ${given(m, sig)} g of ${named(s)}?`,
    steps: [
      molarMassStep(s.formula),
      {
        prompt: `Calculate the moles in ${given(m, sig)} g.`,
        answer: { kind: 'numeric', value: n, unit: 'mol', sigFigs: sig },
        hints: [
          'Grams → moles: which way does the unit g/mol need to go so grams cancel?',
          'n = m ÷ M',
          `${given(m, sig)} g ÷ ${mm(M)} g/mol = ?`,
        ],
        mistakes: [
          { value: m * M, message: 'You multiplied. That gives g × g/mol, which isn’t moles. Divide the mass by the molar mass.' },
          { value: M / m, message: 'You divided the wrong way around. Put the mass on top: n = m ÷ M.' },
        ],
        explain: `n = ${given(m, sig)} g ÷ ${mm(M)} g/mol = **${sf(n, sig)} mol**`,
      },
    ],
  };
}

function molesToMass(rng: Rng, unitChoice = false): Question {
  const s = rng.pick(MASS_POOL);
  const sig = rng.pick([2, 3, 3, 4]);
  const n = measured(rng, 0.1, 5, sig);
  const M = molarMass(s.formula);
  const m = n * M;
  return {
    prompt: `What is the mass of ${given(n, sig)} mol of ${named(s)}?`,
    steps: [
      molarMassStep(s.formula),
      {
        prompt: unitChoice ? 'Calculate the mass, and choose its unit.' : 'Calculate the mass.',
        answer: {
          kind: 'numeric',
          value: m,
          unit: 'g',
          sigFigs: sig,
          ...(unitChoice ? { unitChoices: ['g', 'mol', 'g/mol', 'L'] } : {}),
        },
        hints: [
          'Moles → grams: each mole has a mass of M grams.',
          'm = n × M',
          `${given(n, sig)} mol × ${mm(M)} g/mol = ?`,
        ],
        mistakes: [
          { value: n / M, message: 'You divided. Each mole weighs M grams, so multiply: m = n × M.' },
          { value: M / n, message: 'Moles → grams means multiplying: m = n × M.' },
        ],
        explain: `m = ${given(n, sig)} mol × ${mm(M)} g/mol = **${sf(m, sig)} g**`,
      },
    ],
  };
}

function massToParticles(rng: Rng): Question {
  const s = rng.pick(MASS_POOL);
  const m = measured(rng, 1, 99, 3);
  const M = molarMass(s.formula);
  const n = m / M;
  const N = n * AVOGADRO;
  return {
    prompt: `How many ${s.particle} are in ${given(m, 3)} g of ${named(s)}?`,
    steps: [
      molarMassStep(s.formula),
      {
        prompt: 'Convert the mass to moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['Always go through moles first.', 'n = m ÷ M', `${given(m, 3)} ÷ ${mm(M)} = ?`],
        mistakes: [{ value: m * M, message: 'Grams → moles: divide by the molar mass.' }],
        explain: `n = ${given(m, 3)} g ÷ ${mm(M)} g/mol = ${sf(n, 4)} mol (keep an extra digit for now)`,
      },
      {
        prompt: `Convert moles to ${s.particle}.`,
        answer: { kind: 'numeric', value: N, unit: s.particle, sigFigs: 3, expectScientific: true },
        hints: ['Moles → particles.', 'N = n × N_{A}', `${sf(n, 4)} × ${NA_TEXT} = ?`],
        mistakes: [{ value: n / AVOGADRO, message: 'Moles → particles should give a huge number, so multiply.' }],
        explain: `N = ${sf(n, 4)} mol × ${NA_TEXT} /mol = **${sf(N, 3)} ${s.particle}**`,
      },
    ],
    finalMistakes: [
      { value: n, message: 'That’s the number of moles. You’re one step away: convert moles to particles.' },
      { value: m * AVOGADRO, message: 'You need to change grams into moles before using Avogadro’s number.' },
    ],
  };
}

function particlesToMass(rng: Rng): Question {
  const s = rng.pick(MASS_POOL);
  const N = cleanFloat(measured(rng, 1, 9.99, 3) * 10 ** rng.int(22, 24));
  const n = N / AVOGADRO;
  const M = molarMass(s.formula);
  const m = n * M;
  return {
    prompt: `What is the mass of ${sf(N, 3)} ${s.particle} of ${named(s)}?`,
    steps: [
      {
        prompt: 'Convert the particles to moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['Go through moles first.', 'n = N ÷ N_{A}', `${sf(N, 3)} ÷ ${NA_TEXT} = ?`],
        mistakes: [{ value: N * AVOGADRO, message: 'Particles → moles: divide by Avogadro’s number.' }],
        explain: `n = ${sf(N, 3)} ÷ ${NA_TEXT} = ${sf(n, 4)} mol`,
      },
      molarMassStep(s.formula),
      {
        prompt: 'Convert moles to mass.',
        answer: { kind: 'numeric', value: m, unit: 'g', sigFigs: 3 },
        hints: ['Moles → grams.', 'm = n × M', `${sf(n, 4)} × ${mm(M)} = ?`],
        mistakes: [{ value: n / M, message: 'Moles → grams: multiply by the molar mass.' }],
        explain: `m = ${sf(n, 4)} mol × ${mm(M)} g/mol = **${sf(m, 3)} g**`,
      },
    ],
    finalMistakes: [{ value: n, message: 'That’s the number of moles. One more step: convert moles to grams.' }],
  };
}

function volumeToMoles(rng: Rng): Question {
  const s = rng.pick(GASES);
  const V = measured(rng, 1, 99, 3);
  const n = V / MOLAR_VOLUME_STP;
  const order = rng.shuffle([0, 1, 2]);
  const ops = ['V ÷ 22.7 L/mol', 'V × 22.7 L/mol', '22.7 L/mol ÷ V'];
  return {
    prompt: `How many moles of ${named(s)} are in ${given(V, 3)} L of the gas at STP?`,
    steps: [
      {
        prompt: 'Which calculation turns a gas volume at STP into moles?',
        answer: { kind: 'choice', options: order.map((i) => ops[i]), correct: order.indexOf(0) },
        hints: [
          'At STP, 1 mol of any gas takes up 22.7 L.',
          'How many “22.7 L bundles” fit in the volume?',
          'n = V ÷ 22.7 L/mol',
        ],
        explain: 'At STP, **n = V ÷ 22.7 L/mol**. The litres cancel, leaving moles.',
      },
      {
        prompt: 'Calculate the moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol', sigFigs: 3 },
        hints: ['n = V ÷ 22.7 L/mol', 'Divide the volume by 22.7.', `${given(V, 3)} ÷ 22.7 = ?`],
        mistakes: [{ value: V * MOLAR_VOLUME_STP, message: 'You multiplied. Divide the volume by 22.7 L/mol.' }],
        explain: `n = ${given(V, 3)} L ÷ 22.7 L/mol = **${sf(n, 3)} mol**`,
      },
    ],
  };
}

function molesToVolume(rng: Rng): Question {
  const s = rng.pick(GASES);
  const n = measured(rng, 0.1, 4.99, 3);
  const V = n * MOLAR_VOLUME_STP;
  return {
    prompt: `What volume does ${given(n, 3)} mol of ${named(s)} occupy at STP?`,
    steps: [
      {
        prompt: 'Calculate the volume.',
        answer: { kind: 'numeric', value: V, unit: 'L', sigFigs: 3 },
        hints: ['At STP, each mole of gas takes up 22.7 L.', 'V = n × 22.7 L/mol', `${given(n, 3)} × 22.7 = ?`],
        mistakes: [{ value: n / MOLAR_VOLUME_STP, message: 'You divided. Each mole takes up 22.7 L, so multiply.' }],
        explain: `V = ${given(n, 3)} mol × 22.7 L/mol = **${sf(V, 3)} L**`,
      },
    ],
  };
}

function massToVolume(rng: Rng): Question {
  const s = rng.pick(GASES.filter((g) => g.formula !== 'H2'));
  const m = measured(rng, 1, 99, 3);
  const M = molarMass(s.formula);
  const n = m / M;
  const V = n * MOLAR_VOLUME_STP;
  return {
    prompt: `What volume does ${given(m, 3)} g of ${named(s)} occupy at STP?`,
    steps: [
      molarMassStep(s.formula),
      {
        prompt: 'Convert the mass to moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['Go through moles first.', 'n = m ÷ M', `${given(m, 3)} ÷ ${mm(M)} = ?`],
        mistakes: [{ value: m * M, message: 'Grams → moles: divide by the molar mass.' }],
        explain: `n = ${given(m, 3)} g ÷ ${mm(M)} g/mol = ${sf(n, 4)} mol`,
      },
      {
        prompt: 'Convert moles to volume at STP.',
        answer: { kind: 'numeric', value: V, unit: 'L', sigFigs: 3 },
        hints: ['Each mole of gas at STP is 22.7 L.', 'V = n × 22.7 L/mol', `${sf(n, 4)} × 22.7 = ?`],
        mistakes: [{ value: n / MOLAR_VOLUME_STP, message: 'Moles → litres: multiply by 22.7 L/mol.' }],
        explain: `V = ${sf(n, 4)} mol × 22.7 L/mol = **${sf(V, 3)} L**`,
      },
    ],
    finalMistakes: [{ value: n, message: 'That’s the number of moles. One more step: convert moles to litres.' }],
  };
}

function volumeToParticles(rng: Rng): Question {
  const s = rng.pick(GASES);
  const V = measured(rng, 1, 99, 3);
  const n = V / MOLAR_VOLUME_STP;
  const N = n * AVOGADRO;
  return {
    prompt: `How many ${s.particle} are in ${given(V, 3)} L of ${named(s)} at STP?`,
    steps: [
      {
        prompt: 'Convert the volume to moles.',
        answer: { kind: 'numeric', value: n, unit: 'mol' },
        hints: ['Go through moles first.', 'n = V ÷ 22.7 L/mol', `${given(V, 3)} ÷ 22.7 = ?`],
        mistakes: [{ value: V * MOLAR_VOLUME_STP, message: 'Litres → moles: divide by 22.7 L/mol.' }],
        explain: `n = ${given(V, 3)} L ÷ 22.7 L/mol = ${sf(n, 4)} mol`,
      },
      {
        prompt: `Convert moles to ${s.particle}.`,
        answer: { kind: 'numeric', value: N, unit: s.particle, sigFigs: 3, expectScientific: true },
        hints: ['Moles → particles.', 'N = n × N_{A}', `${sf(n, 4)} × ${NA_TEXT} = ?`],
        mistakes: [{ value: n / AVOGADRO, message: 'Moles → particles should give a huge number, so multiply.' }],
        explain: `N = ${sf(n, 4)} mol × ${NA_TEXT} = **${sf(N, 3)} ${s.particle}**`,
      },
    ],
    finalMistakes: [{ value: n, message: 'That’s the number of moles. One more step: convert moles to particles.' }],
  };
}

function whichConversion(rng: Rng): Question {
  const cases = [
    {
      q: `A student has 12.0 g of ${f('NaCl')} and wants the number of moles.`,
      options: ['Divide by the molar mass', 'Multiply by the molar mass', 'Divide by 22.7 L/mol', 'Multiply by 6.022 × 10^{23}'],
      correct: 0,
      explain: 'Grams → moles: divide by the molar mass (n = m ÷ M).',
    },
    {
      q: `A student has 0.50 mol of ${f('H2O')} and wants the number of molecules.`,
      options: ['Multiply by 6.022 × 10^{23}', 'Divide by 6.022 × 10^{23}', 'Multiply by the molar mass', 'Multiply by 22.7 L/mol'],
      correct: 0,
      explain: 'Moles → particles: multiply by Avogadro’s number.',
    },
    {
      q: `A student has 5.0 g of liquid water, ${f('H2O')}, and wants its volume. Can they use 22.7 L/mol?`,
      options: ['No, 22.7 L/mol only works for gases at STP', 'Yes, it works for any substance', 'Yes, if it’s at room temperature', 'Only for ionic compounds'],
      correct: 0,
      explain: 'Molar volume (22.7 L/mol) applies only to **gases at STP**. It doesn’t work for liquids or solids.',
    },
    {
      q: `A student has 3.0 × 10^{23} atoms of ${f('Fe')} and wants the mass.`,
      options: [
        'Divide by 6.022 × 10^{23}, then multiply by the molar mass',
        'Multiply by the molar mass, then divide by 6.022 × 10^{23}',
        'Multiply by 6.022 × 10^{23}, then multiply by the molar mass',
        'Divide by the molar mass',
      ],
      correct: 0,
      explain: 'Particles → moles (÷ N_{A}), then moles → grams (× M). Always go through moles.',
    },
  ];
  const c = rng.pick(cases);
  const order = rng.shuffle(c.options.map((_, i) => i));
  return {
    prompt: c.q,
    steps: [
      {
        prompt: 'What should they do?',
        answer: { kind: 'choice', options: order.map((i) => c.options[i]), correct: order.indexOf(c.correct) },
        hints: [
          'Picture the mole map: mass ⇄ moles ⇄ particles, and gas volume ⇄ moles.',
          'Every conversion goes through moles.',
          'Going *to* moles you divide; going *from* moles you multiply.',
        ],
        explain: c.explain,
      },
    ],
  };
}

export const moleConversionsTopic: Topic = {
  meta: TOPIC_META['u1-mole-conversions'],
  summary: 'Moles are the hub: from moles you can get to mass, number of particles, or gas volume, and back.',
  learn: [
    {
      type: 'p',
      text: 'In the lab you measure **mass** (on a balance) or **volume** (for gases). But chemical formulas and equations work in **moles**. This topic ties them all together.',
    },
    {
      type: 'key',
      title: 'The mole map',
      text: 'Every conversion goes **through moles**. To get to moles, divide. To leave moles, multiply.',
    },
    {
      type: 'table',
      head: ['Convert between', 'To get moles', 'From moles'],
      rows: [
        ['Mass (g)', 'n = m ÷ M', 'm = n × M'],
        ['Particles', 'n = N ÷ N_{A}', 'N = n × N_{A}'],
        ['Gas volume at STP (L)', 'n = V ÷ 22.7 L/mol', 'V = n × 22.7 L/mol'],
      ],
    },
    { type: 'h', text: 'Molar volume of a gas' },
    {
      type: 'p',
      text: '**STP** means standard temperature and pressure: 0.00 °C and 100.0 kPa (as on your data table). At STP, one mole of **any gas** takes up **22.7 L**. This is called the **molar volume**.',
    },
    {
      type: 'tip',
      text: 'Molar volume only works for **gases at STP**. Never use 22.7 L/mol for a solid, a liquid, or a solution.',
    },
    { type: 'h', text: 'Two-step problems' },
    {
      type: 'p',
      text: 'To go from grams to particles (or litres to grams, and so on), do it in two steps: first convert to moles, then convert from moles to what you need.',
    },
    {
      type: 'tip',
      text: 'Write units on every number. If the units cancel to what you want (g ÷ g/mol = mol), your setup is right.',
    },
    {
      type: 'background',
      title: 'Rounding to the right sig figs',
      text: 'Keep an extra digit in the middle of a problem and round only at the end, to the fewest sig figs in the data you were given.',
      topicId: 'b-measurement',
    },
  ],
  examples: [
    {
      title: 'Grams to moles',
      problem: `How many moles are in 25.0 g of sodium chloride, ${f('NaCl')}?`,
      steps: [
        { label: 'Molar mass', work: 'M = 22.99 + 35.45 = 58.44 g/mol' },
        { label: 'Convert', work: 'n = m ÷ M = 25.0 g ÷ 58.44 g/mol = 0.42779 mol' },
        { label: 'Round', work: '25.0 has 3 sig figs → 0.428 mol' },
      ],
      answer: `0.428 mol ${f('NaCl')}`,
    },
    {
      title: 'Moles to grams',
      problem: `What is the mass of 0.750 mol of water, ${f('H2O')}?`,
      steps: [
        { label: 'Molar mass', work: 'M = 2(1.01) + 16.00 = 18.02 g/mol' },
        { label: 'Convert', work: 'm = n × M = 0.750 mol × 18.02 g/mol = 13.515 g' },
        { label: 'Round', work: '3 sig figs → 13.5 g' },
      ],
      answer: `13.5 g ${f('H2O')}`,
    },
    {
      title: 'Two steps: litres to molecules',
      problem: `How many molecules are in 45.4 L of oxygen gas, ${f('O2')}, at STP?`,
      steps: [
        { label: 'To moles', work: 'n = V ÷ 22.7 L/mol = 45.4 L ÷ 22.7 L/mol = 2.00 mol' },
        { label: 'To molecules', work: `N = n × N_{A} = 2.00 mol × ${NA_TEXT} /mol = 1.2044 × 10^{24} → 1.20 × 10^{24}` },
      ],
      answer: `1.20 × 10^{24} molecules of ${f('O2')}`,
    },
  ],
  stepGuide: [
    'Write down what you’re given (with its unit) and what you need.',
    'Convert what you’re given **to moles**: ÷ M (grams), ÷ N_{A} (particles), or ÷ 22.7 L/mol (gas at STP).',
    'Convert **from moles** to what you need: × M, × N_{A}, or × 22.7 L/mol.',
    'Check that the units cancel. Round to the sig figs of the given data.',
  ],
  practice: [
    { id: 'm-to-n', skill: 'grams → moles', generate: massToMoles },
    { id: 'n-to-m', skill: 'moles → grams', generate: (r) => molesToMass(r) },
    { id: 'which', skill: 'choosing the conversion', generate: whichConversion },
    { id: 'v-to-n', skill: 'gas volume → moles', generate: volumeToMoles },
    { id: 'n-to-v', skill: 'moles → gas volume', generate: molesToVolume },
    { id: 'n-to-m-unit', skill: 'moles → grams (with units)', generate: (r) => molesToMass(r, true) },
    { id: 'm-to-N', skill: 'grams → particles', generate: massToParticles },
    { id: 'N-to-m', skill: 'particles → grams', generate: particlesToMass },
    { id: 'm-to-v', skill: 'grams → gas volume', generate: massToVolume },
    { id: 'v-to-N', skill: 'gas volume → particles', generate: volumeToParticles },
    { id: 'which-2', skill: 'choosing the conversion', generate: whichConversion },
    { id: 'm-to-n-2', skill: 'grams → moles', generate: massToMoles },
  ],
  videos: [
    {
      youtubeId: 'CMnkSb2YsXI',
      title: 'Converting Between Grams and Moles',
      channel: 'Tyler DeWitt',
      note: 'Grams ⇄ moles with molar mass, step by step.',
    },
    {
      youtubeId: 'jOjhzZ6JEcM',
      title: 'Moles: Converting Between Grams and Particles',
      channel: 'Tanya Meador',
      note: 'Two-step problems through moles. (Gas volume at STP isn’t covered here. See the Learn tab.)',
    },
  ],
};


