import type { Question, Step, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f } from '../substances';
import { FIXED_CATIONS, MONATOMIC_ANIONS, MULTIVALENT_CATIONS, POLYATOMIC_ANIONS, ionText, ionic } from '../ions';
import { parseFormula } from '../../engine/formula';
import { ELEMENT_BY_SYMBOL } from '../../data/elements';
import type { Rng } from '../../engine/rng';

const PREFIX = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
const ROOT: Record<string, string> = { O: 'ox', S: 'sulf', Cl: 'chlor', F: 'fluor', Br: 'brom', I: 'iod', N: 'nitr', P: 'phosph', Se: 'selen' };

/** Binary molecular compounds, written in the conventional order. */
const BINARY = [
  'CO', 'CO2', 'N2O', 'NO', 'NO2', 'N2O3', 'N2O4', 'N2O5', 'SO2', 'SO3', 'P2O5', 'P4O10', 'PCl3', 'PCl5',
  'CCl4', 'SF6', 'NF3', 'CS2', 'SiO2', 'ClO2', 'OF2', 'BF3', 'SiCl4', 'XeF4', 'IF7', 'Cl2O7',
];

/** Older names that students may know. */
const OLD_NAMES: Record<string, string[]> = {
  N2O: ['nitrous oxide', 'laughing gas'],
  NO: ['nitric oxide'],
  CCl4: [],
};

/** Molecular compounds known by common names in this course. */
const COMMON = [
  { formula: 'H2O', name: 'water' },
  { formula: 'NH3', name: 'ammonia' },
  { formula: 'CH4', name: 'methane' },
  { formula: 'H2O2', name: 'hydrogen peroxide' },
  { formula: 'C6H12O6', name: 'glucose' },
  { formula: 'O3', name: 'ozone' },
  { formula: 'C12H22O11', name: 'sucrose' },
];

interface Acid {
  formula: string;
  /** Acid name (hydro-…-ic or …-ic / …-ous). */
  name: string;
  /** Name of the hydrogen compound, "aqueous hydrogen chloride" style (also accepted). */
  aqueous: string;
  anion: string;
  anionName: string;
  rule: 'binary' | 'ate' | 'ite';
  old?: string;
}

const ACIDS: Acid[] = [
  { formula: 'HCl', name: 'hydrochloric acid', aqueous: 'aqueous hydrogen chloride', anion: 'Cl^{−}', anionName: 'chloride', rule: 'binary' },
  { formula: 'HBr', name: 'hydrobromic acid', aqueous: 'aqueous hydrogen bromide', anion: 'Br^{−}', anionName: 'bromide', rule: 'binary' },
  { formula: 'HF', name: 'hydrofluoric acid', aqueous: 'aqueous hydrogen fluoride', anion: 'F^{−}', anionName: 'fluoride', rule: 'binary' },
  { formula: 'HI', name: 'hydroiodic acid', aqueous: 'aqueous hydrogen iodide', anion: 'I^{−}', anionName: 'iodide', rule: 'binary' },
  { formula: 'H2S', name: 'hydrosulfuric acid', aqueous: 'aqueous hydrogen sulfide', anion: 'S^{2−}', anionName: 'sulfide', rule: 'binary' },
  { formula: 'HNO3', name: 'nitric acid', aqueous: 'aqueous hydrogen nitrate', anion: 'NO3^{−}', anionName: 'nitrate', rule: 'ate' },
  { formula: 'HNO2', name: 'nitrous acid', aqueous: 'aqueous hydrogen nitrite', anion: 'NO2^{−}', anionName: 'nitrite', rule: 'ite' },
  { formula: 'H2SO4', name: 'sulfuric acid', aqueous: 'aqueous hydrogen sulfate', anion: 'SO4^{2−}', anionName: 'sulfate', rule: 'ate' },
  { formula: 'H2SO3', name: 'sulfurous acid', aqueous: 'aqueous hydrogen sulfite', anion: 'SO3^{2−}', anionName: 'sulfite', rule: 'ite' },
  { formula: 'H3PO4', name: 'phosphoric acid', aqueous: 'aqueous hydrogen phosphate', anion: 'PO4^{3−}', anionName: 'phosphate', rule: 'ate' },
  { formula: 'H2CO3', name: 'carbonic acid', aqueous: 'aqueous hydrogen carbonate', anion: 'CO3^{2−}', anionName: 'carbonate', rule: 'ate' },
  { formula: 'HClO3', name: 'chloric acid', aqueous: 'aqueous hydrogen chlorate', anion: 'ClO3^{−}', anionName: 'chlorate', rule: 'ate' },
];

function elementWord(symbol: string, count: number, first: boolean): string[] {
  if (first) {
    const n = ELEMENT_BY_SYMBOL[symbol].name;
    return [count === 1 ? n : PREFIX[count] + n];
  }
  const root = ROOT[symbol] + 'ide';
  const p = PREFIX[count];
  const full = p + root;
  // "pentaoxide" → "pentoxide": drop the prefix's final a/o before a vowel. Both spellings accepted.
  const elided = /[ao]$/.test(p) && /^[aeiou]/.test(root) ? p.slice(0, -1) + root : full;
  return elided === full ? [full] : [elided, full];
}

export function molecularName(formula: string): string[] {
  const [[a, na], [b, nb]] = Object.entries(parseFormula(formula));
  const [first] = elementWord(a, na, true);
  return elementWord(b, nb, false).map((second) => `${first} ${second}`);
}

function prefixChoice(count: number, rng: Rng): Step['answer'] {
  const opts = rng.shuffle([count, ...rng.shuffle([1, 2, 3, 4, 5, 6, 7, 10].filter((x) => x !== count)).slice(0, 3)]);
  return { kind: 'choice', options: opts.map((n) => `${PREFIX[n]}-`), correct: opts.indexOf(count) };
}

function nameMolecular(rng: Rng): Question {
  const formula = rng.pick(BINARY);
  const [[a, na], [b, nb]] = Object.entries(parseFormula(formula));
  const names = molecularName(formula);
  const noMonoFirst = `mono${ELEMENT_BY_SYMBOL[a].name} ${names[0].split(' ')[1]}`;
  return {
    prompt: `Name the molecular compound ${f(formula)}.`,
    steps: [
      {
        prompt: `There ${nb === 1 ? 'is' : 'are'} ${nb} ${b} atom${nb === 1 ? '' : 's'}. Which prefix goes on the second element?`,
        answer: prefixChoice(nb, rng),
        hints: ['Molecular compounds use prefixes to count atoms.', 'mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, octa 8, nona 9, deca 10', `${nb} → ${PREFIX[nb]}-`],
        explain: `${nb} = **${PREFIX[nb]}**-`,
      },
      {
        prompt: `Now name ${f(formula)}.`,
        answer: { kind: 'name', accepted: names, oldNames: OLD_NAMES[formula] },
        hints: [
          'First element: its name, with a prefix only if there’s more than one.',
          `Second element: prefix + root + **-ide** (${ELEMENT_BY_SYMBOL[b].name} → ${ROOT[b]}ide).`,
          `${na === 1 ? '(no prefix)' : PREFIX[na] + '-'} ${ELEMENT_BY_SYMBOL[a].name} + ${PREFIX[nb]}-${ROOT[b]}ide`,
        ],
        mistakes: [
          ...(na === 1 ? [{ name: noMonoFirst, message: 'Don’t use **mono-** on the first element.' }] : []),
          { name: `${elementWord(a, na, true)[0]} ${ROOT[b]}ide`, message: 'Molecular compounds need a prefix on the second element too, even mono-.' },
          { name: `${elementWord(a, na, true)[0]} ${PREFIX[nb]}${ELEMENT_BY_SYMBOL[b].name}`, message: 'The second element’s name changes to end in **-ide**.' },
        ],
        explain: `${f(formula)} is **${names[0]}**.`,
      },
    ],
  };
}

function formulaMolecular(rng: Rng): Question {
  const formula = rng.pick(BINARY);
  const [[a, na], [b, nb]] = Object.entries(parseFormula(formula));
  const name = molecularName(formula)[0];
  return {
    prompt: `Write the formula for ${name}.`,
    steps: [
      {
        prompt: `How many ${b} atoms does the prefix tell you?`,
        answer: { kind: 'numeric', value: nb, tolerance: 0 },
        hints: ['The prefix counts atoms.', 'mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, octa 8, nona 9, deca 10', `${PREFIX[nb]}- = ?`],
        explain: `${PREFIX[nb]}- = ${nb}`,
      },
      {
        prompt: `Write the formula for ${name}.`,
        answer: { kind: 'formula', formula },
        hints: [
          'Prefixes become subscripts. You don’t balance charges for molecular compounds.',
          'No prefix on the first element means 1.',
          `${na} ${a} and ${nb} ${b}`,
        ],
        mistakes: [
          { formula: `${b}${nb > 1 ? nb : ''}${a}${na > 1 ? na : ''}`, message: 'Keep the elements in the order they’re named.' },
        ],
        explain: `**${f(formula)}**`,
      },
    ],
  };
}

function monoRule(rng: Rng): Question {
  const cases = [
    { formula: 'CO', options: ['carbon monoxide', 'monocarbon monoxide', 'carbon oxide', 'monocarbon oxide'] },
    { formula: 'NO', options: ['nitrogen monoxide', 'mononitrogen monoxide', 'nitrogen oxide', 'mononitrogen oxide'] },
    { formula: 'PCl3', options: ['phosphorus trichloride', 'monophosphorus trichloride', 'phosphorus chloride', 'phosphorus(III) chloride'] },
  ];
  const c = rng.pick(cases);
  const order = rng.shuffle([0, 1, 2, 3]);
  return {
    prompt: `Which is the correct name for ${f(c.formula)}?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: order.map((i) => c.options[i]), correct: order.indexOf(0) },
        hints: [
          'Molecular compounds use prefixes, not Roman numerals.',
          'The first element never takes mono-.',
          'The second element always gets a prefix, even mono-.',
        ],
        explain: `**${c.options[0]}**: no mono- on the first element, but always a prefix on the second.`,
      },
    ],
  };
}

function whichSystem(rng: Rng): Question {
  const ionicPick = () => ionic(rng.pick([...FIXED_CATIONS, ...MULTIVALENT_CATIONS]), rng.pick([...MONATOMIC_ANIONS, ...POLYATOMIC_ANIONS])).formula;
  const isIonic = rng.next() < 0.5;
  const formula = isIonic ? ionicPick() : rng.pick(BINARY);
  const options = ['Ionic: name the ions, no prefixes', 'Molecular: use prefixes'];
  return {
    prompt: `How should ${f(formula)} be named?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: isIonic ? 0 : 1 },
        hints: [
          'Look at the first element.',
          'A metal (or ammonium) first → ionic. Only non-metals → molecular.',
          `Is ${parseFormula(formula) && Object.keys(parseFormula(formula))[0]} a metal?`,
        ],
        explain: isIonic
          ? `${f(formula)} contains a metal, so it’s **ionic**: name the ions and don’t use prefixes.`
          : `${f(formula)} is made of non-metals only, so it’s **molecular**: use prefixes.`,
      },
    ],
  };
}

function commonName(rng: Rng): Question {
  const c = rng.pick(COMMON);
  return {
    prompt: `${f(c.formula)} is almost always called by its common name. What is it?`,
    steps: [
      {
        prompt: `Name ${f(c.formula)}.`,
        answer: { kind: 'name', accepted: [c.name] },
        hints: ['This one is everyday chemistry: you’ve likely heard of it.', 'It’s on the list of common names in the Learn tab.', `It starts with “${c.name.slice(0, 2)}”.`],
        explain: `${f(c.formula)} is **${c.name}**.`,
      },
    ],
  };
}

function acidSteps(acid: Acid, rng: Rng): Step[] {
  const ruleText = { binary: 'hydro- + root + -ic acid', ate: '-ate → -ic acid', ite: '-ite → -ous acid' }[acid.rule];
  const ruleOpts = rng.shuffle(['hydro- + root + -ic acid', '-ate → -ic acid', '-ite → -ous acid']);
  return [
    {
      prompt: `${f(acid.formula)} is H^{+} with which negative ion?`,
      answer: (() => {
        const others = rng.shuffle(ACIDS.filter((a) => a !== acid)).slice(0, 3);
        const opts = rng.shuffle([acid, ...others]);
        return { kind: 'choice' as const, options: opts.map((a) => `${a.anionName} [[${a.anion}]]`), correct: opts.indexOf(acid) };
      })(),
      hints: ['Remove the hydrogen(s) at the front.', 'What’s left is the negative ion.', `${f(acid.formula)} → H + [[${acid.anion}]]`],
      explain: `The negative ion is **${acid.anionName}** [[${acid.anion}]].`,
    },
    {
      prompt: 'Which acid-naming rule applies?',
      answer: { kind: 'choice', options: ruleOpts, correct: ruleOpts.indexOf(ruleText) },
      hints: ['Look at the ending of the negative ion’s name.', '-ide ions make hydro-…-ic acids.', `${acid.anionName} ends in -${acid.rule === 'binary' ? 'ide' : acid.rule}.`],
      explain: `${acid.anionName} → ${ruleText}`,
    },
    {
      prompt: `Name ${f(acid.formula)}(aq) as an acid.`,
      answer: { kind: 'name', accepted: [acid.name, acid.aqueous], oldNames: acid.old ? [acid.old] : undefined },
      hints: ['Use the rule from the last step.', ruleText, acid.name.replace(/(\w+) acid$/, (m) => m[0] + '… acid')],
      mistakes: [
        { name: `hydrogen ${acid.anionName}`, message: 'In water it’s an acid. Use the acid name (or say “aqueous hydrogen …”).' },
        ...(acid.rule !== 'binary' ? [{ name: `hydro${acid.name}`, message: 'Only acids from -ide ions get hydro-.' }] : []),
      ],
      explain: `${f(acid.formula)}(aq) is **${acid.name}** (also called ${acid.aqueous}).`,
    },
  ];
}

function nameAcid(rng: Rng): Question {
  const acid = rng.pick(ACIDS);
  return { prompt: `Name the acid ${f(acid.formula)}(aq).`, steps: acidSteps(acid, rng) };
}

function formulaAcid(rng: Rng): Question {
  const acid = rng.pick(ACIDS);
  const nH = parseFormula(acid.formula).H;
  return {
    prompt: `Write the formula for ${acid.name}.`,
    steps: [
      {
        prompt: `Which negative ion is in ${acid.name}?`,
        answer: (() => {
          const others = rng.shuffle(ACIDS.filter((a) => a.anionName !== acid.anionName)).slice(0, 3);
          const opts = rng.shuffle([acid, ...others]);
          return { kind: 'choice' as const, options: opts.map((a) => `${a.anionName} [[${a.anion}]]`), correct: opts.indexOf(acid) };
        })(),
        hints: ['Work the rule backwards.', 'hydro-…-ic → -ide; -ic → -ate; -ous → -ite.', `${acid.name} comes from ${acid.anionName}.`],
        explain: `${acid.name} comes from **${acid.anionName}** [[${acid.anion}]].`,
      },
      {
        prompt: `Write the formula. (Add (aq) if you like. It’s optional here.)`,
        answer: { kind: 'formula', formula: acid.formula },
        hints: ['Add enough H^{+} ions to cancel the negative charge.', `The ion is [[${acid.anion}]], so you need ${nH} H.`, `H${nH > 1 ? nH : ''} + ${acid.anion.replace(/\^\{.*\}/, '')}`],
        explain: `**${f(acid.formula)}**(aq)`,
      },
    ],
  };
}

function nameAnything(rng: Rng): Question {
  if (rng.next() < 0.5) {
    const c = ionic(rng.pick([...FIXED_CATIONS, ...MULTIVALENT_CATIONS]), rng.pick([...MONATOMIC_ANIONS.slice(0, 6), ...POLYATOMIC_ANIONS.slice(0, 10)]));
    return {
      prompt: `Mixed review: name ${f(c.formula)}.`,
      steps: [
        {
          prompt: `Name ${f(c.formula)}. (Decide first: ionic or molecular?)`,
          answer: { kind: 'name', accepted: [c.name], oldNames: c.oldName ? [c.oldName] : undefined },
          hints: [
            `${c.cation.name} is a metal, so this is **ionic**: no prefixes.`,
            c.cation.multivalent ? 'This metal needs a Roman numeral for its charge.' : 'This metal has only one charge.',
            `The ions are ${ionText(c.cation)} and ${ionText(c.anion)}.`,
          ],
          explain: `Ionic: **${c.name}**`,
        },
      ],
    };
  }
  const formula = rng.pick(BINARY);
  return {
    prompt: `Mixed review: name ${f(formula)}.`,
    steps: [
      {
        prompt: `Name ${f(formula)}. (Decide first: ionic or molecular?)`,
        answer: { kind: 'name', accepted: molecularName(formula), oldNames: OLD_NAMES[formula] },
        hints: ['Only non-metals, so this is **molecular**: use prefixes.', 'No mono- on the first element; always a prefix on the second.', 'The second element ends in -ide.'],
        explain: `Molecular: **${molecularName(formula)[0]}**`,
      },
    ],
  };
}

export const namingMolecularTopic: Topic = {
  meta: TOPIC_META['u1-naming-molecular'],
  summary: 'Molecular compounds (non-metals only) use prefixes to count atoms. Acids have their own naming rules.',
  learn: [
    {
      type: 'p',
      text: 'Molecular compounds are made only of **non-metals** sharing electrons. There are no ion charges to balance, so the name has to tell you how many of each atom there are. That’s what prefixes do.',
    },
    {
      type: 'table',
      head: ['Prefix', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'],
      rows: [['Number', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']],
    },
    { type: 'h', text: 'The rules' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**First element:** its normal name. Add a prefix only if there’s more than one (never mono-).',
        '**Second element:** prefix + root + **-ide**. It always gets a prefix, even mono-.',
        '**Drop a doubled vowel** before “oxide”: mono + oxide → monoxide, penta + oxide → pentoxide.',
      ],
    },
    {
      type: 'p',
      text: `Examples: ${f('CO2')} carbon dioxide · ${f('N2O4')} dinitrogen tetroxide · ${f('CO')} carbon monoxide · ${f('PCl5')} phosphorus pentachloride`,
    },
    {
      type: 'tip',
      text: 'First decide **ionic or molecular**. A metal (or ammonium) means ionic: no prefixes. Only non-metals means molecular: use prefixes.',
    },
    { type: 'h', text: 'Common names' },
    {
      type: 'p',
      text: `Some molecular compounds are always called by their common names: ${COMMON.map((c) => `${f(c.formula)} ${c.name}`).join(' · ')}.`,
    },
    { type: 'h', text: 'Acids' },
    {
      type: 'p',
      text: 'An acid is a hydrogen compound dissolved in water (aq). Name it from its negative ion:',
    },
    {
      type: 'table',
      head: ['Negative ion ends in…', 'Acid name', 'Example'],
      rows: [
        ['-ide', 'hydro- + root + **-ic acid**', `${f('HCl')}(aq): chloride → hydrochloric acid`],
        ['-ate', 'root + **-ic acid**', `${f('HNO3')}(aq): nitrate → nitric acid`],
        ['-ite', 'root + **-ous acid**', `${f('H2SO3')}(aq): sulfite → sulfurous acid`],
      ],
    },
    {
      type: 'tip',
      text: 'You can also name an acid like an ionic compound with “aqueous” in front: HCl(aq) is aqueous hydrogen chloride. Both are accepted here.',
    },
    {
      type: 'background',
      title: 'Metals vs non-metals',
      text: 'Metals are on the left of the staircase line on the periodic chart; non-metals are on the right (plus hydrogen).',
      topicId: 'b-periodic-table',
    },
  ],
  examples: [
    {
      title: 'Name a molecular compound',
      problem: `Name ${f('N2O5')}.`,
      steps: [
        { label: 'Ionic or molecular?', work: 'N and O are both non-metals → molecular, use prefixes' },
        { label: 'First element', work: '2 N → dinitrogen' },
        { label: 'Second element', work: '5 O → penta + oxide → pentoxide' },
      ],
      answer: 'dinitrogen pentoxide',
    },
    {
      title: 'Formula from a name',
      problem: 'Write the formula for sulfur hexafluoride.',
      steps: [
        { label: 'First element', work: 'sulfur, no prefix → 1 S' },
        { label: 'Second element', work: 'hexa = 6 → 6 F' },
      ],
      answer: f('SF6'),
    },
    {
      title: 'Name an acid',
      problem: `Name ${f('H2SO4')}(aq).`,
      steps: [
        { label: 'Negative ion', work: 'SO_{4}^{2−} is sulfate' },
        { label: 'Rule', work: '-ate → -ic acid' },
      ],
      answer: 'sulfuric acid',
    },
  ],
  stepGuide: [
    'Decide: ionic (metal or ammonium present) or molecular (non-metals only)?',
    'Molecular: first element takes a prefix only if more than one; second element always takes a prefix + -ide.',
    'Drop the doubled vowel before oxide (monoxide, pentoxide).',
    'Formula from name: prefixes become subscripts, with no charge balancing.',
    'Acids: -ide → hydro-…-ic acid; -ate → -ic acid; -ite → -ous acid.',
  ],
  practice: [
    { id: 'which-system', skill: 'ionic or molecular?', generate: whichSystem },
    { id: 'name-mol', skill: 'naming molecular compounds', generate: nameMolecular },
    { id: 'formula-mol', skill: 'molecular formulas from names', generate: formulaMolecular },
    { id: 'mono', skill: 'the mono- rule', generate: monoRule },
    { id: 'common', skill: 'common names', generate: commonName },
    { id: 'name-mol-2', skill: 'naming molecular compounds', generate: nameMolecular },
    { id: 'name-acid', skill: 'naming acids', generate: nameAcid },
    { id: 'formula-acid', skill: 'acid formulas', generate: formulaAcid },
    { id: 'formula-mol-2', skill: 'molecular formulas from names', generate: formulaMolecular },
    { id: 'mixed', skill: 'mixed review', generate: nameAnything },
    { id: 'name-acid-2', skill: 'naming acids', generate: nameAcid },
    { id: 'mixed-2', skill: 'mixed review', generate: nameAnything },
  ],
  videos: [
    {
      youtubeId: "DejkvR4pvRw",
      title: "Naming Covalent Molecular Compounds",
      channel: "Tyler DeWitt",
      note: "Prefixes for compounds of two non-metals. (Acids are covered in the Learn tab.)",
    },
    {
      youtubeId: "3agUL7-ezXk",
      title: "How To Name Covalent Molecular Compounds",
      channel: "The Organic Chemistry Tutor",
      note: "More practice with prefixes.",
    },
  ],
};
