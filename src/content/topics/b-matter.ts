import type { Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f } from '../substances';
import { classify, mcTemplate, type MCItem } from '../quiz';

const KINDS = ['element', 'compound', 'homogeneous mixture (solution)', 'heterogeneous mixture'];
const kindHints: [string, string, string] = [
  'Is it one pure substance, or several things mixed together?',
  'Pure: one kind of atom = element; atoms of different elements chemically joined = compound.',
  'Mixture: looks the same throughout = homogeneous; you can see different parts = heterogeneous.',
];

const matter: MCItem[] = [
  ['gold, Au', 'element', 'Gold is made of only one kind of atom.'],
  ['oxygen gas, [[O2]]', 'element', 'O_{2} has two atoms, but they’re the same element, so it’s still an element.'],
  ['helium in a balloon', 'element', 'Helium is a single element.'],
  ['sulfur, S', 'element', 'Sulfur is a single element.'],
  ['pure water, [[H2O]]', 'compound', 'Water is H and O chemically joined in a fixed ratio.'],
  ['table salt, [[NaCl]]', 'compound', 'Sodium chloride is Na and Cl chemically joined.'],
  ['carbon dioxide, [[CO2]]', 'compound', 'CO_{2} is carbon and oxygen chemically joined.'],
  ['sugar (sucrose)', 'compound', 'Sucrose is C, H, and O chemically joined in a fixed ratio.'],
  ['salt water', 'homogeneous mixture (solution)', 'Salt dissolves evenly. You can’t see separate parts.'],
  ['air', 'homogeneous mixture (solution)', 'Air is a mixture of gases (mostly N_{2} and O_{2}), evenly mixed.'],
  ['brass (copper and zinc alloy)', 'homogeneous mixture (solution)', 'An alloy is a solid solution: evenly mixed metals.'],
  ['vinegar', 'homogeneous mixture (solution)', 'Vinegar is acetic acid dissolved evenly in water.'],
  ['sand and water', 'heterogeneous mixture', 'You can see the sand separate from the water.'],
  ['oil and vinegar salad dressing', 'heterogeneous mixture', 'The oil and vinegar separate into layers.'],
  ['granola', 'heterogeneous mixture', 'You can see the different pieces.'],
  ['soil', 'heterogeneous mixture', 'Soil has visibly different bits: sand, clay, plant matter.'],
  ['iron filings mixed with sulfur powder', 'heterogeneous mixture', 'They’re just mixed, not joined. A magnet could pull the iron out.'],
].map(([name, answer, why]) => classify(`How is ${name} classified?`, answer, KINDS, kindHints, why));

const pureOrMixture: MCItem[] = [
  ['distilled water', 'pure substance'],
  ['copper wire', 'pure substance'],
  ['baking soda, [[NaHCO3]]', 'pure substance'],
  ['orange juice', 'mixture'],
  ['milk', 'mixture'],
  ['ocean water', 'mixture'],
  ['stainless steel', 'mixture'],
  ['diamond (pure carbon)', 'pure substance'],
].map(([name, answer]) =>
  classify(
    `Is ${name} a pure substance or a mixture?`,
    answer,
    ['pure substance', 'mixture'],
    ['A pure substance has a fixed composition.', 'Elements and compounds are pure substances.', 'If the amounts of its parts can vary, it’s a mixture.'],
    answer === 'pure substance' ? `${name} has a fixed composition: it’s a pure substance.` : `${name} is several substances mixed in amounts that can vary: a mixture.`,
  ),
);

const CHANGES = ['physical change', 'chemical change'];
const changeHints: [string, string, string] = [
  'Is a new substance made?',
  'Physical: same substance, new form (state, shape, size, dissolving). Chemical: new substances form.',
  'Signs of a chemical change: gas, colour change, precipitate, heat or light, new smell.',
];
const changes: MCItem[] = [
  ['ice melting', 'physical change', 'It’s still water, just a different state.'],
  ['water boiling', 'physical change', 'Steam is still H_{2}O.'],
  ['sugar dissolving in tea', 'physical change', 'The sugar is still sugar. Evaporate the water and it comes back.'],
  ['cutting paper', 'physical change', 'Smaller pieces of the same paper.'],
  ['crushing a pop can', 'physical change', 'Same aluminum, new shape.'],
  ['dry ice turning to gas', 'physical change', 'Solid CO_{2} to gaseous CO_{2}: a change of state (sublimation).'],
  ['iron rusting', 'chemical change', 'Iron reacts with oxygen and water to make a new substance: rust.'],
  ['wood burning', 'chemical change', 'Burning makes new substances (CO_{2}, water, ash) and releases heat and light.'],
  ['baking a cake', 'chemical change', 'The ingredients react to form new substances. You can’t un-bake it.'],
  ['milk going sour', 'chemical change', 'Bacteria turn lactose into lactic acid: a new substance and a new smell.'],
  ['fireworks exploding', 'chemical change', 'New substances, light, heat, and sound.'],
  ['frying an egg', 'chemical change', 'The proteins change permanently.'],
  ['baking soda fizzing in vinegar', 'chemical change', 'The bubbles are a new gas (CO_{2}).'],
  ['silver tarnishing', 'chemical change', 'Silver reacts with sulfur compounds in the air to form black silver sulfide.'],
].map(([what, answer, why]) => classify(`Is ${what} a physical or chemical change?`, answer, CHANGES, changeHints, why));

const PROPS = ['physical property', 'chemical property'];
const propHints: [string, string, string] = [
  'Can you observe it without changing the substance into something new?',
  'Physical properties: colour, density, melting point, conductivity, solubility, hardness.',
  'Chemical properties describe how a substance reacts: flammability, reactivity with acid, water, or oxygen.',
];
const props: MCItem[] = [
  ['the melting point of copper', 'physical property'],
  ['the density of aluminum', 'physical property'],
  ['sulfur’s yellow colour', 'physical property'],
  ['copper conducting electricity', 'physical property'],
  ['salt dissolving in water', 'physical property'],
  ['gold being malleable', 'physical property'],
  ['gasoline being flammable', 'chemical property'],
  ['magnesium reacting with acid', 'chemical property'],
  ['sodium reacting violently with water', 'chemical property'],
  ['iron’s tendency to rust', 'chemical property'],
  ['helium not reacting with anything', 'chemical property'],
].map(([what, answer]) =>
  classify(
    `Is ${what} a physical or chemical property?`,
    answer,
    PROPS,
    propHints,
    answer === 'physical property' ? 'You can observe this without making a new substance: a physical property.' : 'This describes how the substance reacts: a chemical property.',
  ),
);

const evidence: MCItem[] = [
  {
    q: 'Which observation is the best evidence of a **chemical** change?',
    correct: 'Bubbles of gas form when two liquids are mixed',
    wrong: ['An ice cube melts in your hand', 'Water boils at 100 °C', 'Salt disappears when stirred into water'],
    hints: changeHints,
    explain: 'A new gas forming when substances mix means a new substance was made.',
  },
  {
    q: 'Two clear solutions are mixed and a cloudy yellow solid appears. What is the solid called?',
    correct: 'a precipitate',
    wrong: ['a solvent', 'a solute', 'an alloy'],
    hints: ['It’s a solid that forms from two solutions.', 'It’s evidence of a chemical change.', 'You’ll use this word a lot in Unit 1 (Solutions).'],
    explain: 'A solid that forms when solutions mix is a **precipitate**: evidence of a chemical reaction.',
  },
  {
    q: 'Which is **not** usually evidence of a chemical change?',
    correct: 'A change of state',
    wrong: ['A colour change', 'Heat or light is given off', 'A new smell'],
    hints: changeHints,
    explain: 'Changing state (melting, boiling) is a physical change. The substance stays the same.',
  },
  {
    q: 'What is the difference between an element and a compound?',
    correct: 'A compound is two or more elements chemically joined in a fixed ratio',
    wrong: ['An element is always a gas', 'A compound can be separated by filtering', 'Elements are made of molecules and compounds are not'],
    hints: ['Think about what each is made of.', 'An element has only one kind of atom.', `Water, ${f('H2O')}, is a compound. Hydrogen, ${f('H2')}, is an element.`],
    explain: 'An element has one kind of atom. A compound has two or more elements **chemically joined** in a fixed ratio, and it can only be separated by a chemical reaction.',
  },
];

export const matterTopic: Topic = {
  meta: TOPIC_META['b-matter'],
  summary: 'Everything is matter. Sort it into elements, compounds, and mixtures, and tell physical changes from chemical ones.',
  learn: [
    { type: 'p', text: 'Matter is anything that has mass and takes up space. Chemists sort it like this:' },
    {
      type: 'table',
      head: ['Type', 'What it is', 'Examples'],
      rows: [
        ['**Element**', 'Pure substance with one kind of atom', `gold, ${f('O2')}, helium`],
        ['**Compound**', 'Pure substance: two or more elements chemically joined in a fixed ratio', `${f('H2O')}, ${f('NaCl')}, ${f('CO2')}`],
        ['**Homogeneous mixture** (solution)', 'Evenly mixed; looks like one substance', 'salt water, air, brass'],
        ['**Heterogeneous mixture**', 'You can see the different parts', 'sand and water, granola, soil'],
      ],
    },
    { type: 'tip', text: 'Elements and compounds are **pure substances**: fixed composition. Mixtures can have any proportions.' },
    { type: 'h', text: 'Physical vs chemical changes' },
    {
      type: 'list',
      items: [
        '**Physical change:** the substance stays the same, only its form changes (melting, boiling, dissolving, cutting).',
        '**Chemical change:** new substances form (burning, rusting, cooking, souring).',
      ],
    },
    {
      type: 'key',
      title: 'Evidence of a chemical change',
      text: 'Gas produced (bubbles) · colour change · a precipitate forms · heat or light given off · a new smell',
    },
    { type: 'h', text: 'Physical vs chemical properties' },
    {
      type: 'p',
      text: '**Physical properties** can be observed without making anything new: colour, density, melting point, conductivity, solubility. **Chemical properties** describe how a substance reacts: flammability, reacting with acid, water, or oxygen.',
    },
  ],
  examples: [
    {
      title: 'Classify matter',
      problem: 'Is carbonated water (pop without flavour) an element, compound, or mixture?',
      steps: [
        { label: 'Pure or mixed?', work: 'It’s water with CO_{2} dissolved in it: more than one substance → mixture' },
        { label: 'Even or not?', work: 'It looks the same throughout → homogeneous' },
      ],
      answer: 'A homogeneous mixture (a solution)',
    },
    {
      title: 'Physical or chemical change?',
      problem: 'A piece of magnesium burns with a bright white light and leaves a white powder.',
      steps: [
        { label: 'New substance?', work: 'The shiny metal becomes white powder (magnesium oxide)' },
        { label: 'Evidence', work: 'Light and heat given off, new substance formed' },
      ],
      answer: 'Chemical change',
    },
  ],
  stepGuide: [
    'Pure substance or mixture? Pure = fixed composition.',
    'Pure: one kind of atom → element; elements chemically joined → compound.',
    'Mixture: looks uniform → homogeneous (solution); visible parts → heterogeneous.',
    'Change: new substance formed → chemical; same substance, new form → physical.',
  ],
  practice: [
    mcTemplate('classify', 'classifying matter', matter),
    mcTemplate('pure', 'pure substance or mixture', pureOrMixture),
    mcTemplate('change', 'physical or chemical change', changes),
    mcTemplate('classify-2', 'classifying matter', matter),
    mcTemplate('property', 'physical or chemical property', props),
    mcTemplate('evidence', 'evidence of chemical change', evidence),
    mcTemplate('change-2', 'physical or chemical change', changes),
    mcTemplate('classify-3', 'classifying matter', matter),
    mcTemplate('property-2', 'physical or chemical property', props),
    mcTemplate('change-3', 'physical or chemical change', changes),
  ],
  videos: [
    {
      youtubeId: "n5cZ5CWuUJA",
      title: "Physical and chemical changes",
      channel: "Khan Academy",
      note: "How to tell a physical change from a chemical one.",
    },
    {
      youtubeId: "YP7Hn_6Wu5g",
      title: "Mixtures",
      channel: "Khan Academy",
      note: "Pure substances vs mixtures, with everyday examples.",
    },
  ],
};
