import type { BalanceAnswer, Question, Step, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f } from '../substances';
import { FIXED_CATIONS, MONATOMIC_ANIONS, MULTIVALENT_CATIONS, POLYATOMIC_ANIONS, ionText, ionic, ionicFormulaMistakes, type Ion } from '../ions';
import { equationText, solveBalance } from '../../engine/balance';
import type { Rng } from '../../engine/rng';

type RxType = 'formation' | 'decomposition' | 'single displacement' | 'double displacement' | 'combustion';
const TYPES: RxType[] = ['formation', 'decomposition', 'single displacement', 'double displacement', 'combustion'];

interface Reaction {
  type: RxType;
  reactants: string[];
  products: string[];
  coefficients: number[];
}

/** Elements as they exist on their own (diatomics: H, N, O, F, Cl, Br, I). */
const ELEMENT_FORM: Record<string, string> = { H: 'H2', N: 'N2', O: 'O2', F: 'F2', Cl: 'Cl2', Br: 'Br2', I: 'I2' };
const asElement = (symbol: string) => ELEMENT_FORM[symbol] ?? symbol;

function rx(type: RxType, reactants: string[], products: string[], coefficients?: number[]): Reaction {
  const c = coefficients ?? solveBalance(reactants, products);
  if (!c) throw new Error(`Can't balance ${reactants} → ${products}`);
  return { type, reactants, products, coefficients: c };
}

// ---------- Generators ----------

const FORMATION_ANIONS = MONATOMIC_ANIONS.filter((a) => a.formula !== 'P');

function formation(rng: Rng): Reaction & { cation: Ion; anion: Ion } {
  const cation = rng.pick(FIXED_CATIONS.filter((c) => c.formula !== 'Ag'));
  const anion = rng.pick(FORMATION_ANIONS);
  const product = ionic(cation, anion).formula;
  return { ...rx('formation', [cation.formula, asElement(anion.formula)], [product]), cation, anion };
}

function decomposition(rng: Rng): Reaction {
  if (rng.next() < 0.4) {
    const known: [string[], string[]][] = [
      [['H2O'], ['H2', 'O2']],
      [['H2O2'], ['H2O', 'O2']],
      [['CaCO3'], ['CaO', 'CO2']],
      [['KClO3'], ['KCl', 'O2']],
      [['NaN3'], ['Na', 'N2']],
    ];
    const [r, p] = rng.pick(known);
    return rx('decomposition', r, p);
  }
  const { cation, anion, products } = formation(rng);
  return rx('decomposition', products, [cation.formula, asElement(anion.formula)]);
}

const ACTIVE_METALS = FIXED_CATIONS.filter((c) => ['Mg', 'Zn', 'Al'].includes(c.formula));
const LESS_ACTIVE: Ion[] = [MULTIVALENT_CATIONS[3], FIXED_CATIONS.find((c) => c.formula === 'Ag')!, MULTIVALENT_CATIONS[4]]; // Cu2+, Ag+, Pb2+

function singleDisplacement(rng: Rng): Reaction & { newCompound: string; freed: string } {
  const kind = rng.int(0, 2);
  if (kind === 0) {
    // Active metal + salt of a less active metal.
    const m = rng.pick(ACTIVE_METALS);
    const old = rng.pick(LESS_ACTIVE);
    const anion = rng.pick([POLYATOMIC_ANIONS[1], POLYATOMIC_ANIONS[7], MONATOMIC_ANIONS[1]].filter((a) => !(old.formula === 'Pb' && a.formula === 'SO4') && !(old.formula === 'Ag' && a.formula === 'Cl')));
    const reactant = ionic(old, anion).formula;
    const newCompound = ionic(m, anion).formula;
    return { ...rx('single displacement', [m.formula, reactant], [newCompound, old.formula]), newCompound, freed: old.formula };
  }
  if (kind === 1) {
    // Metal + acid → salt + hydrogen.
    const m = rng.pick(ACTIVE_METALS);
    const acid = rng.pick([{ f: 'HCl', a: MONATOMIC_ANIONS[1] }, { f: 'H2SO4', a: POLYATOMIC_ANIONS[7] }]);
    const newCompound = ionic(m, acid.a).formula;
    return { ...rx('single displacement', [m.formula, acid.f], [newCompound, 'H2']), newCompound, freed: 'H2' };
  }
  // A more reactive halogen replaces a less reactive one.
  const pairs: [string, string][] = [['Cl', 'Br'], ['Cl', 'I'], ['Br', 'I']];
  const [strong, weak] = rng.pick(pairs);
  const metal = rng.pick(FIXED_CATIONS.filter((c) => ['Na', 'K', 'Mg', 'Ca'].includes(c.formula)));
  const anionOf = (s: string) => MONATOMIC_ANIONS.find((a) => a.formula === s)!;
  const reactant = ionic(metal, anionOf(weak)).formula;
  const newCompound = ionic(metal, anionOf(strong)).formula;
  return { ...rx('single displacement', [asElement(strong), reactant], [newCompound, asElement(weak)]), newCompound, freed: asElement(weak) };
}

const DD_CATIONS = FIXED_CATIONS.filter((c) => c.formula !== 'Li');
const DD_ANIONS = [MONATOMIC_ANIONS[1], MONATOMIC_ANIONS[3], POLYATOMIC_ANIONS[0], POLYATOMIC_ANIONS[1], POLYATOMIC_ANIONS[7], POLYATOMIC_ANIONS[9], POLYATOMIC_ANIONS[12]];

function doubleDisplacement(rng: Rng): Reaction & { p1: string; p2: string; c1: Ion; c2: Ion; a1: Ion; a2: Ion } {
  if (rng.next() < 0.3) {
    // Neutralization: acid + hydroxide → salt + water.
    const acid = rng.pick([{ f: 'HCl', a: MONATOMIC_ANIONS[1] }, { f: 'HNO3', a: POLYATOMIC_ANIONS[1] }, { f: 'H2SO4', a: POLYATOMIC_ANIONS[7] }, { f: 'H3PO4', a: POLYATOMIC_ANIONS[12] }]);
    const c2 = rng.pick(FIXED_CATIONS.filter((c) => ['Na', 'K', 'Ca', 'Ba', 'Mg'].includes(c.formula)));
    const base = ionic(c2, POLYATOMIC_ANIONS[0]).formula;
    const salt = ionic(c2, acid.a).formula;
    const H: Ion = { formula: 'H', name: 'hydrogen', charge: 1 };
    return { ...rx('double displacement', [acid.f, base], [salt, 'H2O']), p1: salt, p2: 'H2O', c1: H, c2, a1: acid.a, a2: POLYATOMIC_ANIONS[0] };
  }
  const [c1, c2] = rng.shuffle(DD_CATIONS).slice(0, 2);
  const [a1, a2] = rng.shuffle(DD_ANIONS).slice(0, 2);
  const r1 = ionic(c1, a1).formula;
  const r2 = ionic(c2, a2).formula;
  const p1 = ionic(c1, a2).formula;
  const p2 = ionic(c2, a1).formula;
  return { ...rx('double displacement', [r1, r2], [p1, p2]), p1, p2, c1, c2, a1, a2 };
}

const COMBUSTION: [string, string, number[]][] = [
  ['CH4', 'methane', [1, 2, 1, 2]],
  ['C2H6', 'ethane', [2, 7, 4, 6]],
  ['C3H8', 'propane', [1, 5, 3, 4]],
  ['C4H10', 'butane', [2, 13, 8, 10]],
  ['C2H4', 'ethene', [1, 3, 2, 2]],
  ['C2H2', 'ethyne (acetylene)', [2, 5, 4, 2]],
  ['C6H12O6', 'glucose', [1, 6, 6, 6]],
  ['C2H6O', 'ethanol', [1, 3, 2, 3]],
  ['C8H18', 'octane', [2, 25, 16, 18]],
  ['CH4O', 'methanol', [2, 3, 2, 4]],
];

function combustion(rng: Rng): Reaction & { name: string } {
  const [fuel, name, c] = rng.pick(COMBUSTION);
  return { ...rx('combustion', [fuel, 'O2'], ['CO2', 'H2O'], c), name };
}

function anyReaction(rng: Rng): Reaction {
  const t = rng.pick(TYPES);
  if (t === 'formation') return formation(rng);
  if (t === 'decomposition') return decomposition(rng);
  if (t === 'single displacement') return singleDisplacement(rng);
  if (t === 'double displacement') return doubleDisplacement(rng);
  return combustion(rng);
}

// ---------- Steps ----------

const TYPE_HINTS: [string, string, string] = [
  'Count reactants and products, and look at what kind of substances they are.',
  'A + B → AB (formation) · AB → A + B (decomposition) · A + BC → AC + B (single) · AB + CD → AD + CB (double).',
  'Anything burning in O_{2} to make CO_{2} and H_{2}O is combustion.',
];

function typeStep(r: Reaction, rng: Rng, show = true): Step {
  const options = rng.shuffle([...TYPES]);
  return {
    prompt: show ? `What type of reaction is ${equationText(r.reactants, r.products)}?` : 'What type of reaction is this?',
    answer: { kind: 'choice', options, correct: options.indexOf(r.type) },
    hints: TYPE_HINTS,
    explain: `This is a **${r.type}** reaction.`,
  };
}

function balanceStep(r: Reaction): Step {
  const answer: BalanceAnswer = { kind: 'balance', reactants: r.reactants, products: r.products, coefficients: r.coefficients };
  const all = [...r.reactants, ...r.products];
  const first = r.coefficients.findIndex((c) => c > 1);
  const hasO2 = r.reactants.includes('O2');
  return {
    prompt: 'Balance the equation. (Leave a box blank for 1.)',
    answer,
    hints: [
      'Change only the coefficients (the big numbers in front), never the subscripts.',
      hasO2 ? 'Balance C first, then H, and save O for last.' : 'Start with the element that appears in the fewest formulas; leave H and O (and lone elements) for last.',
      first >= 0 ? `Try a ${r.coefficients[first]} in front of ${f(all[first])}, then fix the rest.` : 'Check: it may already be balanced with all 1s.',
    ],
    explain: `**${equationText(r.reactants, r.products, r.coefficients)}**`,
  };
}

// ---------- Templates ----------

function balanceOnly(rng: Rng): Question {
  const r = anyReaction(rng);
  return { prompt: `Balance: ${equationText(r.reactants, r.products)}`, steps: [balanceStep(r)] };
}

function classifyOnly(rng: Rng): Question {
  const r = anyReaction(rng);
  return { prompt: `Classify this reaction: ${equationText(r.reactants, r.products, r.coefficients)}`, steps: [typeStep(r, rng, false)] };
}

function predictFormation(rng: Rng): Question {
  const r = formation(rng);
  const c = ionic(r.cation, r.anion);
  return {
    prompt: `Predict the product and balance: ${equationText(r.reactants, ['?'])}`,
    steps: [
      typeStep({ ...r, products: ['?'] } as Reaction, rng, false),
      {
        prompt: 'Write the formula of the product.',
        answer: { kind: 'formula', formula: c.formula },
        hints: [
          'A metal + a non-metal make an ionic compound.',
          `The ions are ${ionText(r.cation)} and ${ionText(r.anion)}.`,
          'Balance the charges to find the subscripts.',
        ],
        mistakes: [
          { formula: r.reactants[0] + r.reactants[1], message: 'In the compound the non-metal is an ion, not a diatomic molecule. Use the ion charges.' },
          ...ionicFormulaMistakes(c),
        ],
        explain: `${ionText(r.cation)} + ${ionText(r.anion)} → **${f(c.formula)}**`,
      },
      balanceStep(r),
    ],
  };
}

function predictSingle(rng: Rng): Question {
  const r = singleDisplacement(rng);
  return {
    prompt: `Predict the products and balance: ${equationText(r.reactants, ['?'])}`,
    steps: [
      typeStep({ ...r, products: ['?'] } as Reaction, rng, false),
      {
        prompt: `One product is ${f(r.freed)}. Write the formula of the new compound.`,
        answer: { kind: 'formula', formula: r.newCompound },
        hints: [
          'The lone element swaps places with the matching part of the compound.',
          'A metal replaces the metal (or hydrogen); a halogen replaces the halogen.',
          'Write the new compound using ion charges.',
        ],
        explain: `The new compound is **${f(r.newCompound)}**.`,
      },
      balanceStep(r),
    ],
  };
}

function predictDouble(rng: Rng): Question {
  const r = doubleDisplacement(rng);
  return {
    prompt: `Predict the products and balance: ${equationText(r.reactants, ['?'])}`,
    steps: [
      typeStep({ ...r, products: ['?'] } as Reaction, rng, false),
      {
        prompt: `The positive ions swap partners. What does ${r.c1.formula === 'H' ? 'H^{+}' : ionText(r.c1)} pair with?`,
        answer: { kind: 'formula', formula: r.p1 },
        hints: ['AB + CD → AD + CB.', `${r.c1.formula === 'H' ? 'H^{+}' : ionText(r.c1)} takes the other compound’s negative ion, ${ionText(r.a2)}.`, 'Balance the charges for the formula.'],
        explain: `→ **${f(r.p1)}**`,
      },
      {
        prompt: `And ${ionText(r.c2)} pairs with…`,
        answer: { kind: 'formula', formula: r.p2 },
        hints: ['The other two ions go together.', `${ionText(r.c2)} with ${ionText(r.a1)}.`, 'Balance the charges.'],
        explain: `→ **${f(r.p2)}**`,
      },
      balanceStep(r),
    ],
  };
}

function predictCombustion(rng: Rng): Question {
  const r = combustion(rng);
  const opts = rng.shuffle([`${f('CO2')} and ${f('H2O')}`, `${f('CO')} and ${f('H2')}`, `${f('C')} and ${f('H2O')}`, `${f('CO2')} and ${f('H2')}`]);
  return {
    prompt: `${r.name[0].toUpperCase() + r.name.slice(1)}, ${f(r.reactants[0])}, burns completely in oxygen. Write the balanced equation.`,
    steps: [
      {
        prompt: 'What are the products of complete combustion?',
        answer: { kind: 'choice', options: opts, correct: opts.indexOf(`${f('CO2')} and ${f('H2O')}`) },
        hints: ['Carbon ends up fully oxidized.', 'Hydrogen ends up in water.', 'Complete combustion always gives the same two products.'],
        explain: 'Complete combustion of a fuel with C and H always gives **CO_{2} and H_{2}O**.',
      },
      balanceStep(r),
    ],
  };
}

export const reactionsTopic: Topic = {
  meta: TOPIC_META['u1-reactions'],
  summary: 'Classify reactions into five types, predict their products, and balance the equations.',
  learn: [
    {
      type: 'table',
      head: ['Type', 'Pattern', 'Example'],
      rows: [
        ['**Formation** (synthesis)', 'A + B → AB', `2 ${f('Na')} + ${f('Cl2')} → 2 ${f('NaCl')}`],
        ['**Decomposition**', 'AB → A + B', `2 ${f('H2O')} → 2 ${f('H2')} + ${f('O2')}`],
        ['**Single displacement**', 'A + BC → AC + B', `${f('Zn')} + ${f('CuSO4')} → ${f('ZnSO4')} + ${f('Cu')}`],
        ['**Double displacement**', 'AB + CD → AD + CB', `${f('AgNO3')} + ${f('NaCl')} → ${f('AgCl')} + ${f('NaNO3')}`],
        ['**Combustion**', 'fuel + O_{2} → CO_{2} + H_{2}O', `${f('CH4')} + 2 ${f('O2')} → ${f('CO2')} + 2 ${f('H2O')}`],
      ],
    },
    {
      type: 'tip',
      text: `Seven elements exist as **diatomic** molecules on their own: ${['H2', 'N2', 'O2', 'F2', 'Cl2', 'Br2', 'I2'].map(f).join(', ')}. Write them that way whenever they appear alone in an equation.`,
    },
    { type: 'h', text: 'Predicting products' },
    {
      type: 'list',
      items: [
        '**Formation:** metal + non-metal → ionic compound. Use the ion charges for the formula.',
        '**Decomposition:** a compound breaks into simpler substances (often its elements).',
        '**Single displacement:** a lone element swaps in: a metal replaces a metal (or H in an acid); a halogen replaces a halogen.',
        '**Double displacement:** the positive ions swap partners. Acid + base (neutralization) is a double displacement that makes water.',
        '**Combustion:** complete burning always makes CO_{2} and H_{2}O.',
      ],
    },
    { type: 'h', text: 'Balancing' },
    {
      type: 'key',
      title: 'Conservation of mass',
      text: 'Atoms aren’t created or destroyed, so each element must have the same number of atoms on both sides. Balance by changing **coefficients**, never subscripts.',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Count atoms of each element on both sides.',
        'Balance elements that appear in only one formula per side first (metals, C).',
        'Keep polyatomic ions together if they appear unchanged on both sides.',
        'Balance H, then O (and lone elements like O_{2}) last.',
        'Use the lowest whole-number coefficients.',
      ],
    },
    {
      type: 'background',
      title: 'Writing formulas',
      text: 'Predicting products needs correct formulas. Review ionic naming if charges feel shaky.',
      topicId: 'u1-naming-ionic',
    },
  ],
  examples: [
    {
      title: 'Balance a formation reaction',
      problem: `Balance: ${f('Al')} + ${f('O2')} → ${f('Al2O3')}`,
      steps: [
        { label: 'O first', work: 'O is 2 on the left, 3 on the right. The lowest common multiple is 6 → 3 O_{2} and 2 Al_{2}O_{3}' },
        { label: 'Then Al', work: '2 Al_{2}O_{3} has 4 Al → 4 Al' },
      ],
      answer: `4 ${f('Al')} + 3 ${f('O2')} → 2 ${f('Al2O3')}`,
    },
    {
      title: 'Predict and balance a double displacement',
      problem: `${f('BaCl2')} + ${f('Na2SO4')} → ?`,
      steps: [
        { label: 'Swap partners', work: 'Ba^{2+} with SO_{4}^{2−} → BaSO_{4}; Na^{+} with Cl^{−} → NaCl' },
        { label: 'Balance', work: 'Na: 2 on the left → 2 NaCl' },
      ],
      answer: `${f('BaCl2')} + ${f('Na2SO4')} → ${f('BaSO4')} + 2 ${f('NaCl')}`,
    },
    {
      title: 'Balance a combustion reaction',
      problem: `Balance: ${f('C3H8')} + ${f('O2')} → ${f('CO2')} + ${f('H2O')}`,
      steps: [
        { label: 'C', work: '3 C → 3 CO_{2}' },
        { label: 'H', work: '8 H → 4 H_{2}O' },
        { label: 'O last', work: 'Right side: 3(2) + 4(1) = 10 O → 5 O_{2}' },
      ],
      answer: `${f('C3H8')} + 5 ${f('O2')} → 3 ${f('CO2')} + 4 ${f('H2O')}`,
    },
  ],
  stepGuide: [
    'Classify: A + B → AB, AB → A + B, A + BC → AC + B, AB + CD → AD + CB, or fuel + O_{2}.',
    'Predict products using ion charges; write lone H, N, O, F, Cl, Br, I as diatomic.',
    'Balance with coefficients only: metals/C first, then H, then O.',
    'Check every element, and reduce to the lowest whole numbers.',
  ],
  practice: [
    { id: 'classify', skill: 'classifying reactions', generate: classifyOnly },
    { id: 'balance', skill: 'balancing equations', generate: balanceOnly },
    { id: 'formation', skill: 'predicting formation products', generate: predictFormation },
    { id: 'combustion', skill: 'combustion', generate: predictCombustion },
    { id: 'balance-2', skill: 'balancing equations', generate: balanceOnly },
    { id: 'single', skill: 'single displacement', generate: predictSingle },
    { id: 'double', skill: 'double displacement', generate: predictDouble },
    { id: 'classify-2', skill: 'classifying reactions', generate: classifyOnly },
    { id: 'balance-3', skill: 'balancing equations', generate: balanceOnly },
    { id: 'double-2', skill: 'double displacement', generate: predictDouble },
    { id: 'combustion-2', skill: 'combustion', generate: predictCombustion },
    { id: 'balance-4', skill: 'balancing equations', generate: balanceOnly },
  ],
  videos: [],
};
