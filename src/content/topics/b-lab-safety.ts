import type { Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { mcTemplate, type MCItem } from '../quiz';

// WHMIS 2015 (GHS) pictograms, described in words.
const PICTOS: [string, string, string][] = [
  ['a flame', 'flammable', 'Catches fire easily (e.g. ethanol, acetone).'],
  ['a flame over a circle', 'oxidizer', 'Makes other materials burn more intensely (e.g. hydrogen peroxide, nitrates).'],
  ['a gas cylinder', 'gas under pressure', 'Compressed or liquefied gas that could explode if heated (e.g. propane tanks).'],
  ['a corroded hand and surface', 'corrosive', 'Destroys skin and metal on contact (e.g. strong acids and bases).'],
  ['a skull and crossbones', 'acutely toxic', 'Can cause death or serious poisoning, even in small amounts.'],
  ['an exploding bomb', 'explosive', 'Can explode or react violently.'],
  ['a person with a star-shaped burst on the chest', 'serious long-term health hazard', 'Can cause cancer, organ damage, or breathing problems over time.'],
  ['an exclamation mark', 'irritant / less serious health hazard', 'Can irritate skin, eyes, or airways.'],
];

const pictograms: MCItem[] = PICTOS.map(([symbol, meaning, why]) => ({
  q: `A WHMIS pictogram shows **${symbol}** inside a red diamond. What hazard does it warn about?`,
  correct: meaning,
  wrong: PICTOS.filter(([, m]) => m !== meaning)
    .map(([, m]) => m)
    .slice(0, 3),
  hints: ['WHMIS pictograms are red diamonds with a black symbol.', 'The symbol usually shows the hazard directly.', 'Think about what the picture would do to you.'],
  explain: `${symbol[0].toUpperCase() + symbol.slice(1)} = **${meaning}**. ${why}`,
}));

const practices: MCItem[] = [
  {
    q: 'You need to dilute a concentrated acid. What is the safe method?',
    correct: 'Add the acid slowly to the water',
    wrong: ['Add the water quickly to the acid', 'Mix them in any order', 'Heat the acid first'],
    hints: ['Mixing acid and water releases a lot of heat.', 'Which way keeps a splash least dangerous?', '“Do as you oughta, add acid to water.”'],
    explain: 'Always add **acid to water**, slowly. Adding water to acid can boil and splatter concentrated acid.',
  },
  {
    q: 'How should you safely smell a chemical in the lab?',
    correct: 'Waft the vapour toward your nose with your hand',
    wrong: ['Put your nose right over the container', 'Taste a tiny amount instead', 'Never check smells in any way'],
    hints: ['You don’t want a full breath of it.', 'Keep your face back.', 'Move a little air toward you.'],
    explain: 'Hold the container away from your face and **waft** a small amount of vapour toward you.',
  },
  {
    q: 'You spill a chemical on your skin. What should you do first?',
    correct: 'Rinse with lots of cool running water and tell your teacher',
    wrong: ['Wipe it off and keep working', 'Wait to see if it hurts', 'Neutralize it with another chemical'],
    hints: ['Speed matters.', 'Dilute and remove it.', 'Then get help.'],
    explain: 'Flush the area with plenty of water right away (at least 15 minutes for corrosives) and tell your teacher.',
  },
  {
    q: 'Where can you find detailed hazard, handling, and first-aid information for a chemical?',
    correct: 'Its Safety Data Sheet (SDS)',
    wrong: ['The periodic table', 'The product’s price tag', 'Any label from a different chemical'],
    hints: ['WHMIS requires two things: labels and…', 'It’s a detailed document for each product.', 'Its initials are S-D-S.'],
    explain: 'Every WHMIS-controlled product has a **Safety Data Sheet** with hazards, safe handling, storage, and first aid.',
  },
  {
    q: 'Which is the correct way to dress for a lab with chemicals?',
    correct: 'Safety goggles on, long hair tied back, closed-toe shoes',
    wrong: ['Goggles on your forehead until you need them', 'Sandals are fine if you’re careful', 'Loose sleeves to stay cool'],
    hints: ['Eyes are the most vulnerable.', 'Anything loose can catch fire or dip into chemicals.', 'Protect your feet from spills and glass.'],
    explain: 'Goggles over your eyes the whole time, hair tied back, no loose clothing, and closed-toe shoes.',
  },
  {
    q: 'A beaker breaks on the lab bench. What should you do?',
    correct: 'Tell your teacher and use a brush and dustpan, not your hands',
    wrong: ['Pick up the pieces with your fingers', 'Put the glass in the regular garbage', 'Ignore it until the end of class'],
    hints: ['Broken glass cuts.', 'There’s a special container for it.', 'Your teacher needs to know.'],
    explain: 'Report it, sweep it up with a brush and dustpan, and put it in the **broken glass** container.',
  },
  {
    q: 'What should you do with leftover chemicals at the end of a lab?',
    correct: 'Dispose of them the way your teacher tells you',
    wrong: ['Pour everything down the sink', 'Put them back in the stock bottle', 'Take them home'],
    hints: ['Never contaminate the stock bottle.', 'Some chemicals can’t go down the drain.', 'Follow the instructions.'],
    explain: 'Follow your teacher’s disposal instructions. Never return chemicals to stock bottles or pour them down the drain unless told to.',
  },
  {
    q: 'Why should you never eat or drink in a chemistry lab?',
    correct: 'Food and drinks can be contaminated by chemicals',
    wrong: ['It’s only a rule to keep the room tidy', 'Food makes reactions go faster', 'It’s fine if you wash your hands first'],
    hints: ['Think about invisible residue on benches.', 'Chemicals can get on your hands and food.', 'Some are toxic in tiny amounts.'],
    explain: 'Chemical residue can get into food or drinks and be swallowed.',
  },
];

export const labSafetyTopic: Topic = {
  meta: TOPIC_META['b-lab-safety'],
  summary: 'Know the WHMIS hazard symbols and the habits that keep everyone safe in the lab.',
  learn: [
    {
      type: 'p',
      text: '**WHMIS** (Workplace Hazardous Materials Information System) is Canada’s system for hazardous products. It has three parts: **labels**, **Safety Data Sheets (SDS)**, and **training**.',
    },
    { type: 'h', text: 'WHMIS pictograms' },
    { type: 'p', text: 'Hazard pictograms are black symbols inside a red-bordered diamond:' },
    { type: 'table', head: ['Symbol', 'Hazard', 'Example'], rows: PICTOS.map(([s, m, w]) => [s, `**${m}**`, w]) },
    { type: 'h', text: 'Everyday lab rules' },
    {
      type: 'list',
      items: [
        'Wear **safety goggles** the whole time. Tie back long hair; wear closed-toe shoes.',
        'Never eat, drink, or taste anything in the lab.',
        '**Waft** to smell; never sniff directly.',
        'Add **acid to water**, never water to acid.',
        'Know where the eyewash, safety shower, fire extinguisher, and fire blanket are.',
        'Report every spill, break, or injury to your teacher, no matter how small.',
        'Dispose of chemicals only as instructed.',
      ],
    },
  ],
  examples: [
    {
      title: 'Reading a label',
      problem: 'A bottle of concentrated hydrochloric acid shows a corrosion pictogram and an exclamation mark. What precautions make sense?',
      steps: [
        { label: 'Corrosive', work: 'Can burn skin and eyes → goggles, gloves; avoid splashes' },
        { label: 'Exclamation mark', work: 'Fumes irritate airways → use in a fume hood or well-ventilated area' },
        { label: 'More detail', work: 'Check the SDS for first aid and storage' },
      ],
      answer: 'Goggles, gloves, ventilation, and check the SDS',
    },
  ],
  stepGuide: [
    'Before a lab: read the procedure and the WHMIS labels; check the SDS if unsure.',
    'Dress for safety: goggles on, hair back, closed shoes.',
    'During: waft, add acid to water, keep food out, report accidents immediately.',
    'After: dispose as instructed, clean up, wash your hands.',
  ],
  practice: [
    mcTemplate('picto', 'WHMIS pictograms', pictograms),
    mcTemplate('practice', 'safe lab practices', practices),
    mcTemplate('picto-2', 'WHMIS pictograms', pictograms),
    mcTemplate('practice-2', 'safe lab practices', practices),
    mcTemplate('picto-3', 'WHMIS pictograms', pictograms),
    mcTemplate('practice-3', 'safe lab practices', practices),
    mcTemplate('picto-4', 'WHMIS pictograms', pictograms),
    mcTemplate('practice-4', 'safe lab practices', practices),
  ],
  videos: [
    {
      youtubeId: "SefU59z5EX4",
      title: "WHMIS 2015 Pictograms and Symbols",
      channel: "OnlineWHMIS.ca",
      note: "What each Canadian WHMIS pictogram means.",
    },
    {
      youtubeId: "NRKFc4DMFH0",
      title: "WHMIS 2015 for Workers",
      channel: "WorkSafeBC",
      note: "Labels, safety data sheets, and staying safe.",
    },
  ],
};
