import { describe, expect, it } from 'vitest';
import { TOPIC_CONTENT } from './registry';
import { TOPIC_META } from './curriculum';
import { createRng } from '../engine/rng';
import { checkAnswer, formatAnswer } from '../engine/check';

const SEEDS = 300;

for (const topic of Object.values(TOPIC_CONTENT)) {
  describe(topic.meta.id, () => {
    it('has metadata and 8-15 practice templates', () => {
      expect(TOPIC_META[topic.meta.id]).toBeDefined();
      expect(topic.practice.length).toBeGreaterThanOrEqual(8);
      expect(topic.practice.length).toBeLessThanOrEqual(15);
    });

    for (const template of topic.practice) {
      it(`${template.id}: every generated question is self-consistent`, () => {
        for (let seed = 1; seed <= SEEDS; seed++) {
          const q = template.generate(createRng(seed));
          expect(q.steps.length).toBeGreaterThan(0);
          for (const step of q.steps) {
            expect(step.hints).toHaveLength(3);
            const a = step.answer;
            if (a.kind === 'numeric') {
              expect(Number.isFinite(a.value)).toBe(true);
              // The displayed answer must be accepted as correct with no sig-fig complaint.
              const shown = formatAnswer(a).replace(' × 10^{', 'e').replace('}', '');
              const r = checkAnswer(a, { kind: 'numeric', text: shown, unit: a.unit });
              expect(r.status, `${template.id} seed ${seed}: ${shown} vs ${a.value}`).toBe('correct');
              expect(r.note, `${template.id} seed ${seed}: ${shown}`).toBeUndefined();
              // (A listed mistake that happens to equal the answer is harmless: correct is checked first.)
            } else if (a.kind === 'choice') {
              expect(a.correct).toBeGreaterThanOrEqual(0);
              expect(a.correct).toBeLessThan(a.options.length);
              expect(new Set(a.options).size).toBe(a.options.length);
            }
          }
        }
      });
    }
  });
}
