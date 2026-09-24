import { useEffect, useState, type ReactNode } from 'react';
import { FlaskConical, ShieldOff } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { AuthPage, CompleteProfile } from './AuthPage';

/** Everything in the app requires an account (see PLAN.md §5). */
export function Gate({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  // A brand-new account briefly has no profile while sign-up finishes writing it.
  const [profileGrace, setProfileGrace] = useState(true);
  useEffect(() => {
    setProfileGrace(true);
    const t = setTimeout(() => setProfileGrace(false), 4000);
    return () => clearTimeout(t);
  }, [user?.uid]);

  if (user === undefined) return <Splash />;
  if (user === null) return <AuthPage />;
  if (profile === undefined || (profile === null && profileGrace)) return <Splash />;
  if (profile === null) return <CompleteProfile />;
  if (profile.disabled) {
    return (
      <div className="auth-page">
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          <div className="empty">
            <div className="icon">
              <ShieldOff size={26} />
            </div>
            <h2>This account is turned off</h2>
            <p style={{ marginTop: 8 }}>If you think this is a mistake, contact the person who shared this app with you.</p>
          </div>
          <button className="btn block" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function Splash() {
  return (
    <div className="auth-page">
      <div className="splash">
        <span className="brand-mark" style={{ width: 52, height: 52, borderRadius: 16 }}>
          <FlaskConical size={26} />
        </span>
      </div>
    </div>
  );
}
