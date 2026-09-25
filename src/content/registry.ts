// Topics with written content. Anything in the curriculum map but not here shows as "coming soon".
import type { Topic } from './types';
import { moleTopic } from './topics/u1-mole';
import { molarMassTopic } from './topics/u1-molar-mass';
import { moleConversionsTopic } from './topics/u1-mole-conversions';
import { percentCompositionTopic } from './topics/u1-percent-composition';
import { empiricalMolecularTopic } from './topics/u1-empirical-molecular';

const TOPICS: Topic[] = [
  moleTopic,
  molarMassTopic,
  moleConversionsTopic,
  percentCompositionTopic,
  empiricalMolecularTopic,
];

export const TOPIC_CONTENT: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.meta.id, t]));

export function isReady(topicId: string): boolean {
  return topicId in TOPIC_CONTENT;
}
