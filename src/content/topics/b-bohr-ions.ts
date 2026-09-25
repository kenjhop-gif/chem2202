import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { mcTemplate, type MCItem } from '../quiz';
import { ELEMENTS } from '../../data/elements';
import type { Rng } from '../../engine/rng';

const FIRST20 = ELEMENTS.slice(0, 20);
const NOBLE = { 2: 'helium', 10: 'neon', 18: 'argon', 36: 'krypton' } as Record<number, string>;

/** Bohr model shell occupancy for Z ≤ 20: 2, 8, 8, 2. */
function shells(z: number): number[] {
  const caps = [2, 8, 8, 2];
  const out: number[] = [];
  let left = z;
  for (const cap of caps) {
    if (left <= 0) break;
    out.push(Math.min(cap, left));
    left -= cap;
  }
  return out;
}

const valence = (z: number) => shells(z).at(-1)!;
const isNoble = (z: number) => [2, 10, 18].includes(z);

/** Main-group ion charge for Z ≤ 20 (null for noble gases and group 14). */
function ionCharge(z: number): number | null {
  if (isNoble(z) || z === 1) return z === 1 ? 1 : null;
  const v = valence(z);
  if (v <= 3) return v;
  if (v >= 5) return v - 8;
  return null;
}

const chargeText = (q: number) => `${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '−'}`;

function arrangement(rng: Rng): Question {
  const el = rng.pick(FIRST20.slice(2));
  const s = shells(el.z);
  const right = s.join(', ');
  const wrongs = new Set<string>();
  if (s.length >= 2) wrongs.add([...s.slice(0, -2), s.at(-2)! + s.at(-1)!].join(', '));
  wrongs.add([s[0] + 1, ...s.slice(1)].filter((x) => x > 0).join(', '));
  wrongs.add([...s].reverse().join(', '));
  wrongs.add([Math.min(el.z, 8), ...(el.z > 8 ? [el.z - 8] : [])].join(', '));
  const options = rng.shuffle([right, ...[...wrongs].filter((w) => w !== right).slice(0, 3)]);
  return {
    prompt: `What is the electron arrangement (electrons per shell) of ${el.name} (${el.symbol})?`,
    steps: [
      {
        prompt: `How many electrons does a neutral ${el.symbol} atom have?`,
        answer: { kind: 'numeric', value: el.z, unit: 'electrons', tolerance: 0 },
        hints: ['Electrons = protons in a neutral atom.', 'Protons = atomic number.', `${el.symbol} is element ${el.z}.`],
        explain: `${el.z} electrons.`,
      },
      {
        prompt: 'Choose the correct arrangement.',
        answer: { kind: 'choice', options, correct: options.indexOf(right) },
        hints: ['Fill shells from the inside out.', 'Shell 1 holds 2, shell 2 holds 8, shell 3 holds 8 (for the first 20 elements).', `Fill ${el.z} electrons: 2, then up to 8, then up to 8…`],
        explain: `${el.symbol}: **${right}**. The outer shell has ${valence(el.z)} valence electron${valence(el.z) === 1 ? '' : 's'}.`,
      },
    ],
  };
}

function valenceQ(rng: Rng): Question {
  const el = rng.pick(FIRST20);
  const s = shells(el.z);
  return {
    prompt: `How many valence electrons does ${el.name} (${el.symbol}) have?`,
    steps: [
      {
        prompt: 'How many shells (energy levels) does it use?',
        answer: { kind: 'numeric', value: s.length, unit: 'shells', tolerance: 0 },
        hints: ['It matches the period (row) number.', `${el.symbol} is element ${el.z}.`, `Arrangement: ${s.join(', ')}`],
        explain: `${s.length} shells (period ${s.length}).`,
      },
      {
        prompt: 'How many electrons are in the outer shell?',
        answer: { kind: 'numeric', value: valence(el.z), unit: 'valence e^{−}', tolerance: 0 },
        hints: ['Valence electrons are in the outermost shell.', 'For groups 1–2 it’s the group number; for groups 13–18, subtract 10 (except He: 2).', `Arrangement: ${s.join(', ')}. Look at the last number.`],
        mistakes: [{ value: el.z, message: 'That’s all the electrons. Only count the outer shell.' }],
        explain: `${s.join(', ')} → **${valence(el.z)}** valence electron${valence(el.z) === 1 ? '' : 's'}.`,
      },
    ],
  };
}

function ionFormation(rng: Rng): Question {
  const el = rng.pick(FIRST20.filter((e) => e.z > 2 && e.z !== 5 && ionCharge(e.z) !== null));
  const v = valence(el.z);
  const q = ionCharge(el.z)!;
  const loses = q > 0;
  const noble = NOBLE[el.z - q];
  const chargeOpts = rng.shuffle([q, -q, q > 0 ? q + 1 : q - 1, q > 0 ? -(8 - v) : v].filter((x, i, a) => a.indexOf(x) === i && x !== 0));
  return {
    prompt: `What ion does ${el.name} (${el.symbol}) form?`,
    steps: [
      {
        prompt: 'How many valence electrons does it have?',
        answer: { kind: 'numeric', value: v, tolerance: 0 },
        hints: ['Count the outer shell.', `Arrangement: ${shells(el.z).join(', ')}.`, 'The last number is the valence electrons.'],
        explain: `${v} valence electrons.`,
      },
      {
        prompt: 'To get a full outer shell, will it lose or gain electrons?',
        answer: { kind: 'choice', options: [`lose ${v}`, `gain ${8 - v}`], correct: loses ? 0 : 1 },
        hints: ['Atoms take the easier path to a full shell.', 'Metals (1–3 valence e⁻) lose electrons. Non-metals (5–7) gain.', `Losing ${v} or gaining ${8 - v}: which is fewer?`],
        explain: loses ? `Losing ${v} is easier than gaining ${8 - v}.` : `Gaining ${8 - v} is easier than losing ${v}.`,
      },
      {
        prompt: 'What is the charge on the ion?',
        answer: { kind: 'choice', options: chargeOpts.map(chargeText), correct: chargeOpts.indexOf(q) },
        hints: ['Losing electrons (negative) leaves a positive charge.', 'Gaining electrons makes it negative.', `${loses ? 'Lost' : 'Gained'} ${Math.abs(q)} → ${chargeText(q)}`],
        explain: `${el.symbol} forms **[[${el.symbol}^{${chargeText(q)}}]]**, with the same arrangement as ${noble}. Check your periodic chart: it lists ${chargeText(q)} too.`,
      },
    ],
  };
}

function isoelectronic(rng: Rng): Question {
  const el = rng.pick(FIRST20.filter((e) => e.z > 2 && e.z !== 5 && ionCharge(e.z) !== null));
  const q = ionCharge(el.z)!;
  const noble = NOBLE[el.z - q];
  const options = ['helium', 'neon', 'argon', 'krypton'];
  return {
    prompt: `The ion [[${el.symbol}^{${chargeText(q)}}]] has the same electron arrangement as which noble gas?`,
    steps: [
      {
        prompt: 'Choose one.',
        answer: { kind: 'choice', options, correct: options.indexOf(noble) },
        hints: ['Count the ion’s electrons.', `${el.symbol} has ${el.z} protons; the ion has ${el.z - q} electrons.`, `Which noble gas has ${el.z - q} electrons?`],
        explain: `[[${el.symbol}^{${chargeText(q)}}]] has ${el.z - q} electrons, the same as **${noble}**.`,
      },
    ],
  };
}

const concepts: MCItem[] = [
  {
    q: 'Why do atoms form ions?',
    correct: 'To get a full outer shell, like a noble gas',
    wrong: ['To gain more protons', 'To become heavier', 'To change into a different element'],
    hints: ['Noble gases are very stable.', 'What do noble gases have that other atoms don’t?', 'A full outer shell.'],
    explain: 'Atoms gain or lose electrons to reach a stable, full outer shell (the same arrangement as a noble gas).',
  },
  {
    q: 'In a Bohr diagram, what does the number in the centre show?',
    correct: 'The protons (and neutrons) in the nucleus',
    wrong: ['The valence electrons', 'The number of shells', 'The ion charge'],
    hints: ['The centre of the atom is the nucleus.', 'What’s in the nucleus?', 'Electrons go in the rings around it.'],
    explain: 'The centre shows the nucleus (e.g. 11p, 12n for sodium); electrons go in the shells around it.',
  },
  {
    q: 'Which elements have the same number of valence electrons as oxygen?',
    correct: 'Sulfur and selenium',
    wrong: ['Nitrogen and fluorine', 'Neon and argon', 'Carbon and silicon'],
    hints: ['Valence electrons are the same down a group.', 'Oxygen is in group 16.', 'Which elements are also in group 16?'],
    explain: 'Group 16 elements (O, S, Se…) all have 6 valence electrons.',
  },
  {
    q: 'What happens to the number of protons when sodium becomes Na⁺?',
    correct: 'It stays the same',
    wrong: ['It goes down by 1', 'It goes up by 1', 'It doubles'],
    hints: ['Ions form by moving electrons.', 'The nucleus doesn’t change.', 'Changing protons would change the element.'],
    explain: 'Only electrons move. Na⁺ still has 11 protons, but 10 electrons.',
  },
];

export const bohrIonsTopic: Topic = {
  meta: TOPIC_META['b-bohr-ions'],
  summary: 'Electrons fill shells around the nucleus. The outer (valence) electrons decide how an atom bonds and what ion it forms.',
  learn: [
    { type: 'p', text: 'In the **Bohr model**, electrons orbit the nucleus in shells (energy levels). For the first 20 elements, shells fill in order:' },
    { type: 'equation', text: 'shell 1: 2 · shell 2: 8 · shell 3: 8 · shell 4: 2', caption: 'Fill the inner shell before moving out.' },
    {
      type: 'table',
      head: ['Element', 'Electrons', 'Arrangement', 'Valence e^{−}'],
      rows: [
        ['C', '6', '2, 4', '4'],
        ['Na', '11', '2, 8, 1', '1'],
        ['Cl', '17', '2, 8, 7', '7'],
        ['Ca', '20', '2, 8, 8, 2', '2'],
      ],
    },
    { type: 'key', title: 'Valence electrons', text: 'Electrons in the **outermost** shell. For groups 1–2, valence = group number; for groups 13–18, valence = group number − 10 (He has 2).' },
    { type: 'h', text: 'Ions' },
    {
      type: 'p',
      text: 'Atoms are most stable with a full outer shell, like the noble gases. **Metals lose** their few valence electrons → positive ions. **Non-metals gain** electrons to reach 8 → negative ions.',
    },
    {
      type: 'table',
      head: ['Group', '1', '2', '13', '15', '16', '17'],
      rows: [['Ion charge', '1+', '2+', '3+', '3−', '2−', '1−']],
    },
    { type: 'tip', text: 'Your periodic chart lists each element’s common ion charge in the corner of its box: a handy check.' },
  ],
  examples: [
    {
      title: 'Magnesium',
      problem: 'Describe the electron arrangement of Mg and the ion it forms.',
      steps: [
        { label: 'Electrons', work: 'Atomic number 12 → 12 electrons' },
        { label: 'Arrangement', work: '2, 8, 2 → 2 valence electrons' },
        { label: 'Ion', work: 'Easier to lose 2 than gain 6 → Mg^{2+} (2, 8), like neon' },
      ],
      answer: 'Mg: 2, 8, 2 → Mg^{2+}',
    },
    {
      title: 'Chlorine',
      problem: 'What ion does chlorine form?',
      steps: [
        { label: 'Arrangement', work: '17 electrons: 2, 8, 7 → 7 valence electrons' },
        { label: 'Ion', work: 'Gain 1 to reach 8 → Cl^{−} (2, 8, 8), like argon' },
      ],
      answer: 'Cl^{−}',
    },
  ],
  stepGuide: [
    'Electrons in a neutral atom = atomic number.',
    'Fill shells 2, 8, 8, 2 from the inside out.',
    'Valence electrons = the outer shell.',
    '1–3 valence → lose them (positive ion). 5–7 → gain to reach 8 (negative ion).',
  ],
  practice: [
    { id: 'valence', skill: 'valence electrons', generate: valenceQ },
    { id: 'arrangement', skill: 'electron arrangement', generate: arrangement },
    { id: 'ion', skill: 'predicting ions', generate: ionFormation },
    mcTemplate('concepts', 'why ions form', concepts),
    { id: 'isoelectronic', skill: 'ions and noble gases', generate: isoelectronic },
    { id: 'arrangement-2', skill: 'electron arrangement', generate: arrangement },
    { id: 'ion-2', skill: 'predicting ions', generate: ionFormation },
    { id: 'valence-2', skill: 'valence electrons', generate: valenceQ },
    mcTemplate('concepts-2', 'why ions form', concepts),
    { id: 'ion-3', skill: 'predicting ions', generate: ionFormation },
  ],
  videos: [],
};
