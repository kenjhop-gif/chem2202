import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BarChart3, BookOpen, Coffee, FlaskConical, Grid3x3, Shield, Users } from 'lucide-react';
import { PeriodicTableSheet } from './PeriodicTable';
import { useAuth } from '../auth/AuthProvider';

const navClass = ({ isActive }: { isActive: boolean }) => `icon-btn${isActive ? ' active' : ''}`;

export function AppShell({ children }: { children: ReactNode }) {
  const [tableOpen, setTableOpen] = useState(false);
  const { profile } = useAuth();
  const role = profile?.role;
  return (
    <>
      <header className="header">
        <div className="container">
          <Link to="/" className="brand" aria-label="Chem 2202 Step Coach home">
            <span className="brand-mark">
              <FlaskConical size={18} strokeWidth={2.2} />
            </span>
            <span className="brand-text">
              Step Coach
              <small>Chemistry 2202</small>
            </span>
          </Link>
          <div className="spacer" />
          {role === 'parent' && (
            <>
              <NavLink to="/" end className={navClass} aria-label="Family">
                <Users size={18} />
                <span className="label">Family</span>
              </NavLink>
              <NavLink to="/library" className={navClass} aria-label="Topics">
                <BookOpen size={18} />
                <span className="label">Topics</span>
              </NavLink>
            </>
          )}
          {role !== 'parent' && (
            <NavLink to="/progress" end className={navClass} aria-label="Your progress">
              <BarChart3 size={18} />
              <span className="label">Progress</span>
            </NavLink>
          )}
          {role === 'admin' && (
            <NavLink to="/admin" className={navClass} aria-label="Admin">
              <Shield size={18} />
              <span className="label">Admin</span>
            </NavLink>
          )}
          <button className="icon-btn" onClick={() => setTableOpen(true)} aria-label="Open periodic chart">
            <Grid3x3 size={18} />
            <span className="label">Periodic chart</span>
          </button>
          {role !== 'parent' && (
            <NavLink to="/break" className={navClass} aria-label="Take a break">
              <Coffee size={18} />
              <span className="label">Break</span>
            </NavLink>
          )}
          <NavLink to="/settings" className={navClass} aria-label="Settings and account">
            <span className="avatar small">{profile?.displayName.slice(0, 1).toUpperCase() ?? '?'}</span>
          </NavLink>
        </div>
      </header>
      <main>{children}</main>
      {tableOpen && <PeriodicTableSheet onClose={() => setTableOpen(false)} />}
    </>
  );
}
