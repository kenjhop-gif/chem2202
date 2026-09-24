import { saveAttempt, watchAttempts } from '../firebase/data';
import type { AttemptRecord, ProgressStore } from './store';

/** A student's Firestore practice log, kept live in memory. Returns the store and a stop function. */
export function createRemoteStore(uid: string): { store: ProgressStore; stop(): void } {
  let cache: AttemptRecord[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const stop = watchAttempts(uid, (list) => {
    cache = list;
    notify();
  });
  return {
    store: {
      add(record) {
        cache = [...cache, record]; // optimistic; the snapshot confirms it
        notify();
        saveAttempt(uid, record).catch((e) => console.error('Could not save progress', e));
      },
      all: () => cache,
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
    stop,
  };
}
