import type { Topic } from '../types';
import { TOPIC_META } from '../curriculum';
import { f } from '../substances';
import { classify, mcTemplate, type MCItem } from '../quiz';

const TYPES = ['acid', 'base', 'salt'];
const typeHints: [string, string, string] = [
  'Look at the start and end of the formula.',
  'Acids start with H (in water, aq). Bases are usually a metal with OH (hydroxide).',
  'A salt is a metal (or ammonium) ion with a non-metal or polyatomic ion, with no H^{+} or OH^{−}.',
];

const classifyBank: MCItem[] = [
  ['HCl(aq)', 'acid', 'HCl(aq) releases H^{+} in water: hydrochloric acid.'],
  ['HNO3(aq)', 'acid', 'Nitric acid releases H^{+} in water.'],
  ['H2SO4(aq)', 'acid', 'Sulfuric acid releases H^{+} in water.'],
  ['H3PO4(aq)', 'acid', 'Phosphoric acid releases H^{+} in water.'],
  ['CH3COOH(aq)', 'acid', 'The H at the end of –COOH is released as H^{+}: this is acetic (ethanoic) acid, found in vinegar.'],
  ['NaOH(aq)', 'base', 'Sodium hydroxide releases OH^{−}.'],
  ['KOH(aq)', 'base', 'Potassium hydroxide releases OH^{−}.'],
  ['Ca(OH)2(aq)', 'base', 'Calcium hydroxide releases OH^{−}.'],
  ['Mg(OH)2', 'base', 'Magnesium hydroxide (milk of magnesia) is a base.'],
  ['NaCl', 'salt', 'Sodium chloride: a metal ion with a non-metal ion.'],
  ['KNO3', 'salt', 'Potassium nitrate: a metal ion with a polyatomic ion.'],
  ['CaCl2', 'salt', 'Calcium chloride is a salt.'],
  ['Na2SO4', 'salt', 'Sodium sulfate is a salt.'],
  ['NH4Cl', 'salt', 'Ammonium chloride: ammonium acts like a metal ion here, so it’s a salt.'],
].map(([formula, answer, why]) => {
  const [core, state] = formula.split(/(\(aq\))$/);
  return classify(`Is ${f(core)}${state ?? ''} an acid, a base, or a salt?`, answer, TYPES, typeHints, why);
});

const properties: MCItem[] = [
  {
    q: 'An unknown solution turns **blue litmus red**. What is it?',
    correct: 'an acid',
    wrong: ['a base', 'neutral', 'a salt solution with pH 7'],
    hints: ['Litmus tells acids from bases.', '“Acids turn blue litmus red.”', 'Red = acid.'],
    explain: 'Acids turn blue litmus paper red. Bases turn red litmus blue.',
  },
  {
    q: 'A solution has a pH of 11. It is…',
    correct: 'basic',
    wrong: ['acidic', 'neutral', 'a strong acid'],
    hints: ['The pH scale runs from 0 to 14.', 'pH 7 is neutral.', 'Above 7 is basic; below 7 is acidic.'],
    explain: 'pH above 7 means basic.',
  },
  {
    q: 'Which is a property of **acids**?',
    correct: 'They react with many metals to produce hydrogen gas',
    wrong: ['They feel slippery', 'They taste bitter', 'They have a pH above 7'],
    hints: ['Think of what acid does to magnesium ribbon.', 'Bases are the slippery, bitter ones.', 'Acids: sour, pH < 7, react with metals.'],
    explain: 'Acids taste sour, have pH < 7, turn blue litmus red, and react with many metals to make H_{2} gas.',
  },
  {
    q: 'Which is a property of **bases**?',
    correct: 'They feel slippery',
    wrong: ['They turn blue litmus red', 'They have a pH below 7', 'They taste sour'],
    hints: ['Think of soap.', 'Bases turn red litmus blue.', 'Bases: bitter, slippery, pH > 7.'],
    explain: 'Bases taste bitter, feel slippery, have pH > 7, and turn red litmus blue.',
  },
  {
    q: 'Which property do acids and bases **share**?',
    correct: 'Their solutions conduct electricity',
    wrong: ['They both turn litmus red', 'They both have a pH of 7', 'They both feel slippery'],
    hints: ['Both release ions in water.', 'Ions in water carry electric current.', 'What do ions let a solution do?'],
    explain: 'Both acids and bases release ions in water, so their solutions conduct electricity.',
  },
  {
    q: 'Solution A has pH 2 and solution B has pH 5. Which statement is true?',
    correct: 'A is more acidic than B',
    wrong: ['B is more acidic than A', 'They are equally acidic', 'Both are basic'],
    hints: ['Lower pH = more acidic.', 'Both are below 7, so both are acidic.', 'Which is lower?'],
    explain: 'Lower pH means more acidic. Each pH step is 10×, so pH 2 is 1000× more acidic than pH 5.',
  },
  {
    q: 'Phenolphthalein indicator is colourless in acid. What colour does it turn in a **base**?',
    correct: 'pink',
    wrong: ['yellow', 'blue', 'it stays colourless'],
    hints: ['It changes colour around pH 8–10.', 'Common in titrations.', 'Think bright pink.'],
    explain: 'Phenolphthalein is colourless in acids and neutral solutions and turns **pink** in bases.',
  },
];

const neutralization: MCItem[] = [
  {
    q: `What are the products when ${f('HCl')}(aq) reacts with ${f('NaOH')}(aq)?`,
    correct: `${f('NaCl')} and ${f('H2O')}`,
    wrong: [`${f('NaH')} and ${f('HClO')}`, `${f('Na')} and ${f('HCl')}`, `${f('NaCl')} and ${f('H2')}`],
    hints: ['Acid + base → ?', 'Neutralization makes a salt and water.', 'The salt is the metal from the base with the non-metal from the acid.'],
    explain: 'Acid + base → salt + water: HCl + NaOH → NaCl + H_{2}O.',
  },
  {
    q: `Which salt forms when ${f('H2SO4')}(aq) is neutralized by ${f('KOH')}(aq)?`,
    correct: f('K2SO4'),
    wrong: [f('KSO4'), f('K2S'), f('KOH')],
    hints: ['The salt is K^{+} with the acid’s negative ion.', 'H_{2}SO_{4} gives SO_{4}^{2−}.', 'Balance the charges: 2 K^{+} for one SO_{4}^{2−}.'],
    explain: 'K^{+} + SO_{4}^{2−} → K_{2}SO_{4} (plus water).',
  },
  {
    q: `Which salt forms when ${f('HNO3')}(aq) is neutralized by ${f('Ca(OH)2')}(aq)?`,
    correct: f('Ca(NO3)2'),
    wrong: [f('CaNO3'), f('Ca(OH)2'), f('CaN2')],
    hints: ['The salt is Ca^{2+} with the acid’s negative ion.', 'HNO_{3} gives NO_{3}^{−}.', 'One Ca^{2+} needs two NO_{3}^{−}.'],
    explain: 'Ca^{2+} + 2 NO_{3}^{−} → Ca(NO_{3})_{2} (plus water).',
  },
  {
    q: 'Why do people take an antacid (a base) for heartburn?',
    correct: 'The base neutralizes excess stomach acid',
    wrong: ['The base adds more acid', 'Bases coat the stomach so acid can’t form', 'Antacids are strong acids'],
    hints: ['Heartburn is caused by stomach acid.', 'What happens when an acid meets a base?', 'Neutralization.'],
    explain: 'The base in an antacid neutralizes some stomach acid (HCl), making salt and water.',
  },
  {
    q: 'In a neutralization reaction, which ions combine to form water?',
    correct: 'H^{+} and OH^{−}',
    wrong: ['Na^{+} and Cl^{−}', 'H^{+} and Cl^{−}', 'O^{2−} and H^{+} only'],
    hints: ['Acids provide one ion; bases provide another.', 'Acid → H^{+}; base → OH^{−}.', 'H^{+} + OH^{−} → ?'],
    explain: 'H^{+} (from the acid) + OH^{−} (from the base) → H_{2}O.',
  },
];

export const acidsBasesTopic: Topic = {
  meta: TOPIC_META['b-acids-bases'],
  summary: 'Acids release H⁺, bases release OH⁻, and when they react they neutralize each other to make a salt and water.',
  learn: [
    {
      type: 'table',
      head: ['', 'Acids', 'Bases'],
      rows: [
        ['In water they release', 'H^{+} ions', 'OH^{−} ions'],
        ['pH', 'below 7', 'above 7'],
        ['Litmus', 'blue → red', 'red → blue'],
        ['Other', 'taste sour; react with metals to give H_{2}', 'taste bitter; feel slippery'],
        ['Examples', `${f('HCl')}(aq), vinegar, lemon juice`, `${f('NaOH')}(aq), soap, antacids`],
      ],
    },
    { type: 'tip', text: 'Never taste or touch lab chemicals to test them. Use indicators like litmus or pH paper.' },
    { type: 'h', text: 'The pH scale' },
    {
      type: 'p',
      text: 'pH runs from 0 to 14. 7 is neutral (pure water). Each step is a factor of 10: pH 3 is 10 times more acidic than pH 4.',
    },
    { type: 'h', text: 'Spotting them by formula' },
    {
      type: 'list',
      items: [
        '**Acid:** starts with H and is dissolved in water, e.g. HCl(aq), H_{2}SO_{4}(aq).',
        '**Base:** usually a metal hydroxide, e.g. NaOH, Ca(OH)_{2}.',
        '**Salt:** a metal (or ammonium) ion with a non-metal or polyatomic ion, e.g. NaCl, KNO_{3}.',
      ],
    },
    { type: 'h', text: 'Neutralization' },
    { type: 'equation', text: 'acid + base → salt + water', caption: 'HCl + NaOH → NaCl + H_{2}O' },
    {
      type: 'p',
      text: 'The H^{+} from the acid and OH^{−} from the base join to make water; the leftover ions form the salt.',
    },
  ],
  examples: [
    {
      title: 'Predict the salt',
      problem: `What salt forms when ${f('HBr')}(aq) reacts with ${f('KOH')}(aq)?`,
      steps: [
        { label: 'Water', work: 'H^{+} + OH^{−} → H_{2}O' },
        { label: 'Salt', work: 'K^{+} + Br^{−} → KBr' },
      ],
      answer: `${f('KBr')} (potassium bromide) + water`,
    },
  ],
  stepGuide: [
    'Acid: H first, in water, pH < 7. Base: metal hydroxide, pH > 7. Salt: metal + non-metal/polyatomic.',
    'Acids turn blue litmus red; bases turn red litmus blue.',
    'Acid + base → salt + water. Build the salt from the base’s metal and the acid’s negative ion.',
  ],
  practice: [
    mcTemplate('classify', 'acid, base, or salt?', classifyBank),
    mcTemplate('properties', 'properties and pH', properties),
    mcTemplate('neutralize', 'neutralization', neutralization),
    mcTemplate('classify-2', 'acid, base, or salt?', classifyBank),
    mcTemplate('properties-2', 'properties and pH', properties),
    mcTemplate('neutralize-2', 'neutralization', neutralization),
    mcTemplate('classify-3', 'acid, base, or salt?', classifyBank),
    mcTemplate('properties-3', 'properties and pH', properties),
    mcTemplate('neutralize-3', 'neutralization', neutralization),
    mcTemplate('classify-4', 'acid, base, or salt?', classifyBank),
  ],
  videos: [
    {
      youtubeId: "ja7p_tzTTEA",
      title: "Intro to acids and bases",
      channel: "Khan Academy",
      note: "What makes something an acid or a base.",
    },
    {
      youtubeId: "btjUgNnaFYQ",
      title: "Acids and Bases: pH Scale, Indicators, and Neutralization",
      channel: "Sciesmic",
      note: "pH, indicators, and neutralization in one video.",
    },
  ],
};
