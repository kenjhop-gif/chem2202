import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_THEME_ID, themeById, type Theme } from './themes';
import { loadPrefs, savePrefs } from '../progress/prefs';

export type ColorMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setThemeId(id: string): void;
  mode: ColorMode;
  setMode(mode: ColorMode): void;
  /** The mode actually in effect. */
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = loadPrefs();
  const [themeId, setThemeId] = useState(initial.themeId ?? DEFAULT_THEME_ID);
  const [mode, setMode] = useState<ColorMode>(initial.colorMode ?? 'system');
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = themeById(themeId);
  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = resolvedMode;
    for (const [section, ramp] of Object.entries(theme.sections)) {
      const s = ramp[resolvedMode];
      root.style.setProperty(`--sec-${section}`, s.solid);
      root.style.setProperty(`--sec-${section}-soft`, s.soft);
      root.style.setProperty(`--sec-${section}-ink`, s.ink);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', resolvedMode === 'dark' ? '#0f1016' : '#f6f6f9');
  }, [theme, resolvedMode]);

  useEffect(() => {
    savePrefs({ themeId, colorMode: mode });
  }, [themeId, mode]);

  const value = useMemo(
    () => ({ theme, setThemeId, mode, setMode, resolvedMode }),
    [theme, mode, resolvedMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme outside ThemeProvider');
  return ctx;
}
