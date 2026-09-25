import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { mcTemplate, type MCItem } from '../quiz';
import { ELEMENTS, ELEMENT_BY_SYMBOL, gridPosition } from '../../data/elements';
import type { Rng } from '../../engine/rng';

const MAIN = ELEMENTS.filter((e) => e.z <= 56 && !(e.z >= 21 && e.z <= 30) && !(e.z >= 39 && e.z <= 48));
const METALLOIDS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);
const NONMETALS = new Set(['H', 'He', 'C', 'N', 'O', 'F', 'Ne', 'P', 'S', 'Cl', 'Ar', 'Se', 'Br', 'Kr', 'I', 'Xe']);

const FAMILY: Record<number, string> = { 1: 'alkali metals', 2: 'alkaline earth metals', 17: 'halogens', 18: 'noble gases' };

function kindOf(symbol: string): string {
  if (METALLOIDS.has(symbol)) return 'metalloid';
  if (NONMETALS.has(symbol)) return 'non-metal';
  return 'metal';
}

function groupPeriod(rng: Rng): Question {
  const el = rng.pick(MAIN);
  const { row, col } = gridPosition(el.z);
  return {
    prompt: `Where is ${el.name} (${el.symbol}) on the periodic table?`,
    steps: [
      {
        prompt: 'Which **period** (row) is it in?',
        answer: { kind: 'numeric', value: row, tolerance: 0 },
        hints: ['Periods are the horizontal rows.', 'Count rows from the top: H and He are in period 1.', `Find ${el.symbol} (atomic number ${el.z}) and count down.`],
        mistakes: [{ value: col, message: 'That’s the group (column). Periods are the rows.' }],
        explain: `${el.symbol} is in period ${row}.`,
      },
      {
        prompt: 'Which **group** (column) is it in? (Use the 1–18 numbering.)',
        answer: { kind: 'numeric', value: col, tolerance: 0 },
        hints: ['Groups are the vertical columns.', 'Groups are numbered 1 to 18 across the top.', `Look at the number above ${el.symbol}’s column.`],
        mistakes: [{ value: row, message: 'That’s the period (row). Groups are the columns.' }],
        explain: `${el.symbol} is in group ${col}.`,
      },
    ],
  };
}

function family(rng: Rng): Question {
  const el = rng.pick(MAIN.filter((e) => FAMILY[gridPosition(e.z).col] && e.symbol !== 'H'));
  const fam = FAMILY[gridPosition(el.z).col];
  const options = rng.shuffle(Object.values(FAMILY));
  return {
    prompt: `Which family does ${el.name} (${el.symbol}) belong to?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: options.indexOf(fam) },
        hints: ['Families are groups (columns) with similar properties.', 'Group 1 alkali metals, group 2 alkaline earth metals, group 17 halogens, group 18 noble gases.', `${el.symbol} is in group ${gridPosition(el.z).col}.`],
        explain: `${el.symbol} is in group ${gridPosition(el.z).col}: the **${fam}**.`,
      },
    ],
  };
}

function metalOrNot(rng: Rng): Question {
  const pool = rng.next() < 0.3 ? MAIN.filter((e) => METALLOIDS.has(e.symbol)) : MAIN;
  const el = rng.pick(pool);
  const kind = kindOf(el.symbol);
  const options = ['metal', 'non-metal', 'metalloid'];
  return {
    prompt: `Is ${el.name} (${el.symbol}) a metal, a non-metal, or a metalloid?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: options.indexOf(kind) },
        hints: [
          'Find the “staircase” line on the right side of the periodic table.',
          'Metals are left of the staircase; non-metals are right (hydrogen is a non-metal too).',
          'Metalloids sit along the staircase: B, Si, Ge, As, Sb, Te.',
        ],
        explain: `${el.symbol} is a **${kind}**.`,
      },
    ],
  };
}

function state(rng: Rng): Question {
  const special = ['Br', 'Hg', 'N', 'O', 'Cl', 'F', 'Ne', 'Ar', 'He', 'H'];
  const sym = rng.next() < 0.6 ? rng.pick(special) : rng.pick(MAIN).symbol;
  const el = ELEMENT_BY_SYMBOL[sym];
  const options = ['solid', 'liquid', 'gas'];
  return {
    prompt: `At room temperature, is ${el.name} (${el.symbol}) a solid, liquid, or gas?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: options.indexOf(el.state) },
        hints: ['Your periodic chart shades gases and liquids differently.', 'Only two elements are liquids at room temperature: bromine and mercury.', 'The gases are H, N, O, F, Cl, and the noble gases.'],
        explain: `${el.name} is a **${el.state}** at room temperature.`,
      },
    ],
  };
}

function identify(rng: Rng): Question {
  const el = rng.pick(MAIN);
  const { row, col } = gridPosition(el.z);
  const others = rng.shuffle(MAIN.filter((e) => e !== el && (gridPosition(e.z).row === row || gridPosition(e.z).col === col))).slice(0, 3);
  const opts = rng.shuffle([el, ...others]);
  return {
    prompt: `Which element is in period ${row}, group ${col}?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options: opts.map((e) => `${e.name} (${e.symbol})`), correct: opts.indexOf(el) },
        hints: ['Period = row, group = column.', `Go down to row ${row}.`, `Then across to column ${col}.`],
        explain: `Period ${row}, group ${col} is **${el.name} (${el.symbol})**.`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'Why do elements in the same group have similar chemical properties?',
    correct: 'They have the same number of valence (outer) electrons',
    wrong: ['They have the same mass', 'They have the same number of neutrons', 'They are all in the same state'],
    hints: ['Chemical properties depend on electrons.', 'Specifically, the outermost electrons.', 'Everything in group 1 has 1 outer electron.'],
    explain: 'Same group → same number of valence electrons → they react in similar ways.',
  },
  {
    q: 'Which family is the **least** reactive?',
    correct: 'noble gases',
    wrong: ['alkali metals', 'halogens', 'alkaline earth metals'],
    hints: ['One family has full outer shells.', 'They almost never form compounds.', 'Group 18.'],
    explain: 'The noble gases (group 18) have full outer shells, so they’re very unreactive.',
  },
  {
    q: 'Which is a typical property of **metals**?',
    correct: 'They conduct electricity and are malleable',
    wrong: ['They are brittle and dull', 'They are usually gases', 'They gain electrons to form negative ions'],
    hints: ['Think of copper wire and aluminum foil.', 'Metals are shiny, conduct, and bend.', 'Metals lose electrons to form positive ions.'],
    explain: 'Metals are shiny, malleable, ductile, and good conductors. They form **positive** ions.',
  },
  {
    q: 'Going **down** group 1 (Li → Na → K), the metals become…',
    correct: 'more reactive',
    wrong: ['less reactive', 'non-metals', 'gases'],
    hints: ['Potassium reacts with water more violently than sodium.', 'The outer electron is farther from the nucleus.', 'Easier to lose → more reactive.'],
    explain: 'Down group 1 the outer electron is farther from the nucleus and easier to lose, so reactivity increases.',
  },
  {
    q: 'The rows of the periodic table are called…',
    correct: 'periods',
    wrong: ['groups', 'families', 'series'],
    hints: ['Rows go across.', 'Columns are groups or families.', 'Rows are…'],
    explain: 'Rows are **periods**; columns are **groups** (families).',
  },
];

export const periodicTableTopic: Topic = {
  meta: TOPIC_META['b-periodic-table'],
  summary: 'The periodic table is organized so that elements with similar properties line up in columns.',
  learn: [
    {
      type: 'list',
      items: [
        '**Periods** are the horizontal rows (1–7).',
        '**Groups** (families) are the vertical columns (1–18). Elements in a group have similar properties.',
        'Elements are in order of **atomic number** (number of protons).',
      ],
    },
    {
      type: 'table',
      head: ['Group', 'Family', 'Notes'],
      rows: [
        ['1', 'alkali metals', 'very reactive metals; form 1+ ions (H is in group 1 but is a non-metal)'],
        ['2', 'alkaline earth metals', 'reactive metals; form 2+ ions'],
        ['3–12', 'transition metals', 'many can form more than one ion'],
        ['17', 'halogens', 'very reactive non-metals; form 1− ions'],
        ['18', 'noble gases', 'very unreactive; full outer shells'],
      ],
    },
    { type: 'h', text: 'Metals, non-metals, and metalloids' },
    {
      type: 'p',
      text: 'A “staircase” line runs down the right side of the table. **Metals** are to the left (shiny, conduct, malleable, form positive ions). **Non-metals** are to the right, plus hydrogen (dull, brittle, poor conductors, form negative ions). **Metalloids** sit on the staircase: B, Si, Ge, As, Sb, Te.',
    },
    {
      type: 'tip',
      text: 'At room temperature most elements are solids. Only bromine and mercury are liquids. The gases are H, N, O, F, Cl, and the noble gases. Your class chart shades them.',
    },
    {
      type: 'background',
      title: 'Reading an element’s box',
      text: 'Each box on the NL chart shows the atomic number, symbol, name, molar mass, electronegativity, and common ion charges. Tap “Periodic chart” at the top of the app to explore.',
    },
  ],
  examples: [
    {
      title: 'Locate an element',
      problem: 'Where is sulfur, and what kind of element is it?',
      steps: [
        { label: 'Period', work: 'S is in row 3 → period 3' },
        { label: 'Group', work: 'Column 16 → group 16' },
        { label: 'Type', work: 'Right of the staircase → non-metal' },
      ],
      answer: 'Period 3, group 16, non-metal',
    },
  ],
  stepGuide: [
    'Period = row (count from the top). Group = column (1–18).',
    'Families: 1 alkali metals, 2 alkaline earth metals, 17 halogens, 18 noble gases.',
    'Left of the staircase = metals; right = non-metals; on it = metalloids.',
  ],
  practice: [
    { id: 'where', skill: 'groups and periods', generate: groupPeriod },
    { id: 'family', skill: 'chemical families', generate: family },
    { id: 'metal', skill: 'metals, non-metals, metalloids', generate: metalOrNot },
    mcTemplate('concepts', 'how the table is organized', concepts),
    { id: 'identify', skill: 'finding an element', generate: identify },
    { id: 'state', skill: 'states at room temperature', generate: state },
    { id: 'family-2', skill: 'chemical families', generate: family },
    { id: 'where-2', skill: 'groups and periods', generate: groupPeriod },
    mcTemplate('concepts-2', 'how the table is organized', concepts),
    { id: 'metal-2', skill: 'metals, non-metals, metalloids', generate: metalOrNot },
  ],
  videos: [
    {
      youtubeId: "iY_RQzna0j4",
      title: "Periodic Table: Groups, Periods, Metals, Nonmetals and Metalloids",
      channel: "Beals Science School",
      note: "A tour of how the table is organized.",
    },
    {
      youtubeId: "xe9HptIx7xI",
      title: "How is the Periodic Table Organized",
      channel: "Science, Math, and Chemistry",
      note: "Columns, rows, and the main families.",
    },
  ],
};
