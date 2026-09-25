import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, sf } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { AMMONIUM, FIXED_CATIONS, MONATOMIC_ANIONS, MULTIVALENT_CATIONS, POLYATOMIC_ANIONS, ionic } from '../ions';
import { isSoluble, solubilityReason } from '../solubility';
import type { Rng } from '../../engine/rng';

/** Approximate solubilities in g per 100 mL of water at 20 °C. */
const SOLIDS = [
  { formula: 'KNO3', name: 'potassium nitrate', s: 31.6 },
  { formula: 'NaCl', name: 'sodium chloride', s: 36.0 },
  { formula: 'KCl', name: 'potassium chloride', s: 34.2 },
  { formula: 'NH4Cl', name: 'ammonium chloride', s: 37.2 },
  { formula: 'CuSO4', name: 'copper(II) sulfate', s: 32.0 },
  { formula: 'C12H22O11', name: 'sucrose', s: 204 },
];

function scaleSolubility(rng: Rng): Question {
  const c = rng.pick(SOLIDS);
  const v = measured(rng, 20, 500, 3);
  const m = (c.s * v) / 100;
  return {
    prompt: `The solubility of ${c.name}, ${f(c.formula)}, is ${c.s} g per 100 mL of water at 20 °C. What is the maximum mass that dissolves in ${given(v, 3)} mL?`,
    steps: [
      {
        prompt: 'Calculate the maximum mass.',
        answer: { kind: 'numeric', value: m, unit: 'g', sigFigs: 3 },
        hints: ['Solubility is a rate: grams per 100 mL.', 'Scale it: how many “100 mL” are in your volume?', `${c.s} g × (${given(v, 3)} ÷ 100) = ?`],
        mistakes: [{ value: c.s * v, message: 'The solubility is per **100** mL. Divide the volume by 100 first.' }],
        explain: `${c.s} g/100 mL × ${given(v, 3)} mL = **${sf(m, 3)} g**`,
      },
    ],
  };
}

function saturatedOrNot(rng: Rng): Question {
  const c = rng.pick(SOLIDS);
  const v = measured(rng, 50, 400, 3);
  const max = (c.s * v) / 100;
  const factor = rng.pick([0.5, 0.8, 1.0, 1.4]);
  const m = Number((max * factor).toPrecision(3));
  const kind = factor < 1 ? 'unsaturated' : factor === 1 ? 'saturated' : 'saturated, with extra solid left undissolved';
  const options = ['unsaturated', 'saturated', 'saturated, with extra solid left undissolved'];
  return {
    prompt: `At 20 °C, ${c.name} dissolves up to ${c.s} g per 100 mL. A student stirs ${given(m, 3)} g into ${given(v, 3)} mL of water. What happens?`,
    steps: [
      {
        prompt: 'What is the most that can dissolve in this volume?',
        answer: { kind: 'numeric', value: max, unit: 'g', sigFigs: 3 },
        hints: ['Scale the solubility to this volume.', `${c.s} × ${given(v, 3)} ÷ 100`, 'Compare it with the mass added.'],
        explain: `Maximum = ${sf(max, 3)} g`,
      },
      {
        prompt: 'So the solution is…',
        answer: { kind: 'choice', options, correct: options.indexOf(kind) },
        hints: ['Less than the maximum → everything dissolves.', 'Exactly the maximum → saturated.', 'More than the maximum → the extra stays solid at the bottom.'],
        explain: `${given(m, 3)} g vs a maximum of ${sf(max, 3)} g → **${kind}**.`,
      },
    ],
  };
}

const CATIONS = [...FIXED_CATIONS, MULTIVALENT_CATIONS[1], MULTIVALENT_CATIONS[3], MULTIVALENT_CATIONS[4], AMMONIUM];
const ANIONS = [MONATOMIC_ANIONS[1], MONATOMIC_ANIONS[2], MONATOMIC_ANIONS[3], MONATOMIC_ANIONS[5], POLYATOMIC_ANIONS[0], POLYATOMIC_ANIONS[1], POLYATOMIC_ANIONS[7], POLYATOMIC_ANIONS[9], POLYATOMIC_ANIONS[12]];

function tableLookup(rng: Rng): Question {
  // Bias toward interesting (low-solubility) cases.
  let cation = rng.pick(CATIONS);
  let anion = rng.pick(ANIONS);
  for (let i = 0; i < 3 && isSoluble(cation, anion) && rng.next() < 0.6; i++) {
    cation = rng.pick(CATIONS);
    anion = rng.pick(ANIONS);
  }
  const c = ionic(cation, anion);
  const sol = isSoluble(cation, anion);
  const options = ['high solubility (aq)', 'low solubility (s)'];
  return {
    prompt: `Using the solubility table on your data sheet, is ${f(c.formula)} high or low solubility in water?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: sol ? 0 : 1 },
        hints: [
          'Find the negative ion’s column in the table first.',
          'Group 1, ammonium, nitrates, and chlorates are always high solubility.',
          `Look up ${c.anion.name} with ${c.cation.name}.`,
        ],
        explain: `${f(c.formula)}: **${sol ? 'high solubility (aq)' : 'low solubility (s)'}**. ${solubilityReason(cation, anion)}`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'In a saturated solution with undissolved solid at the bottom, what is happening?',
    correct: 'Solid dissolves and ions crystallize at the same rate',
    wrong: ['Nothing: all dissolving has stopped', 'The solid keeps dissolving until it’s gone', 'Ions only leave the solid, never return'],
    hints: ['It looks like nothing is happening…', '…but particles are still moving.', 'Two opposite processes balance.'],
    explain: 'It’s a **dynamic equilibrium**: dissolving and crystallizing happen at equal rates, so the amounts stay constant.',
  },
  {
    q: 'What happens to the solubility of most **solids** in water as the temperature rises?',
    correct: 'It increases',
    wrong: ['It decreases', 'It stays exactly the same', 'They stop dissolving'],
    hints: ['Think of sugar in hot tea vs iced tea.', 'Hotter water molecules move faster.', 'More solid dissolves.'],
    explain: 'Most solids are **more** soluble at higher temperatures.',
  },
  {
    q: 'What happens to the solubility of a **gas** (like CO_{2}) in water as the temperature rises?',
    correct: 'It decreases',
    wrong: ['It increases', 'It stays the same', 'The gas turns into a liquid'],
    hints: ['Warm pop goes flat faster.', 'Faster gas molecules escape more easily.', 'Opposite of most solids.'],
    explain: 'Gases are **less** soluble in warmer water, which is why warm pop goes flat and warm lakes hold less oxygen.',
  },
  {
    q: 'Why does opening a bottle of pop make it fizz?',
    correct: 'The pressure drops, so less CO_{2} can stay dissolved',
    wrong: ['The temperature drops suddenly', 'Air reacts with the pop', 'Sugar comes out of solution'],
    hints: ['The bottle is sealed under pressure.', 'Gas solubility depends on pressure.', 'Less pressure → less gas stays dissolved.'],
    explain: 'Gas solubility rises with pressure. Opening the bottle lowers the pressure, so CO_{2} bubbles out.',
  },
  {
    q: 'Why does salt dissolve in water but not in cooking oil?',
    correct: '“Like dissolves like”: charged/polar solutes dissolve in polar solvents',
    wrong: ['Oil is too thick', 'Salt reacts with water', 'Oil is too cold'],
    hints: ['Water is polar; oil is non-polar.', 'Ions are attracted to polar water molecules.', 'Similar kinds of particles mix.'],
    explain: 'Ionic and polar substances dissolve in polar solvents like water; non-polar substances dissolve in non-polar solvents. You’ll see why in Unit 2.',
  },
  {
    q: 'On the data table, what does “low solubility” mean?',
    correct: 'Less than 0.1 mol/L dissolves',
    wrong: ['It doesn’t dissolve at all', 'Less than 1 g dissolves', 'It dissolves only in hot water'],
    hints: ['Check the left side of the solubility table.', 'It gives a concentration cutoff.', '0.1 mol/L.'],
    explain: 'Low solubility means < 0.1 mol/L. A tiny amount does dissolve, but little enough that the compound forms a precipitate (s).',
  },
  {
    q: 'A solution holds **more** solute than it normally could at that temperature. It’s called…',
    correct: 'supersaturated',
    wrong: ['saturated', 'unsaturated', 'diluted'],
    hints: ['Beyond saturated.', 'It’s unstable; a seed crystal makes solid appear.', 'super-…'],
    explain: 'A **supersaturated** solution holds more than the equilibrium amount. It’s unstable and can crystallize suddenly.',
  },
];

export const solubilityEquilibriumTopic: Topic = {
  meta: TOPIC_META['u1-solubility-equilibrium'],
  summary: 'Solubility is how much solute can dissolve. At that limit, dissolving and crystallizing reach an equilibrium.',
  learn: [
    { type: 'key', title: 'Solubility', text: 'The maximum amount of solute that dissolves in a given amount of solvent at a given temperature (e.g. g/100 mL or mol/L).' },
    {
      type: 'table',
      head: ['Solution', 'Meaning'],
      rows: [
        ['**unsaturated**', 'less than the maximum; more can dissolve'],
        ['**saturated**', 'at the maximum; extra solid stays undissolved'],
        ['**supersaturated**', 'more than the maximum (unstable)'],
      ],
    },
    { type: 'h', text: 'Solubility equilibrium' },
    {
      type: 'p',
      text: 'In a saturated solution with some solid left over, particles keep dissolving **and** crystallizing, at the same rate. Nothing seems to change, but both processes continue. This is a **dynamic equilibrium**.',
    },
    { type: 'equation', text: 'NaCl(s) ⇌ Na^{+}(aq) + Cl^{−}(aq)', caption: 'The double arrow shows both directions happening at once.' },
    { type: 'h', text: 'What affects solubility?' },
    {
      type: 'list',
      items: [
        '**Temperature:** most solids dissolve more when hot; gases dissolve **less** when hot.',
        '**Pressure:** gases dissolve more at higher pressure (that’s why pop fizzes when opened).',
        '**The substances:** “like dissolves like”. Ionic and polar substances dissolve in water; non-polar ones don’t.',
      ],
    },
    { type: 'h', text: 'The solubility table' },
    {
      type: 'p',
      text: 'Your data sheet classifies ionic compounds as **high solubility (aq)**, more than 0.1 mol/L, or **low solubility (s)**, less than 0.1 mol/L. Find the negative ion’s column, then check the cation.',
    },
    { type: 'tip', text: 'Quick wins: group 1 and ammonium compounds, nitrates, and chlorates are always high solubility.' },
  ],
  examples: [
    {
      title: 'Scaling solubility',
      problem: 'KNO_{3} dissolves up to 31.6 g/100 mL at 20 °C. How much dissolves in 250. mL?',
      steps: [{ label: 'Scale', work: '31.6 g × (250. ÷ 100) = 79.0 g' }],
      answer: '79.0 g',
    },
    {
      title: 'Using the table',
      problem: `Is ${f('PbCl2')} high or low solubility?`,
      steps: [
        { label: 'Column', work: 'Cl^{−}: “most” are high…' },
        { label: 'Exceptions', work: '…but Pb^{2+} is listed as low' },
      ],
      answer: 'Low solubility: PbCl_{2}(s)',
    },
  ],
  stepGuide: [
    'Solubility is per amount of solvent. Scale it to your volume.',
    'Below the max → unsaturated; at the max → saturated; above → extra solid (or supersaturated).',
    'Saturated + solid = dynamic equilibrium (equal rates both ways).',
    'Table: find the anion column, then check whether the cation is an exception.',
  ],
  practice: [
    mcTemplate('concepts', 'solubility and equilibrium', concepts),
    { id: 'scale', skill: 'scaling solubility', generate: scaleSolubility },
    { id: 'table', skill: 'reading the solubility table', generate: tableLookup },
    { id: 'saturated', skill: 'saturated or unsaturated?', generate: saturatedOrNot },
    mcTemplate('concepts-2', 'solubility and equilibrium', concepts),
    { id: 'table-2', skill: 'reading the solubility table', generate: tableLookup },
    { id: 'scale-2', skill: 'scaling solubility', generate: scaleSolubility },
    mcTemplate('concepts-3', 'solubility and equilibrium', concepts),
    { id: 'table-3', skill: 'reading the solubility table', generate: tableLookup },
    { id: 'saturated-2', skill: 'saturated or unsaturated?', generate: saturatedOrNot },
  ],
  videos: [],
};
