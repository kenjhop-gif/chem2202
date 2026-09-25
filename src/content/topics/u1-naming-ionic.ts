import type { Question, Step, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import {
  AMMONIUM,
  FIXED_CATIONS,
  HYDRATE_PREFIX,
  MONATOMIC_ANIONS,
  MULTIVALENT_CATIONS,
  POLYATOMIC_ANIONS,
  cationName,
  ionText,
  ionic,
  ionicFormulaMistakes,
  type Ion,
  type IonicCompound,
} from '../ions';
import { f } from '../substances';
import { ELEMENT_BY_SYMBOL } from '../../data/elements';
import type { Rng } from '../../engine/rng';

const chargeLabel = (q: number) => `${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '−'}`;

function chargeChoice(ion: Ion, rng: Rng): Step['answer'] {
  const sign = ion.charge > 0 ? 1 : -1;
  const opts = rng.shuffle([1, 2, 3].map((n) => n * sign));
  return { kind: 'choice', options: opts.map(chargeLabel), correct: opts.indexOf(ion.charge) };
}

function nameStep(c: IonicCompound, extra: Partial<Step> = {}): Step {
  const elName = !c.anion.polyatomic ? ELEMENT_BY_SYMBOL[c.anion.formula].name : null;
  return {
    prompt: `Name ${f(c.formula)}.`,
    answer: { kind: 'name', accepted: [c.name], oldNames: c.oldName ? [c.oldName] : undefined },
    hints: [
      'Name the positive ion first, then the negative ion.',
      c.cation.multivalent
        ? `${c.cation.name} can form more than one ion, so put its charge in Roman numerals: ${cationName(c.cation)}.`
        : c.anion.polyatomic
          ? `${ionText(c.anion)} is the polyatomic ion **${c.anion.name}**. Its name doesn’t change.`
          : `A one-element negative ion ends in **-ide**: ${elName} → ${c.anion.name}.`,
      `${cationName(c.cation)} + ${c.anion.name}`,
    ],
    mistakes: elName ? [{ name: `${cationName(c.cation)} ${elName}`, message: 'Change the ending of the negative ion to **-ide**.' }] : [],
    explain: `${f(c.formula)} is **${c.name}**.`,
    ...extra,
  };
}

function formulaStep(c: IonicCompound, extra: Partial<Step> = {}): Step {
  const a = c.cation.charge;
  const b = -c.anion.charge;
  return {
    prompt: `Write the formula for ${c.name}.`,
    answer: { kind: 'formula', formula: c.formula },
    hints: [
      'The total positive charge must cancel the total negative charge.',
      `Ions: ${ionText(c.cation)} and ${ionText(c.anion)}. Find the lowest number both charges go into.`,
      `${c.nCation} × (${a}+) = ${c.nAnion} × (${b}−), so use ${c.nCation} ${c.cation.formula} and ${c.nAnion} ${c.anion.formula}${c.anion.polyatomic && c.nAnion > 1 ? ' (in brackets)' : ''}.`,
    ],
    mistakes: ionicFormulaMistakes(c),
    explain: `${c.nCation} × ${a}+ = ${c.nCation * a}+ and ${c.nAnion} × ${b}− = ${c.nAnion * b}−. They cancel, so the formula is **${f(c.formula)}**.`,
    ...extra,
  };
}

// ---------- Question templates ----------

function nameBinary(rng: Rng): Question {
  const c = ionic(rng.pick(FIXED_CATIONS), rng.pick(MONATOMIC_ANIONS));
  const elName = ELEMENT_BY_SYMBOL[c.anion.formula].name;
  return {
    prompt: `Name the ionic compound ${f(c.formula)}.`,
    steps: [
      {
        prompt: `The negative ion is ${ionText(c.anion)}. What is its name?`,
        answer: { kind: 'name', accepted: [c.anion.name] },
        hints: ['Start with the element’s name.', 'Negative ions made of one element end in **-ide**.', `${elName} → ${c.anion.name.slice(0, 3)}…ide`],
        mistakes: [{ name: elName, message: `That’s the element. As a negative ion, the ending changes to **-ide**.` }],
        explain: `${ionText(c.anion)} is the **${c.anion.name}** ion.`,
      },
      nameStep(c),
    ],
  };
}

function formulaBinary(rng: Rng): Question {
  const c = ionic(rng.pick(FIXED_CATIONS), rng.pick(MONATOMIC_ANIONS));
  return {
    prompt: `Write the formula for ${c.name}.`,
    steps: [
      {
        prompt: `What is the charge on a ${c.cation.name} ion?`,
        answer: chargeChoice(c.cation, rng),
        hints: ['Check the ion charge on the periodic chart.', 'Group 1 → 1+, group 2 → 2+, aluminum → 3+.', `${c.cation.name} is ${c.cation.formula}.`],
        explain: `${c.cation.name}: ${ionText(c.cation)}`,
      },
      {
        prompt: `What is the charge on a ${c.anion.name} ion?`,
        answer: chargeChoice(c.anion, rng),
        hints: ['Check the ion charge on the periodic chart.', 'Group 17 → 1−, group 16 → 2−, group 15 → 3−.', `${c.anion.name} comes from ${ELEMENT_BY_SYMBOL[c.anion.formula].name}.`],
        explain: `${c.anion.name}: ${ionText(c.anion)}`,
      },
      formulaStep(c),
    ],
  };
}

function nameMultivalent(rng: Rng, polyatomic = false): Question {
  const cation = rng.pick(MULTIVALENT_CATIONS);
  const anion = rng.pick(polyatomic ? POLYATOMIC_ANIONS.filter((a) => a.charge !== -3 || cation.charge % 3 === 0) : MONATOMIC_ANIONS.filter((a) => a.charge >= -2));
  const c = ionic(cation, anion);
  const totalNeg = c.nAnion * -anion.charge;
  return {
    prompt: `Name ${f(c.formula)}.`,
    steps: [
      {
        prompt: `Each ${anion.name} ion is ${ionText(anion)}. What is the **total** negative charge in ${f(c.formula)}? (Enter the number.)`,
        answer: { kind: 'numeric', value: totalNeg, unit: '−', tolerance: 0 },
        hints: [`How many ${anion.name} ions are in the formula?`, 'Total = number of ions × charge on each.', `${c.nAnion} × ${-anion.charge} = ?`],
        explain: `${c.nAnion} × ${chargeLabel(anion.charge)} = ${totalNeg}− in total.`,
      },
      {
        prompt: `The ${cation.name} ions must cancel that. What is the charge on **each** ${cation.name} ion? (Enter the number.)`,
        answer: { kind: 'numeric', value: cation.charge, unit: '+', tolerance: 0 },
        hints: ['The compound is neutral overall.', `${totalNeg}+ is shared among ${c.nCation} ${cation.name} ion${c.nCation > 1 ? 's' : ''}.`, `${totalNeg} ÷ ${c.nCation} = ?`],
        mistakes: c.nCation > 1 ? [{ value: totalNeg, message: `That’s the total. Share it among the ${c.nCation} ${cation.name} ions.` }] : [],
        explain: `Each ${cation.name} ion is ${ionText(cation)}, so it’s written **${cationName(cation)}**.`,
      },
      nameStep(c),
    ],
  };
}

function formulaMultivalent(rng: Rng): Question {
  const c = ionic(rng.pick(MULTIVALENT_CATIONS), rng.pick([...MONATOMIC_ANIONS.slice(0, 6), ...POLYATOMIC_ANIONS.slice(0, 10)]));
  return {
    prompt: `Write the formula for ${c.name}.`,
    steps: [
      {
        prompt: `What charge does the Roman numeral in “${cationName(c.cation)}” tell you? (Enter the number.)`,
        answer: { kind: 'numeric', value: c.cation.charge, unit: '+', tolerance: 0 },
        hints: ['The Roman numeral is the charge on the metal ion.', 'I = 1, II = 2, III = 3, IV = 4.', `${cationName(c.cation)} → ${ionText(c.cation)}`],
        explain: `${cationName(c.cation)} means ${ionText(c.cation)}.`,
      },
      formulaStep(c),
    ],
  };
}

function namePolyatomic(rng: Rng): Question {
  const cation = rng.next() < 0.4 ? AMMONIUM : rng.pick(FIXED_CATIONS);
  const anion = cation === AMMONIUM && rng.next() < 0.4 ? rng.pick(MONATOMIC_ANIONS.slice(0, 5)) : rng.pick(POLYATOMIC_ANIONS);
  const c = ionic(cation, anion);
  const poly = anion.polyatomic ? anion : AMMONIUM;
  const others = rng.shuffle(POLYATOMIC_ANIONS.filter((a) => a !== poly)).slice(0, 3);
  const options = rng.shuffle([poly, ...others]);
  return {
    prompt: `Name ${f(c.formula)}.`,
    steps: [
      {
        prompt: `${f(c.formula)} contains the polyatomic ion ${ionText(poly)}. What is it called?`,
        answer: { kind: 'choice', options: options.map((o) => o.name), correct: options.indexOf(poly) },
        hints: ['Use your list of polyatomic ions.', 'Polyatomic ion names don’t change inside a compound.', `Find ${ionText(poly)} on your ion list.`],
        explain: `${ionText(poly)} is **${poly.name}**.`,
      },
      nameStep(c),
    ],
  };
}

function formulaPolyatomic(rng: Rng): Question {
  const cation = rng.next() < 0.3 ? AMMONIUM : rng.pick(FIXED_CATIONS.filter((x) => x.charge > 1));
  const anion = rng.pick(POLYATOMIC_ANIONS);
  const c = ionic(cation, anion);
  const right = `${anion.formula}^{${chargeLabel(anion.charge)}}`;
  const wrongCharge = `${anion.formula}^{${chargeLabel(anion.charge === -1 ? -2 : -1)}}`;
  const others = rng
    .shuffle(POLYATOMIC_ANIONS.filter((x) => x !== anion))
    .slice(0, 2)
    .map((x) => `${x.formula}^{${chargeLabel(x.charge)}}`);
  const options = rng.shuffle([right, wrongCharge, ...others]);
  return {
    prompt: `Write the formula for ${c.name}.`,
    steps: [
      {
        prompt: `Which ion is ${anion.name}?`,
        answer: { kind: 'choice', options: options.map((o) => `[[${o}]]`), correct: options.indexOf(right) },
        hints: ['Check your polyatomic ion list.', 'Both the formula and the charge matter.', `${anion.name} is on the list with charge ${chargeLabel(anion.charge)}.`],
        explain: `${anion.name} is ${ionText(anion)}.`,
      },
      formulaStep(c),
    ],
  };
}

function hydrate(rng: Rng, toFormula: boolean): Question {
  const options = [
    { c: ionic(MULTIVALENT_CATIONS[3], POLYATOMIC_ANIONS[7]), n: 5 }, // CuSO4·5H2O
    { c: ionic(FIXED_CATIONS[4], POLYATOMIC_ANIONS[7]), n: 7 }, // MgSO4·7H2O
    { c: ionic(FIXED_CATIONS[5], MONATOMIC_ANIONS[1]), n: 2 }, // CaCl2·2H2O
    { c: ionic(FIXED_CATIONS[1], POLYATOMIC_ANIONS[9]), n: 10 }, // Na2CO3·10H2O
    { c: ionic(FIXED_CATIONS[6], MONATOMIC_ANIONS[1]), n: 2 }, // BaCl2·2H2O
    { c: ionic(MULTIVALENT_CATIONS[8], MONATOMIC_ANIONS[1]), n: 6 }, // CoCl2·6H2O
  ];
  const { c, n } = rng.pick(options);
  const formula = `${c.formula}·${n}H2O`;
  const name = `${c.name} ${HYDRATE_PREFIX[n]}hydrate`;
  const oldName = c.oldName ? `${c.oldName} ${HYDRATE_PREFIX[n]}hydrate` : undefined;
  const prefixStep: Step = {
    prompt: `Which prefix means ${n}?`,
    answer: (() => {
      const opts = rng.shuffle([n, ...rng.shuffle([2, 3, 4, 5, 6, 7, 10].filter((x) => x !== n)).slice(0, 3)]);
      return { kind: 'choice' as const, options: opts.map((x) => `${HYDRATE_PREFIX[x]}-`), correct: opts.indexOf(n) };
    })(),
    hints: ['Hydrates use Greek prefixes for the number of waters.', 'mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, octa 8, nona 9, deca 10', `${n} → ${HYDRATE_PREFIX[n]}-`],
    explain: `${n} = **${HYDRATE_PREFIX[n]}**-, so ·${n}H_{2}O is “${HYDRATE_PREFIX[n]}hydrate”.`,
  };
  if (toFormula) {
    return {
      prompt: `Write the formula for ${name}.`,
      steps: [
        formulaStep(c, { prompt: `First, the formula for the salt part, ${c.name}.` }),
        {
          prompt: `How many water molecules does “${HYDRATE_PREFIX[n]}hydrate” mean?`,
          answer: { kind: 'numeric', value: n, tolerance: 0 },
          hints: ['The prefix counts water molecules.', 'mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, octa 8, nona 9, deca 10', `${HYDRATE_PREFIX[n]}- = ?`],
          explain: `${HYDRATE_PREFIX[n]}hydrate = ${n} H_{2}O`,
        },
        {
          prompt: `Write the full formula. (Type a dot or · between the salt and the water.)`,
          answer: { kind: 'formula', formula },
          hints: ['Salt · (number) H_{2}O', `Put ${n} in front of H_{2}O.`, `${c.formula}·${n}H2O`],
          mistakes: [{ formula: c.formula, message: 'Don’t forget the water: add ·' + n + 'H2O.' }],
          explain: `**${f(formula)}**`,
        },
      ],
    };
  }
  return {
    prompt: `Name ${f(formula)}.`,
    steps: [
      nameStep(c, { prompt: `First, name the salt part, ${f(c.formula)}.` }),
      prefixStep,
      {
        prompt: `Now write the full name.`,
        answer: { kind: 'name', accepted: [name], oldNames: oldName ? [oldName] : undefined },
        hints: ['Salt name + prefix + “hydrate”.', 'The prefix and “hydrate” are one word.', `${c.name} ${HYDRATE_PREFIX[n]}hydrate`],
        mistakes: [{ name: `${c.name} ${HYDRATE_PREFIX[n]} hydrate`, message: 'Close! Write the prefix and “hydrate” as one word.' }],
        explain: `**${name}**`,
      },
    ],
  };
}

function needsRoman(rng: Rng): Question {
  const multi = ionic(rng.pick(MULTIVALENT_CATIONS), rng.pick(MONATOMIC_ANIONS.slice(0, 6)));
  const fixed = rng.shuffle(FIXED_CATIONS).slice(0, 3).map((cat) => ionic(cat, rng.pick(MONATOMIC_ANIONS.slice(0, 6))));
  const all = rng.shuffle([multi, ...fixed]);
  return {
    prompt: 'Which compound needs a Roman numeral in its name?',
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: all.map((c) => f(c.formula)), correct: all.indexOf(multi) },
        hints: [
          'Roman numerals are only for metals that can form more than one ion.',
          'On the periodic chart, those metals show two ion charges.',
          'Group 1, group 2, aluminum, zinc, and silver have only one charge.',
        ],
        explain: `${multi.cation.name} can form more than one ion, so ${f(multi.formula)} is **${multi.name}**.`,
      },
    ],
  };
}

export const namingIonicTopic: Topic = {
  meta: TOPIC_META['u1-naming-ionic'],
  summary: 'Ionic compounds are named from their ions: positive ion first, then negative ion, and the charges set the formula.',
  learn: [
    {
      type: 'p',
      text: `An ionic compound is made of positive ions (usually a metal) and negative ions (a non-metal or a polyatomic ion). Its formula shows the ratio of ions that makes the total charge **zero**.`,
    },
    {
      type: 'background',
      title: 'Where do ion charges come from?',
      text: 'Atoms gain or lose electrons to get a full outer shell. Your periodic chart shows each element’s usual ion charge in the top-right corner of its box.',
      topicId: 'b-bohr-ions',
    },
    { type: 'h', text: 'Naming: formula → name' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Positive ion first**, using the element’s name: Na → sodium.',
        '**Negative ion second.** A one-element ion ends in **-ide**: Cl → chloride, O → oxide.',
        '**Polyatomic ions** keep their own names: SO_{4}^{2−} is sulfate, NO_{3}^{−} is nitrate.',
        '**No prefixes.** Ionic names never use mono-, di-, tri-.',
      ],
    },
    { type: 'h', text: 'Metals with more than one charge' },
    {
      type: 'p',
      text: `Some metals, like iron (Fe^{2+} or Fe^{3+}), can form more than one ion. Show the charge with a **Roman numeral**: ${f('FeCl3')} is iron(III) chloride. To find the charge, work backwards from the negative ions: 3 Cl^{−} = 3−, so Fe must be 3+.`,
    },
    {
      type: 'tip',
      text: 'Use IUPAC names. Older names like “ferric” and “cupric” are real, but this course uses iron(III), copper(II), and so on.',
    },
    { type: 'h', text: 'Writing formulas: name → formula' },
    {
      type: 'list',
      ordered: true,
      items: [
        'Write both ions with their charges: aluminum oxide → Al^{3+} and O^{2−}.',
        'Find the lowest total both charges divide into: 6.',
        'Use enough of each ion to reach it: 2 Al^{3+} (6+) and 3 O^{2−} (6−).',
        `Write the numbers as subscripts: ${f('Al2O3')}. Put brackets around a polyatomic ion if you need more than one: ${f('Ca(NO3)2')}.`,
      ],
    },
    { type: 'h', text: 'Hydrates' },
    {
      type: 'p',
      text: `Some ionic crystals hold water. Name the salt, then add a prefix + “hydrate” for the number of waters: ${f('CuSO4·5H2O')} is copper(II) sulfate pentahydrate.`,
    },
    {
      type: 'table',
      head: ['Prefix', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'],
      rows: [['Number', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']],
    },
    {
      type: 'table',
      head: ['Common polyatomic ions', '', ''],
      rows: [
        [`hydroxide ${ionText(POLYATOMIC_ANIONS[0])}`, `nitrate ${ionText(POLYATOMIC_ANIONS[1])}`, `nitrite ${ionText(POLYATOMIC_ANIONS[2])}`],
        [`hydrogen carbonate ${ionText(POLYATOMIC_ANIONS[3])}`, `chlorate ${ionText(POLYATOMIC_ANIONS[4])}`, `permanganate ${ionText(POLYATOMIC_ANIONS[5])}`],
        [`sulfate ${ionText(POLYATOMIC_ANIONS[7])}`, `sulfite ${ionText(POLYATOMIC_ANIONS[8])}`, `carbonate ${ionText(POLYATOMIC_ANIONS[9])}`],
        [`phosphate ${ionText(POLYATOMIC_ANIONS[12])}`, `cyanide ${ionText(POLYATOMIC_ANIONS[6])}`, `ammonium ${ionText(AMMONIUM)}`],
      ],
    },
  ],
  examples: [
    {
      title: 'Name a simple ionic compound',
      problem: `Name ${f('MgBr2')}.`,
      steps: [
        { label: 'Positive ion', work: 'Mg^{2+} → magnesium (only one charge, so no Roman numeral)' },
        { label: 'Negative ion', work: 'Br^{−} → bromine becomes **bromide**' },
      ],
      answer: 'magnesium bromide',
    },
    {
      title: 'A metal with more than one charge',
      problem: `Name ${f('Fe2O3')}.`,
      steps: [
        { label: 'Total negative charge', work: '3 O^{2−} = 6−' },
        { label: 'Charge on each Fe', work: '6+ shared by 2 Fe → each Fe is 3+' },
        { label: 'Name', work: 'iron(III) + oxide' },
      ],
      answer: 'iron(III) oxide',
    },
    {
      title: 'Formula with a polyatomic ion',
      problem: 'Write the formula for aluminum sulfate.',
      steps: [
        { label: 'Ions', work: 'Al^{3+} and SO_{4}^{2−}' },
        { label: 'Balance', work: 'Lowest total is 6: 2 Al^{3+} = 6+, 3 SO_{4}^{2−} = 6−' },
        { label: 'Write', work: 'Brackets around SO_{4} because there are 3 of them' },
      ],
      answer: f('Al2(SO4)3'),
    },
  ],
  stepGuide: [
    '**Formula → name:** name the positive ion, then the negative ion (-ide for single elements; polyatomic names stay the same).',
    'If the metal can have more than one charge, work out its charge from the negative ions and add a Roman numeral.',
    '**Name → formula:** write both ions with charges. Use the lowest number of each ion that makes the total charge zero.',
    'Put brackets around a polyatomic ion when there’s more than one of it.',
    '**Hydrates:** salt name + prefix + “hydrate” (e.g. pentahydrate = ·5H_{2}O).',
  ],
  practice: [
    { id: 'name-binary', skill: 'naming binary ionic compounds', generate: nameBinary },
    { id: 'formula-binary', skill: 'formulas of binary ionic compounds', generate: formulaBinary },
    { id: 'needs-roman', skill: 'spotting multivalent metals', generate: needsRoman },
    { id: 'name-multi', skill: 'naming with Roman numerals', generate: (r) => nameMultivalent(r) },
    { id: 'formula-multi', skill: 'formulas with Roman numerals', generate: formulaMultivalent },
    { id: 'name-poly', skill: 'naming with polyatomic ions', generate: namePolyatomic },
    { id: 'formula-poly', skill: 'formulas with polyatomic ions', generate: formulaPolyatomic },
    { id: 'name-multi-poly', skill: 'Roman numerals + polyatomic ions', generate: (r) => nameMultivalent(r, true) },
    { id: 'hydrate-name', skill: 'naming hydrates', generate: (r) => hydrate(r, false) },
    { id: 'hydrate-formula', skill: 'hydrate formulas', generate: (r) => hydrate(r, true) },
    { id: 'formula-binary-2', skill: 'formulas of binary ionic compounds', generate: formulaBinary },
    { id: 'name-multi-2', skill: 'naming with Roman numerals', generate: (r) => nameMultivalent(r) },
  ],
  videos: [
    {
      youtubeId: "eM5mDnQX0k8",
      title: "How To Name Ionic Compounds With Transition Metals",
      channel: "The Organic Chemistry Tutor",
      note: "Roman numerals and polyatomic ions.",
    },
    {
      youtubeId: "stu2omPRvbs",
      title: "How To Write Ionic Formulas With Polyatomic Ions",
      channel: "The Organic Chemistry Tutor",
      note: "Going from names to formulas by balancing charges.",
    },
  ],
};
