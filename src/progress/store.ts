// Practice progress: what was practised, when, and how (never a grade).
// The active store is local until someone signs in, then it's their Firestore log.
import { useSyncExternalStore } from 'react';
import type { PracticeMode } from './prefs';

export interface AttemptRecord {
  id: string;
  topicId: string;
  templateId: string;
  skill: string;
  /** Mode the question started in; `switchedToSteps` if "try first" fell back to steps. */
  mode: PracticeMode;
  switchedToSteps: boolean;
  hints: number;
  retries: number;
  /** Steps revealed with "Show me". */
  revealed: number;
  completed: boolean;
  startedAt: number;
  finishedAt: number;
}

export interface ProgressStore {
  add(record: AttemptRecord): void;
  all(): AttemptRecord[];
  subscribe(listener: () => void): () => void;
}

const LOCAL_KEY = 'chem2202.attempts';

export function createLocalStore(): ProgressStore & { clear(): void } {
  let cache: AttemptRecord[] | null = null;
  const listeners = new Set<() => void>();
  const read = (): AttemptRecord[] => {
    if (cache) return cache;
    try {
      cache = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as AttemptRecord[];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (list: AttemptRecord[]) => {
    cache = list;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch {
      // Keep the in-memory copy if storage is unavailable.
    }
    listeners.forEach((l) => l());
  };
  return {
    add: (record) => write([...read(), record]),
    all: read,
    clear: () => write([]),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const localStore = createLocalStore();

/** Delegates to whichever store is active and notifies subscribers when it changes. */
function createSwitchableStore(initial: ProgressStore) {
  let inner = initial;
  let unsubInner = () => {};
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const attach = () => {
    unsubInner();
    unsubInner = inner.subscribe(notify);
  };
  attach();
  return {
    add: (r: AttemptRecord) => inner.add(r),
    all: () => inner.all(),
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    use(store: ProgressStore) {
      inner = store;
      attach();
      notify();
    },
  };
}

export const progressStore = createSwitchableStore(localStore);

export function useAttempts(): AttemptRecord[] {
  return useSyncExternalStore(progressStore.subscribe, progressStore.all);
}

export interface TopicProgress {
  questions: number;
  lastPractised: number | null;
  withoutHints: number;
}

export function summarize(attempts: AttemptRecord[], topicId: string): TopicProgress {
  const mine = attempts.filter((a) => a.topicId === topicId && a.completed);
  return {
    questions: mine.length,
    lastPractised: mine.length ? Math.max(...mine.map((a) => a.finishedAt)) : null,
    withoutHints: mine.filter((a) => a.hints === 0 && a.revealed === 0).length,
  };
}

export function timeAgo(ts: number, now = Date.now()): string {
  const mins = Math.round((now - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
