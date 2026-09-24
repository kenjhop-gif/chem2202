import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { THEMES } from '../theme/themes';
import { useTheme, type ColorMode } from '../theme/ThemeProvider';
import { SECTIONS } from '../content/curriculum';

const MODES: { id: ColorMode; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: 'Match device', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

export function SettingsPage() {
  const { theme, setThemeId, mode, setMode, resolvedMode } = useTheme();
  return (
    <div className="container narrow" style={{ padding: '40px 20px 64px' }}>
      <h1>Settings</h1>

      <section style={{ marginTop: 32 }}>
        <h2>Appearance</h2>
        <div className="segmented" style={{ marginTop: 12 }} role="group" aria-label="Appearance">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Color theme</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Each section of the course gets its own color: {SECTIONS.map((s) => s.shortTitle).join(', ')}.
        </p>
        <div className="theme-grid" style={{ marginTop: 16 }}>
          {THEMES.map((t) => (
            <button key={t.id} className="theme-card" aria-pressed={theme.id === t.id} onClick={() => setThemeId(t.id)}>
              <div className="row">
                <b>{t.name}</b>
                <div className="spacer" />
                {theme.id === t.id && <Check size={18} />}
              </div>
              <p className="tiny">{t.description}</p>
              <div className="swatches">
                {SECTIONS.map((s) => (
                  <span key={s.id} style={{ background: t.sections[s.id][resolvedMode].solid }} title={s.shortTitle} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2>Account</h2>
        <div className="card pad" style={{ marginTop: 12 }}>
          <p className="muted">
            Accounts are coming soon. For now, your progress and settings are saved on this device only.
          </p>
        </div>
      </section>
    </div>
  );
}
