import { useState, type FormEvent } from 'react';
import { FlaskConical, GraduationCap, Users } from 'lucide-react';
import { authErrorMessage, useAuth } from './AuthProvider';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && !name.trim()) return setError('Enter your name.');
    if (!email.trim()) return setError('Enter your email address.');
    if (mode !== 'reset' && !password) return setError('Enter your password.');
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else if (mode === 'signup') await signUp(name, email, password, role);
      else {
        await resetPassword(email);
        setNotice('If there’s an account with that email, a reset link is on its way. Check your inbox.');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const switchTo = (m: Mode) => {
    setMode(m);
    setError('');
    setNotice('');
  };

  return (
    <div className="auth-page sec-u1">
      <div className="auth-card card">
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-mark">
            <FlaskConical size={18} strokeWidth={2.2} />
          </span>
          <span>
            Step Coach
            <small>Chemistry 2202</small>
          </span>
        </div>

        <h1 className="auth-title">
          {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
        </h1>
        <p className="muted auth-sub">
          {mode === 'signin'
            ? 'Sign in to pick up where you left off.'
            : mode === 'signup'
              ? 'Your progress is saved to your account, on any device.'
              : 'We’ll email you a link to set a new password.'}
        </p>

        {mode !== 'reset' && (
          <div className="segmented full" role="tablist" style={{ marginTop: 20 }}>
            <button type="button" aria-pressed={mode === 'signin'} onClick={() => switchTo('signin')}>
              Sign in
            </button>
            <button type="button" aria-pressed={mode === 'signup'} onClick={() => switchTo('signup')}>
              Create account
            </button>
          </div>
        )}

        <form onSubmit={submit} className="auth-form" noValidate>
          {mode === 'signup' && (
            <>
              <div className="field">
                <span>I’m a…</span>
                <div className="role-pick">
                  <button type="button" className="choice" aria-pressed={role === 'student'} onClick={() => setRole('student')}>
                    <GraduationCap size={20} /> Student
                  </button>
                  <button type="button" className="choice" aria-pressed={role === 'parent'} onClick={() => setRole('parent')}>
                    <Users size={20} /> Parent
                  </button>
                </div>
              </div>
              <label className="field">
                <span>{role === 'student' ? 'Your name' : 'Your name'}</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="First name is fine" />
              </label>
            </>
          )}
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
          </label>
          {mode !== 'reset' && (
            <label className="field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
              />
            </label>
          )}

          {error && <div className="feedback miss" role="alert">{error}</div>}
          {notice && <div className="feedback good">{notice}</div>}

          <button className="btn primary block" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-foot">
          {mode === 'signin' && (
            <button className="linkish" onClick={() => switchTo('reset')}>
              Forgot your password?
            </button>
          )}
          {mode === 'reset' && (
            <button className="linkish" onClick={() => switchTo('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
      <p className="tiny" style={{ textAlign: 'center', marginTop: 16 }}>
        We only store your name, email, and practice progress.
      </p>
    </div>
  );
}

/** Shown if someone is signed in but their profile was never created (e.g. sign-up was interrupted). */
export function CompleteProfile() {
  const { user, completeProfile, signOut } = useAuth();
  const [name, setName] = useState(user?.displayName ?? '');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [error, setError] = useState('');
  return (
    <div className="auth-page sec-u1">
      <div className="auth-card card">
        <h1 className="auth-title">Finish setting up</h1>
        <p className="muted auth-sub">Just two quick things.</p>
        <div className="auth-form">
          <div className="field">
            <span>I’m a…</span>
            <div className="role-pick">
              <button type="button" className="choice" aria-pressed={role === 'student'} onClick={() => setRole('student')}>
                <GraduationCap size={20} /> Student
              </button>
              <button type="button" className="choice" aria-pressed={role === 'parent'} onClick={() => setRole('parent')}>
                <Users size={20} /> Parent
              </button>
            </div>
          </div>
          <label className="field">
            <span>Your name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {error && <div className="feedback miss">{error}</div>}
          <button
            className="btn primary block"
            onClick={() => (name.trim() ? completeProfile(name, role).catch(() => setError('Couldn’t save. Try again.')) : setError('Enter your name.'))}
          >
            Continue
          </button>
          <button className="btn ghost block" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
