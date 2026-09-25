import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, mm, sf } from '../substances';
import { FIXED_CATIONS, MONATOMIC_ANIONS, MULTIVALENT_CATIONS, POLYATOMIC_ANIONS, AMMONIUM, ionic, ionText, type IonicCompound } from '../ions';
import { molarMass } from '../../engine/formula';
import { mcTemplate, type MCItem } from '../quiz';
import type { Rng } from '../../engine/rng';

/** Soluble ionic compounds (so dissociation questions are realistic). */
function solubleCompound(rng: Rng): IonicCompound {
  const options: IonicCompound[] = [
    ...FIXED_CATIONS.filter((c) => ['Na', 'K', 'Li'].includes(c.formula)).flatMap((c) =>
      [MONATOMIC_ANIONS[1], MONATOMIC_ANIONS[2], POLYATOMIC_ANIONS[1], POLYATOMIC_ANIONS[7], POLYATOMIC_ANIONS[9], POLYATOMIC_ANIONS[12]].map((a) => ionic(c, a)),
    ),
    ...FIXED_CATIONS.filter((c) => ['Mg', 'Ca', 'Ba', 'Zn', 'Al'].includes(c.formula)).flatMap((c) =>
      [MONATOMIC_ANIONS[1], MONATOMIC_ANIONS[2], POLYATOMIC_ANIONS[1]].map((a) => ionic(c, a)),
    ),
    ionic(MULTIVALENT_CATIONS[1], MONATOMIC_ANIONS[1]), // FeCl3
    ionic(MULTIVALENT_CATIONS[3], POLYATOMIC_ANIONS[7]), // CuSO4
    ionic(AMMONIUM, POLYATOMIC_ANIONS[7]), // (NH4)2SO4
    ionic(AMMONIUM, MONATOMIC_ANIONS[1]),
    ionic(MULTIVALENT_CATIONS[3], POLYATOMIC_ANIONS[1]), // Cu(NO3)2
    ionic(FIXED_CATIONS[8], POLYATOMIC_ANIONS[7]), // Al2(SO4)3
  ];
  return rng.pick(options);
}

const coef = (n: number) => (n === 1 ? '' : `${n} `);
const aqIon = (text: string) => `${text}(aq)`;

export function dissociationText(c: IonicCompound): string {
  return `${f(c.formula)}(s) → ${coef(c.nCation)}${aqIon(ionText(c.cation))} + ${coef(c.nAnion)}${aqIon(ionText(c.anion))}`;
}

function wrongDissociations(c: IonicCompound): string[] {
  const out = new Set<string>();
  // Coefficients swapped.
  out.add(`${f(c.formula)}(s) → ${coef(c.nAnion)}${aqIon(ionText(c.cation))} + ${coef(c.nCation)}${aqIon(ionText(c.anion))}`);
  // Polyatomic ion split / subscript kept inside the ion.
  const keepSub = (ion: typeof c.cation, n: number) =>
    n > 1 && !ion.polyatomic ? `[[${ion.formula}${n}^{${Math.abs(ion.charge) === 1 ? '' : Math.abs(ion.charge)}${ion.charge > 0 ? '+' : '−'}}]](aq)` : `${coef(n)}${aqIon(ionText(ion))}`;
  out.add(`${f(c.formula)}(s) → ${keepSub(c.cation, c.nCation)} + ${keepSub(c.anion, c.nAnion)}`);
  // Charges left off.
  out.add(`${f(c.formula)}(s) → ${coef(c.nCation)}[[${c.cation.formula}]](aq) + ${coef(c.nAnion)}[[${c.anion.formula}]](aq)`);
  // Stays together.
  out.add(`${f(c.formula)}(s) → ${f(c.formula)}(aq) only (no ions)`);
  return [...out].filter((w) => w !== dissociationText(c));
}

function writeDissociation(rng: Rng): Question {
  const c = solubleCompound(rng);
  const options = rng.shuffle([dissociationText(c), ...wrongDissociations(c).slice(0, 3)]);
  return {
    prompt: `Which is the correct dissociation equation for ${c.name}, ${f(c.formula)}, dissolving in water?`,
    steps: [
      {
        prompt: `How many ${ionText(c.anion)} ions come from one ${f(c.formula)}?`,
        answer: { kind: 'numeric', value: c.nAnion, tolerance: 0 },
        hints: ['Read the subscript on the negative ion.', 'A subscript after brackets counts whole polyatomic ions.', `${f(c.formula)} contains ${c.nAnion} ${c.anion.name} ion${c.nAnion > 1 ? 's' : ''}.`],
        explain: `One ${f(c.formula)} releases ${c.nAnion} ${ionText(c.anion)}.`,
      },
      {
        prompt: 'Choose the correct equation.',
        answer: { kind: 'choice', options, correct: options.indexOf(dissociationText(c)) },
        hints: [
          'Ionic compounds split into their separate ions in water.',
          'Subscripts become coefficients; each ion keeps its charge. Polyatomic ions stay in one piece.',
          `${c.nCation} × ${ionText(c.cation)} and ${c.nAnion} × ${ionText(c.anion)}.`,
        ],
        explain: dissociationText(c),
      },
    ],
  };
}

function ionConcentration(rng: Rng): Question {
  const c = solubleCompound(rng);
  const conc = measured(rng, 0.05, 2.0, 3);
  const pickAnion = rng.next() < 0.6;
  const ion = pickAnion ? c.anion : c.cation;
  const n = pickAnion ? c.nAnion : c.nCation;
  const answer = conc * n;
  return {
    prompt: `What is the concentration of ${ionText(ion)} in a ${given(conc, 3)} mol/L solution of ${f(c.formula)}?`,
    steps: [
      {
        prompt: `How many ${ionText(ion)} ions does each ${f(c.formula)} release?`,
        answer: { kind: 'numeric', value: n, tolerance: 0 },
        hints: ['Write the dissociation equation.', 'The coefficient of the ion is the ratio.', dissociationText(c)],
        explain: dissociationText(c),
      },
      {
        prompt: `Calculate [${ionText(ion)}].`,
        answer: { kind: 'numeric', value: answer, unit: 'mol/L', sigFigs: 3 },
        hints: ['Each mole of compound makes this many moles of the ion.', '[ion] = [compound] × ions per formula unit', `${given(conc, 3)} × ${n} = ?`],
        mistakes: n > 1 ? [{ value: conc, message: `That’s the compound’s concentration. Each ${f(c.formula)} makes ${n} ${ionText(ion)}.` }] : [],
        explain: `[${ionText(ion)}] = ${given(conc, 3)} × ${n} = **${sf(answer, 3)} mol/L**`,
      },
    ],
  };
}

function totalIons(rng: Rng): Question {
  const c = solubleCompound(rng);
  const conc = measured(rng, 0.05, 1.5, 3);
  const total = conc * (c.nCation + c.nAnion);
  return {
    prompt: `What is the **total** concentration of ions in a ${given(conc, 3)} mol/L solution of ${f(c.formula)}?`,
    steps: [
      {
        prompt: 'How many ions in total come from one formula unit?',
        answer: { kind: 'numeric', value: c.nCation + c.nAnion, tolerance: 0 },
        hints: ['Count positive and negative ions.', dissociationText(c), `${c.nCation} + ${c.nAnion}`],
        explain: `${c.nCation} + ${c.nAnion} = ${c.nCation + c.nAnion} ions per formula unit.`,
      },
      {
        prompt: 'Calculate the total ion concentration.',
        answer: { kind: 'numeric', value: total, unit: 'mol/L', sigFigs: 3 },
        hints: ['Multiply the compound concentration by the total ions.', `${given(conc, 3)} × ${c.nCation + c.nAnion}`, 'Units: mol/L.'],
        explain: `${given(conc, 3)} × ${c.nCation + c.nAnion} = **${sf(total, 3)} mol/L** of ions`,
      },
    ],
  };
}

function massToIon(rng: Rng): Question {
  const c = solubleCompound(rng);
  const m = measured(rng, 1, 40, 3);
  const vmL = measured(rng, 100, 900, 3);
  const M = molarMass(c.formula);
  const conc = m / M / (vmL / 1000);
  const ionC = conc * c.nAnion;
  return {
    prompt: `${given(m, 3)} g of ${f(c.formula)} is dissolved to make ${given(vmL, 3)} mL of solution. What is [${ionText(c.anion)}]?`,
    steps: [
      {
        prompt: `First, the concentration of ${f(c.formula)} (mol/L).`,
        answer: { kind: 'numeric', value: conc, unit: 'mol/L' },
        hints: ['n = m ÷ M, then c = n ÷ V.', `M = ${mm(M)} g/mol; V = ${sf(vmL / 1000, 3)} L.`, `(${given(m, 3)} ÷ ${mm(M)}) ÷ ${sf(vmL / 1000, 3)} = ?`],
        explain: `c = ${sf(conc, 4)} mol/L`,
      },
      {
        prompt: `Now [${ionText(c.anion)}].`,
        answer: { kind: 'numeric', value: ionC, unit: 'mol/L', sigFigs: 3 },
        hints: ['Use the dissociation ratio.', dissociationText(c), `${sf(conc, 4)} × ${c.nAnion} = ?`],
        explain: `[${ionText(c.anion)}] = ${sf(conc, 4)} × ${c.nAnion} = **${sf(ionC, 3)} mol/L**`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'Why does a sugar solution **not** conduct electricity, while a salt solution does?',
    correct: 'Sugar dissolves as whole molecules; salt separates into ions',
    wrong: ['Sugar doesn’t dissolve in water', 'Salt is a metal', 'Sugar solutions are too concentrated'],
    hints: ['Electricity in a solution is carried by charged particles.', 'Which one makes ions?', 'Molecular compounds stay as molecules.'],
    explain: 'Ionic compounds **dissociate** into ions (electrolytes). Molecular compounds like sugar dissolve as neutral molecules (non-electrolytes).',
  },
  {
    q: 'Which of these is an **electrolyte** when dissolved in water?',
    correct: f('KNO3'),
    wrong: [f('C6H12O6'), f('C2H5OH'), f('C12H22O11')],
    hints: ['Electrolytes release ions.', 'Ionic compounds release ions.', 'Which one has a metal?'],
    explain: `${f('KNO3')} is ionic, so it dissociates into K^{+} and NO_{3}^{−}.`,
  },
  {
    q: `When ${f('Na2SO4')} dissolves, what happens to the sulfate ion?`,
    correct: 'It stays together as SO_{4}^{2−}',
    wrong: ['It splits into S^{2−} and O^{2−}', 'It becomes SO_{4}^{−}', 'It stays attached to sodium'],
    hints: ['Polyatomic ions are held together by covalent bonds.', 'Only the ionic attraction between ions breaks.', 'Look at your polyatomic ion list.'],
    explain: 'Polyatomic ions stay in one piece: Na_{2}SO_{4}(s) → 2 Na^{+}(aq) + SO_{4}^{2−}(aq).',
  },
];

export const dissociationTopic: Topic = {
  meta: TOPIC_META['u1-dissociation'],
  summary: 'Ionic compounds break into separate ions when they dissolve, and the formula tells you how many of each.',
  learn: [
    {
      type: 'p',
      text: 'When an ionic compound dissolves, water pulls its ions apart. This is **dissociation**. The ions move freely, which is why ionic solutions conduct electricity (they’re **electrolytes**).',
    },
    { type: 'equation', text: 'CaCl_{2}(s) → Ca^{2+}(aq) + 2 Cl^{−}(aq)' },
    {
      type: 'list',
      items: [
        'Each ion keeps its charge; subscripts become coefficients.',
        '**Polyatomic ions stay together**: (NH_{4})_{2}SO_{4}(s) → 2 NH_{4}^{+}(aq) + SO_{4}^{2−}(aq).',
        'Molecular compounds (like sugar) dissolve as molecules. They don’t form ions (non-electrolytes).',
      ],
    },
    { type: 'h', text: 'Ion concentration' },
    {
      type: 'p',
      text: 'The dissociation equation gives the ratio. In 0.10 mol/L CaCl_{2}, [Ca^{2+}] = 0.10 mol/L and [Cl^{−}] = 2 × 0.10 = **0.20 mol/L**.',
    },
    { type: 'equation', text: '[ion] = [compound] × (ions per formula unit)', caption: 'Square brackets [ ] mean “concentration of”.' },
  ],
  examples: [
    {
      title: 'Write the dissociation',
      problem: `Write the dissociation equation for aluminum sulfate, ${f('Al2(SO4)3')}.`,
      steps: [
        { label: 'Ions', work: 'Al^{3+} and SO_{4}^{2−}' },
        { label: 'Counts', work: '2 Al^{3+} and 3 SO_{4}^{2−} (sulfate stays together)' },
      ],
      answer: 'Al_{2}(SO_{4})_{3}(s) → 2 Al^{3+}(aq) + 3 SO_{4}^{2−}(aq)',
    },
    {
      title: 'Ion concentration',
      problem: 'What is [NO_{3}^{−}] in 0.25 mol/L Ca(NO_{3})_{2}?',
      steps: [
        { label: 'Ratio', work: 'Ca(NO_{3})_{2} → Ca^{2+} + 2 NO_{3}^{−}' },
        { label: 'Multiply', work: '0.25 × 2 = 0.50 mol/L' },
      ],
      answer: '[NO_{3}^{−}] = 0.50 mol/L',
    },
  ],
  stepGuide: [
    'Identify the ions (keep polyatomic ions whole).',
    'Write the dissociation: compound(s) → ions(aq), subscripts become coefficients.',
    '[ion] = [compound] × its coefficient.',
  ],
  practice: [
    { id: 'write', skill: 'dissociation equations', generate: writeDissociation },
    { id: 'ion-c', skill: 'ion concentration', generate: ionConcentration },
    mcTemplate('concepts', 'electrolytes', concepts),
    { id: 'total', skill: 'total ion concentration', generate: totalIons },
    { id: 'write-2', skill: 'dissociation equations', generate: writeDissociation },
    { id: 'mass-ion', skill: 'mass to ion concentration', generate: massToIon },
    { id: 'ion-c-2', skill: 'ion concentration', generate: ionConcentration },
    { id: 'write-3', skill: 'dissociation equations', generate: writeDissociation },
    mcTemplate('concepts-2', 'electrolytes', concepts),
    { id: 'ion-c-3', skill: 'ion concentration', generate: ionConcentration },
  ],
  videos: [
    {
      youtubeId: "107VYxvvEp4",
      title: "Writing dissociation equations and calculating ion concentration",
      channel: "Alberta Chemistry Teacher",
      note: "A Canadian Chemistry 20 lesson that matches this topic closely.",
    },
    {
      youtubeId: "pyjeOLBsyV4",
      title: "How To Write The Dissociation Equations of Ionic Compounds",
      channel: "The Organic Chemistry Tutor",
      note: "Extra practice writing dissociation equations.",
    },
  ],
};
