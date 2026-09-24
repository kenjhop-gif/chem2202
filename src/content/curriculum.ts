// The full topic map (see PLAN.md §2). Topics without written content show as "coming soon".
import type { Section, SectionId, TopicMeta } from './types';

export const SECTIONS: Section[] = [
  {
    id: 'basics',
    title: 'Chemistry Basics',
    shortTitle: 'Basics',
    blurb: 'Background from earlier grades and Science 1206. Open anytime you need a refresher.',
  },
  {
    id: 'u1',
    title: 'Unit 1: Stoichiometry',
    shortTitle: 'Stoichiometry',
    blurb: 'Naming, the mole, solutions, and calculating amounts in reactions.',
  },
  {
    id: 'u2',
    title: 'Unit 2: From Structures to Properties',
    shortTitle: 'Bonding',
    blurb: 'How bonds and intermolecular forces explain the properties of substances.',
  },
  {
    id: 'u3',
    title: 'Unit 3: Organic Chemistry',
    shortTitle: 'Organic',
    blurb: 'Carbon compounds: naming, structures, reactions, and polymers.',
  },
];

type Row = [id: string, number: string, title: string, group?: string];

const MAP: Record<SectionId, Row[]> = {
  basics: [
    ['b-matter', 'B1', 'Matter: elements, compounds, and mixtures'],
    ['b-atoms', 'B2', 'Atomic structure and isotopes'],
    ['b-periodic-table', 'B3', 'The periodic table'],
    ['b-bohr-ions', 'B4', 'Bohr diagrams, valence electrons, and ions'],
    ['b-measurement', 'B5', 'Measurement skills: sig figs, scientific notation, conversions'],
    ['b-acids-bases', 'B6', 'Acids, bases, and salts'],
    ['b-reaction-rates', 'B7', 'What affects reaction rate'],
    ['b-lab-safety', 'B8', 'Lab safety and WHMIS'],
  ],
  u1: [
    ['u1-naming-ionic', '1', 'Naming ionic compounds', 'Naming'],
    ['u1-naming-molecular', '2', 'Naming molecular compounds and acids', 'Naming'],
    ['u1-mole', '3', 'The mole and Avogadro’s number', 'The mole'],
    ['u1-molar-mass', '4', 'Molar mass', 'The mole'],
    ['u1-mole-conversions', '5', 'Mole conversions: mass, particles, and gas volume', 'The mole'],
    ['u1-percent-composition', '6', 'Percent composition', 'The mole'],
    ['u1-empirical-molecular', '7', 'Empirical and molecular formulas', 'The mole'],
    ['u1-reactions', '8', 'Reaction types, predicting products, and balancing', 'Reactions'],
    ['u1-concentration', '9', 'Concentration and dilution', 'Solutions'],
    ['u1-dissociation', '10', 'Dissociation and ion concentration', 'Solutions'],
    ['u1-solubility-equilibrium', '11', 'Solubility and equilibrium', 'Solutions'],
    ['u1-precipitates', '12', 'Predicting precipitates', 'Solutions'],
    ['u1-net-ionic', '13', 'Non-ionic, total ionic, and net ionic equations', 'Solutions'],
    ['u1-mole-ratios', '14', 'Mole ratios and mole-to-mole', 'Stoichiometry'],
    ['u1-stoichiometry', '15', 'Mass, solution, and gas stoichiometry', 'Stoichiometry'],
    ['u1-limiting', '16', 'Limiting and excess reagents', 'Stoichiometry'],
    ['u1-percent-yield', '17', 'Percent yield and maximizing yield', 'Stoichiometry'],
    ['u1-stse', '18', 'Stoichiometry in the real world', 'Stoichiometry'],
  ],
  u2: [
    ['u2-covalent', '1', 'Covalent bonding', 'Covalent and molecular'],
    ['u2-lewis', '2', 'Lewis structures', 'Covalent and molecular'],
    ['u2-vsepr', '3', 'Molecular shapes (VSEPR)', 'Covalent and molecular'],
    ['u2-electronegativity', '4', 'Electronegativity and bond polarity', 'Covalent and molecular'],
    ['u2-molecular-polarity', '5', 'Molecular polarity', 'Covalent and molecular'],
    ['u2-imf', '6', 'Intermolecular forces', 'Covalent and molecular'],
    ['u2-molecular-properties', '7', 'Properties of molecular substances', 'Covalent and molecular'],
    ['u2-ionic-bonding', '8', 'Ionic bonding', 'Ionic'],
    ['u2-ionic-properties', '9', 'Ionic lattices and properties', 'Ionic'],
    ['u2-metallic', '10', 'Metallic bonding', 'Metallic'],
    ['u2-classifying', '11', 'Classifying ionic, molecular, and metallic substances', 'Putting it together'],
    ['u2-dissolving', '12', 'Dissolving at the particle level', 'Putting it together'],
    ['u2-molar-solubility', '13', 'Molar solubility', 'Putting it together'],
    ['u2-melting-point', '14', 'How solutes lower the melting point of ice', 'Putting it together'],
    ['u2-stse', '15', 'Bonding in the real world', 'Putting it together'],
  ],
  u3: [
    ['u3-carbon', '1', 'What makes carbon special', 'Hydrocarbons'],
    ['u3-drawing', '2', 'Drawing organic molecules', 'Hydrocarbons'],
    ['u3-alkanes', '3', 'Alkanes', 'Hydrocarbons'],
    ['u3-branched', '4', 'Branched alkanes', 'Hydrocarbons'],
    ['u3-alkenes-alkynes', '5', 'Alkenes and alkynes', 'Hydrocarbons'],
    ['u3-cyclic', '6', 'Cyclic hydrocarbons', 'Hydrocarbons'],
    ['u3-aromatic', '7', 'Aromatic hydrocarbons', 'Hydrocarbons'],
    ['u3-isomers', '8', 'Structural isomers', 'Hydrocarbons'],
    ['u3-functional-groups', '9', 'Functional groups', 'Hydrocarbon derivatives'],
    ['u3-haloalkanes', '10', 'Haloalkanes', 'Hydrocarbon derivatives'],
    ['u3-alcohols', '11', 'Alcohols', 'Hydrocarbon derivatives'],
    ['u3-ethers', '12', 'Ethers', 'Hydrocarbon derivatives'],
    ['u3-aldehydes-ketones', '13', 'Aldehydes and ketones', 'Hydrocarbon derivatives'],
    ['u3-carboxylic-acids', '14', 'Carboxylic acids', 'Hydrocarbon derivatives'],
    ['u3-esters', '15', 'Esters', 'Hydrocarbon derivatives'],
    ['u3-amines-amides', '16', 'Amines and amides', 'Hydrocarbon derivatives'],
    ['u3-reactions', '17', 'Organic reactions', 'Reactions and applications'],
    ['u3-polymers', '18', 'Polymers', 'Reactions and applications'],
    ['u3-stse', '19', 'Organic chemistry in everyday life', 'Reactions and applications'],
  ],
};

export const TOPICS: TopicMeta[] = SECTIONS.flatMap((s) =>
  MAP[s.id].map(([id, number, title, group]) => ({ id, section: s.id, number, title, group })),
);

export const TOPIC_META: Record<string, TopicMeta> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export function sectionOf(id: SectionId): Section {
  return SECTIONS.find((s) => s.id === id)!;
}
