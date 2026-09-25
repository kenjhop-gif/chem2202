import type { Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { classify, mcTemplate, type MCItem } from '../quiz';

const FACTORS = ['temperature', 'concentration', 'surface area', 'a catalyst', 'light'];
const factorHints: [string, string, string] = [
  'What was changed in the situation?',
  'The factors: temperature, concentration, surface area, catalysts, and (for some reactions) light.',
  'Hotter, more crowded, more exposed, or helped along?',
];

const scenarios: MCItem[] = [
  ['Milk stays fresh longer in the refrigerator.', 'temperature', 'Colder = particles move slower = fewer, weaker collisions, so spoiling reactions slow down.'],
  ['Food cooks faster in a pressure cooker, which is hotter than boiling water.', 'temperature', 'Higher temperature speeds up the reactions of cooking.'],
  ['A glow stick shines brighter in hot water than in ice water.', 'temperature', 'Higher temperature speeds up the light-producing reaction.'],
  ['Powdered sugar can burn explosively, but a sugar cube just smoulders.', 'surface area', 'Powder has far more surface exposed, so many more collisions happen at once.'],
  ['Small pieces of kindling catch fire faster than a big log.', 'surface area', 'Smaller pieces expose more surface to oxygen.'],
  ['Chewing food helps you digest it faster.', 'surface area', 'Chewing breaks food into smaller pieces with more surface for enzymes to work on.'],
  ['Magnesium fizzes faster in 2.0 mol/L acid than in 0.5 mol/L acid.', 'concentration', 'More acid particles in the same space = more collisions.'],
  ['A fire burns more fiercely when you blow air (oxygen) onto it.', 'concentration', 'More oxygen available = more collisions with the fuel.'],
  ['Enzymes in your saliva break down starch quickly at body temperature.', 'a catalyst', 'Enzymes are biological catalysts: they speed up reactions without being used up.'],
  ['A car’s catalytic converter turns harmful exhaust gases into safer ones.', 'a catalyst', 'The metals in the converter act as a catalyst.'],
  ['Adding manganese dioxide makes hydrogen peroxide break down much faster, and the MnO_{2} is still there afterward.', 'a catalyst', 'It speeds up the reaction and isn’t used up: a catalyst.'],
  ['Hydrogen peroxide is sold in brown bottles.', 'light', 'Light speeds up the breakdown of H_{2}O_{2}; the brown bottle blocks it.'],
  ['Photographic film changes when exposed to light.', 'light', 'Light triggers the chemical change in the film.'],
].map(([what, answer, why]) =>
  classify(`${what} Which factor affects the rate?`, answer, FACTORS, factorHints, why),
);

const theory: MCItem[] = [
  {
    q: 'According to collision theory, what must happen for particles to react?',
    correct: 'They must collide with enough energy and the right orientation',
    wrong: ['They must be the same size', 'They must be in the solid state', 'They must be heated to boiling'],
    hints: ['Particles have to meet.', 'Not every collision works.', 'Energy and the right angle.'],
    explain: 'Particles must collide, with enough energy (activation energy) and the right orientation.',
  },
  {
    q: 'Why does raising the temperature speed up a reaction?',
    correct: 'Particles move faster, so they collide more often and with more energy',
    wrong: ['Heat adds more particles', 'It makes the particles bigger', 'Heat is a catalyst'],
    hints: ['Temperature measures particle motion.', 'Faster particles collide more.', 'And the collisions are harder.'],
    explain: 'Faster particles collide more often **and** more of the collisions have enough energy to react.',
  },
  {
    q: 'What does a catalyst do?',
    correct: 'Speeds up a reaction without being used up',
    wrong: ['Is used up as the reaction goes', 'Slows a reaction down', 'Changes what the products are'],
    hints: ['Enzymes are catalysts.', 'You get the catalyst back at the end.', 'It lowers the energy needed to react.'],
    explain: 'A catalyst lowers the energy needed to react, speeding it up, and is not consumed.',
  },
  {
    q: 'Why does increasing surface area speed up a reaction?',
    correct: 'More particles are exposed and can collide',
    wrong: ['The particles get more energy', 'The substance becomes a catalyst', 'The temperature rises'],
    hints: ['Only particles on the surface can react.', 'Cutting something up exposes more surface.', 'More exposed particles → more collisions.'],
    explain: 'Only surface particles can collide with the other reactant; more surface means more collisions.',
  },
];

export const reactionRatesTopic: Topic = {
  meta: TOPIC_META['b-reaction-rates'],
  summary: 'Reactions happen when particles collide. Anything that makes collisions more frequent or more energetic speeds them up.',
  learn: [
    {
      type: 'key',
      title: 'Collision theory',
      text: 'Particles react only when they **collide** with enough energy and the right orientation. More effective collisions = a faster reaction.',
    },
    {
      type: 'table',
      head: ['Factor', 'Effect', 'Why'],
      rows: [
        ['Higher **temperature**', 'faster', 'particles move faster → more frequent, more energetic collisions'],
        ['Higher **concentration**', 'faster', 'more particles in the same space → more collisions'],
        ['More **surface area**', 'faster', 'more particles exposed → more collisions'],
        ['A **catalyst**', 'faster', 'lowers the energy needed; not used up'],
        ['**Light** (some reactions)', 'faster', 'provides energy to start the reaction'],
      ],
    },
    { type: 'tip', text: 'Everyday check: refrigerators slow spoiling (temperature), chewing speeds digestion (surface area), enzymes are catalysts.' },
  ],
  examples: [
    {
      title: 'Explain a rate change',
      problem: 'Why does steel wool burn in pure oxygen but a steel beam doesn’t?',
      steps: [
        { label: 'Surface area', work: 'Thin strands expose far more iron to oxygen' },
        { label: 'Concentration', work: 'Pure oxygen is much more concentrated than air' },
      ],
      answer: 'More surface area and higher O_{2} concentration → many more collisions',
    },
  ],
  stepGuide: [
    'Identify what changed: temperature, concentration, surface area, catalyst, or light.',
    'Explain with collision theory: more collisions, or more energetic ones.',
  ],
  practice: [
    mcTemplate('factor', 'identifying the factor', scenarios),
    mcTemplate('theory', 'collision theory', theory),
    mcTemplate('factor-2', 'identifying the factor', scenarios),
    mcTemplate('theory-2', 'collision theory', theory),
    mcTemplate('factor-3', 'identifying the factor', scenarios),
    mcTemplate('factor-4', 'identifying the factor', scenarios),
    mcTemplate('theory-3', 'collision theory', theory),
    mcTemplate('factor-5', 'identifying the factor', scenarios),
  ],
  videos: [
    {
      youtubeId: "n19G4waPE8A",
      title: "Collision Theory and Reaction Rate",
      channel: "Chemfuzzled",
      note: "Temperature, concentration, surface area, and catalysts.",
    },
    {
      youtubeId: "jd6U5nQcqKc",
      title: "Factors Affecting Rate of Reaction + Collision Theory",
      channel: "GetToKnowScience",
      note: "A short recap of each factor.",
    },
  ],
};
