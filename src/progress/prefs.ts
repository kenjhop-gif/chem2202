// Per-user preferences. Stored locally for now; moves to the user's Firestore
// profile when accounts are connected, so choices follow the student across devices.
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

export function loadPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
}

export function savePrefs(patch: Partial<Prefs>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...patch }));
  } catch {
    // Storage can be unavailable (private mode); preferences just won't persist.
  }
}
