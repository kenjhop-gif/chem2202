import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Coffee, FlaskConical, Grid3x3, Settings } from 'lucide-react';
import { PeriodicTableSheet } from './PeriodicTable';

export function AppShell({ children }: { children: ReactNode }) {
  const [tableOpen, setTableOpen] = useState(false);
  return (
    <>
      <header className="header">
        <div className="container">
          <Link to="/" className="brand" aria-label="Chem 2202 Step Coach home">
            <span className="brand-mark">
              <FlaskConical size={18} strokeWidth={2.2} />
            </span>
            <span>
              Step Coach
              <small>Chemistry 2202</small>
            </span>
          </Link>
          <div className="spacer" />
          <button className="icon-btn" onClick={() => setTableOpen(true)} aria-label="Open periodic chart">
            <Grid3x3 size={18} />
            <span className="label">Periodic chart</span>
          </button>
          <NavLink to="/break" className={({ isActive }) => `icon-btn${isActive ? ' active' : ''}`} aria-label="Take a break">
            <Coffee size={18} />
            <span className="label">Break</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `icon-btn${isActive ? ' active' : ''}`} aria-label="Settings">
            <Settings size={18} />
          </NavLink>
        </div>
      </header>
      <main>{children}</main>
      {tableOpen && <PeriodicTableSheet onClose={() => setTableOpen(false)} />}
    </>
  );
}
