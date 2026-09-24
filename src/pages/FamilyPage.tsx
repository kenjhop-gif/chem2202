import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { LinkError, linkWithCode, watchLinks, type ParentLink } from '../firebase/data';

/** Parent home: linked students and a form to link another one. */
export function FamilyPage() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<ParentLink[] | null>(null);

  useEffect(() => watchLinks('parentUid', profile!.uid, setLinks, () => setLinks([])), [profile]);

  return (
    <div className="container narrow" style={{ padding: '36px 20px 64px' }}>
      <h1>Hi, {profile!.displayName}</h1>
      <p className="muted" style={{ marginTop: 6 }}>See what your student has been practising.</p>

      <section style={{ marginTop: 28 }} className="stack">
        {links === null ? (
          <p className="muted">Loading…</p>
        ) : links.length === 0 ? (
          <div className="card pad">
            <h3>No students linked yet</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Ask your student to open <b>Settings</b> in the app and share their <b>parent link code</b>, then enter it below.
            </p>
          </div>
        ) : (
          links.map((l) => (
            <Link key={l.id} to={`/progress/${l.studentUid}`} className="card pad row student-card">
              <div className="avatar">{l.studentName.slice(0, 1).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <h3>{l.studentName}</h3>
                <p className="tiny">View progress</p>
              </div>
              <ChevronRight size={20} />
            </Link>
          ))
        )}
      </section>

      <LinkForm />

      <Link to="/library" className="card pad row" style={{ marginTop: 16, textDecoration: 'none' }}>
        <BookOpen size={20} color="var(--accent)" />
        <div>
          <h3>Browse the topics</h3>
          <p className="tiny">See what your student is learning</p>
        </div>
      </Link>
    </div>
  );
}

export function LinkForm() {
  const { profile } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setMsg({ ok: false, text: 'Enter the code first.' });
    setBusy(true);
    setMsg(null);
    try {
      const name = await linkWithCode(profile!, code);
      setMsg({ ok: true, text: `Linked to ${name}.` });
      setCode('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof LinkError ? err.message : 'That code didn’t work. Check it and try again.' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card pad" style={{ marginTop: 16 }} onSubmit={submit}>
      <h3 className="row">
        <UserPlus size={18} /> Link a student
      </h3>
      <div className="answer-row" style={{ marginTop: 12 }}>
        <input
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="6-character code"
          maxLength={8}
          autoCapitalize="characters"
          style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
        />
        <button className="btn primary" disabled={busy}>
          {busy ? 'Linking…' : 'Link'}
        </button>
      </div>
      {msg && <div className={`feedback ${msg.ok ? 'good' : 'miss'}`}>{msg.text}</div>}
    </form>
  );
}
