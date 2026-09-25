import type { Question, Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f, given, measured, sf } from '../substances';
import { mcTemplate, type MCItem } from '../quiz';
import { REACTIONS, coefOf, eq, massToMolesSteps, molesToMassStep, molesToVolumeStep, ratioStep, type Rx } from '../stoich';
import type { Rng } from '../../engine/rng';

const find = (text: string) => REACTIONS.find((r) => r.context.includes(text))!;

interface App {
  rx: Rx;
  from: string;
  to: string;
  story: (m: string) => string;
  range: [number, number];
  out: 'mass' | 'volume';
}

const APPS: App[] = [
  { rx: find('airbag'), from: 'NaN3', to: 'N2', range: [40, 130], out: 'volume', story: (m) => `A car airbag contains ${m} g of sodium azide, ${f('NaN3')}. In a crash it decomposes: ${eq(find('airbag'))}. What volume of nitrogen gas (at STP) inflates the bag?` },
  { rx: find('Octane'), from: 'C8H18', to: 'CO2', range: [500, 3000], out: 'mass', story: (m) => `A car burns ${m} g of octane on a short trip: ${eq(find('Octane'))}. What mass of carbon dioxide is released?` },
  { rx: find('antacid'), from: 'CaCO3', to: 'HCl', range: [0.5, 1.5], out: 'mass', story: (m) => `An antacid tablet contains ${m} g of calcium carbonate: ${eq(find('antacid'))}. What mass of stomach acid (HCl) can it neutralize?` },
  { rx: find('Haber'), from: 'H2', to: 'NH3', range: [100, 900], out: 'mass', story: (m) => `A fertilizer plant reacts ${m} g of hydrogen: ${eq(find('Haber'))}. What mass of ammonia can it make?` },
  { rx: find('blast furnace'), from: 'Fe2O3', to: 'Fe', range: [200, 900], out: 'mass', story: (m) => `A blast furnace processes ${m} g of iron ore, ${f('Fe2O3')}: ${eq(find('blast furnace'))}. What mass of iron is produced?` },
  { rx: find('respiration'), from: 'C6H12O6', to: 'CO2', range: [10, 60], out: 'volume', story: (m) => `Your body “burns” ${m} g of glucose: ${eq(find('respiration'))}. What volume of CO_{2} (at STP) do you breathe out from it?` },
  { rx: find('Limestone'), from: 'CaCO3', to: 'CO2', range: [100, 900], out: 'mass', story: (m) => `A cement kiln heats ${m} g of limestone: ${eq(find('Limestone'))}. What mass of CO_{2} does this release, adding to greenhouse gases?` },
];

function applied(rng: Rng): Question {
  const a = rng.pick(APPS);
  const m = measured(rng, a.range[0], a.range[1], 3);
  const { steps, n } = massToMolesSteps(a.from, m);
  const nTo = (n * coefOf(a.rx, a.to)) / coefOf(a.rx, a.from);
  return {
    prompt: a.story(given(m, 3)),
    steps: [...steps, ratioStep(a.rx, a.from, a.to, n, sf(n, 4)), a.out === 'volume' ? molesToVolumeStep(a.to, nTo) : molesToMassStep(a.to, nTo)],
  };
}

const stse: MCItem[] = [
  {
    q: 'Why do airbag designers need precise stoichiometry?',
    correct: 'Too little gas won’t protect you; too much could make the bag burst or injure you',
    wrong: ['Stoichiometry only matters in school labs', 'Airbags use a physical change, not a reaction', 'Any amount of chemical will work'],
    hints: ['The bag has a fixed size.', 'Gas volume depends on the mass of reactant.', 'Safety depends on getting it right.'],
    explain: 'Engineers calculate exactly how much NaN_{3} gives the right volume of N_{2}. That’s stoichiometry saving lives.',
  },
  {
    q: 'Which career uses stoichiometry to calculate safe medication doses?',
    correct: 'Pharmacist',
    wrong: ['Graphic designer', 'Travel agent', 'Journalist'],
    hints: ['Think about who prepares medicines.', 'Doses depend on the amount of active ingredient.', 'Works in a drugstore or hospital.'],
    explain: 'Pharmacists (and pharmacologists and chemical engineers) rely on accurate mole and mass calculations.',
  },
  {
    q: 'The Haber process makes ammonia for fertilizer. Which is a **trade-off** of this technology?',
    correct: 'It helps feed billions of people but uses lots of energy and fertilizer runoff can harm waterways',
    wrong: ['It has no environmental effects', 'It only produces waste', 'It stopped being used decades ago'],
    hints: ['Think of benefits and costs.', 'More food vs energy use and pollution.', 'Technologies usually have both.'],
    explain: 'Fertilizer from the Haber process greatly increased food production, but it’s energy-intensive and excess fertilizer can pollute lakes and rivers.',
  },
  {
    q: 'How does stoichiometry help reduce waste in industry?',
    correct: 'Calculating exact amounts avoids buying and disposing of excess chemicals',
    wrong: ['It makes reactions go faster', 'It changes the products formed', 'It removes the need for safety equipment'],
    hints: ['Excess reactant is often wasted.', 'Knowing exact amounts saves money.', 'Less waste to dispose of.'],
    explain: 'Precise amounts mean less wasted reactant, lower cost, and less chemical waste.',
  },
  {
    q: 'Burning fossil fuels produces CO_{2}. How can stoichiometry help society?',
    correct: 'It lets us calculate how much CO_{2} a given amount of fuel releases',
    wrong: ['It stops CO_{2} from forming', 'It turns CO_{2} into oxygen', 'It isn’t related to emissions'],
    hints: ['Fuel + O_{2} → CO_{2} + H_{2}O.', 'Mass of fuel → mass of CO_{2}.', 'Used for carbon footprints.'],
    explain: 'Emission estimates (like a car’s carbon footprint) come straight from combustion stoichiometry.',
  },
  {
    q: 'What’s the difference between a scientific question and a technological problem?',
    correct: 'Science asks why or how nature works; technology solves a practical problem',
    wrong: ['There is no difference', 'Technology only uses computers', 'Science is only done in labs, technology only in factories'],
    hints: ['“Why does X happen?” vs “How can we make X?”', 'One seeks understanding, the other a solution.', 'Airbag design is which?'],
    explain: '“How much gas does NaN_{3} release?” is science; “Design an airbag that inflates in 30 ms” is a technological problem.',
  },
];

export const stoichSTSETopic: Topic = {
  meta: TOPIC_META['u1-stse'],
  summary: 'Stoichiometry keeps airbags safe, feeds the world, and measures pollution. Chemistry calculations have real consequences.',
  learn: [
    { type: 'p', text: 'The same calculations you’ve practised are used every day in industry, medicine, and environmental science:' },
    {
      type: 'table',
      head: ['Application', 'The stoichiometry'],
      rows: [
        ['**Airbags**', `2 ${f('NaN3')} → 2 ${f('Na')} + 3 ${f('N2')}: mass of azide → volume of gas to fill the bag`],
        ['**Fertilizer (Haber process)**', `${f('N2')} + 3 ${f('H2')} → 2 ${f('NH3')}: how much ammonia a plant can make`],
        ['**Steel making**', `${f('Fe2O3')} + 3 ${f('CO')} → 2 ${f('Fe')} + 3 ${f('CO2')}: iron from iron ore`],
        ['**Antacids**', `${f('CaCO3')} + 2 ${f('HCl')} → …: how much stomach acid a tablet neutralizes`],
        ['**Emissions**', 'fuel burned → mass of CO_{2} released (carbon footprints)'],
      ],
    },
    { type: 'h', text: 'Science, technology, and society' },
    {
      type: 'list',
      items: [
        'Technologies involve **trade-offs**: benefits (food, safety, materials) against costs (energy, pollution, safety risks).',
        'Society influences which technologies get funded and how they’re regulated.',
        'Careers that use stoichiometry: chemical engineer, pharmacist, lab technician, environmental scientist, food scientist.',
      ],
    },
  ],
  examples: [
    {
      title: 'Airbag',
      problem: `How many litres of N_{2} (at STP) come from 65.0 g of ${f('NaN3')}? 2 NaN_{3} → 2 Na + 3 N_{2}`,
      steps: [
        { label: 'Moles', work: '65.0 g ÷ 65.02 g/mol = 0.9997 mol NaN_{3}' },
        { label: 'Ratio', work: '0.9997 × 3/2 = 1.4995 mol N_{2}' },
        { label: 'Volume', work: '1.4995 × 22.7 L/mol = 34.0 L' },
      ],
      answer: '34.0 L of N_{2}',
    },
  ],
  stepGuide: ['Pick out the balanced equation and the quantity given.', 'Follow the stoichiometry path: to moles → ratio → to what’s asked.', 'Think about the bigger picture: benefits, costs, and who is affected.'],
  practice: [
    { id: 'applied', skill: 'real-world stoichiometry', generate: applied },
    mcTemplate('stse', 'science, technology, society', stse),
    { id: 'applied-2', skill: 'real-world stoichiometry', generate: applied },
    mcTemplate('stse-2', 'science, technology, society', stse),
    { id: 'applied-3', skill: 'real-world stoichiometry', generate: applied },
    mcTemplate('stse-3', 'science, technology, society', stse),
    { id: 'applied-4', skill: 'real-world stoichiometry', generate: applied },
    mcTemplate('stse-4', 'science, technology, society', stse),
  ],
  videos: [
    {
      youtubeId: "NWhZ77Qm5y4",
      title: "What Is The Haber Process",
      channel: "FuseSchool",
      note: "How ammonia for fertilizer is made on a huge scale.",
    },
    {
      youtubeId: "Mf1CNpWv7Q8",
      title: "Chemistry Segment: Airbags",
      channel: "BJU Press Homeschool",
      note: "The chemistry inside a car airbag.",
    },
  ],
};
