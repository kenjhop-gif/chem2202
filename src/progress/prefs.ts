// Per-user preferences. Cached locally; when signed in, every change is also
// written to the user's profile so choices follow the student across devices.
import type { ColorMode } from '../theme/ThemeProvider';

export type PracticeMode = 'steps' | 'try';

export interface Prefs {
  themeId?: string;
  colorMode?: ColorMode;
  practiceMode?: PracticeMode;
  /** Topic ids the student has practised at least once (new topics default to steps). */
  seenTopics?: string[];
}

const KEY = 'chem2202.prefs';
let remoteSink: ((prefs: Prefs) => void) | null = null;
const listeners = new Set<() => void>();

/** Set by the auth layer: receives the full prefs object after each change. */
export function setPrefsSink(sink: ((prefs: Prefs) => void) | null) {
  remoteSink = sink;
}

export function onPrefsReplaced(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
}

function writeLocal(prefs: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be unavailable (private mode); preferences just won't persist locally.
  }
}

export function savePrefs(patch: Partial<Prefs>): void {
  const current = loadPrefs();
  const next = { ...current, ...patch };
  if (JSON.stringify(next) === JSON.stringify(current)) return;
  writeLocal(next);
  remoteSink?.(next);
}

/** Replaces local prefs with the ones stored on the account (on sign-in). */
export function replacePrefs(prefs: Prefs): void {
  writeLocal(prefs);
  listeners.forEach((l) => l());
}
