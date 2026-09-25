// Topics with written content. Anything in the curriculum map but not here shows as "coming soon".
import type { Topic } from './types';
import { matterTopic } from './topics/b-matter';
import { atomsTopic } from './topics/b-atoms';
import { periodicTableTopic } from './topics/b-periodic-table';
import { bohrIonsTopic } from './topics/b-bohr-ions';
import { measurementTopic } from './topics/b-measurement';
import { acidsBasesTopic } from './topics/b-acids-bases';
import { reactionRatesTopic } from './topics/b-reaction-rates';
import { labSafetyTopic } from './topics/b-lab-safety';
import { namingIonicTopic } from './topics/u1-naming-ionic';
import { namingMolecularTopic } from './topics/u1-naming-molecular';
import { reactionsTopic } from './topics/u1-reactions';
import { concentrationTopic } from './topics/u1-concentration';
import { dissociationTopic } from './topics/u1-dissociation';
import { solubilityEquilibriumTopic } from './topics/u1-solubility-equilibrium';
import { precipitatesTopic } from './topics/u1-precipitates';
import { netIonicTopic } from './topics/u1-net-ionic';
import { moleTopic } from './topics/u1-mole';
import { molarMassTopic } from './topics/u1-molar-mass';
import { moleConversionsTopic } from './topics/u1-mole-conversions';
import { percentCompositionTopic } from './topics/u1-percent-composition';
import { empiricalMolecularTopic } from './topics/u1-empirical-molecular';

const TOPICS: Topic[] = [
  matterTopic,
  atomsTopic,
  periodicTableTopic,
  bohrIonsTopic,
  measurementTopic,
  acidsBasesTopic,
  reactionRatesTopic,
  labSafetyTopic,
  namingIonicTopic,
  namingMolecularTopic,
  moleTopic,
  molarMassTopic,
  moleConversionsTopic,
  percentCompositionTopic,
  empiricalMolecularTopic,
  reactionsTopic,
  concentrationTopic,
  dissociationTopic,
  solubilityEquilibriumTopic,
  precipitatesTopic,
  netIonicTopic,
];

export const TOPIC_CONTENT: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.meta.id, t]));

export function isReady(topicId: string): boolean {
  return topicId in TOPIC_CONTENT;
}
