import { useEffect, useState } from 'react';
import { Copy, LogOut, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { newLinkCode, removeLink, updateOwnProfile, watchLinks, type ParentLink } from '../firebase/data';
import { LinkForm } from './FamilyPage';

const ROLE_LABEL = { student: 'Student', parent: 'Parent', admin: 'Admin' } as const;

export function AccountSection() {
  const { profile, signOut } = useAuth();
  const p = profile!;
  const [name, setName] = useState(p.displayName);
  const [saved, setSaved] = useState(false);

  const saveName = async () => {
    if (!name.trim() || name.trim() === p.displayName) return;
    await updateOwnProfile(p.uid, { displayName: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="stack" style={{ gap: 16, marginTop: 12 }}>
      <div className="card pad">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <div className="avatar">{p.displayName.slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{p.displayName}</b>
            <p className="tiny" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</p>
          </div>
          <span className="pill neutral">{ROLE_LABEL[p.role]}</span>
        </div>
        <label className="field" style={{ marginTop: 16 }}>
          <span>Display name</span>
          <div className="answer-row">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
            <button className="btn" onClick={saveName}>{saved ? 'Saved' : 'Save'}</button>
          </div>
        </label>
        <button className="btn ghost" style={{ marginTop: 12 }} onClick={signOut}>
          <LogOut size={16} /> Sign out
        </button>
      </div>

      {p.role === 'student' && <StudentLinkCard />}
      {p.role === 'parent' && <LinkForm />}
    </div>
  );
}

function StudentLinkCard() {
  const { profile } = useAuth();
  const p = profile!;
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => watchLinks('studentUid', p.uid, setLinks, () => setLinks([])), [p.uid]);

  const regenerate = async () => {
    setBusy(true);
    try {
      await newLinkCode(p.uid, p.displayName, p.linkCode);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!p.linkCode) return;
    await navigator.clipboard?.writeText(p.linkCode).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card pad">
      <h3>Parent access</h3>
      <p className="muted" style={{ marginTop: 6, fontSize: '0.95rem' }}>
        A parent can see your practice progress (not change anything) after entering this code in their account.
      </p>
      {p.linkCode ? (
        <div className="row" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          <code className="link-code">{p.linkCode}</code>
          <button className="btn small" onClick={copy}>
            <Copy size={15} /> {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="btn small ghost" onClick={regenerate} disabled={busy} title="Make a new code (the old one stops working)">
            <RefreshCw size={15} /> New code
          </button>
        </div>
      ) : (
        <button className="btn soft" style={{ marginTop: 14 }} onClick={regenerate} disabled={busy}>
          {busy ? 'Creating…' : 'Create a parent link code'}
        </button>
      )}

      {links.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p className="tiny" style={{ marginBottom: 8 }}>Linked parents</p>
          {links.map((l) => (
            <div key={l.id} className="row linked-row">
              <div className="avatar small">{l.parentName.slice(0, 1).toUpperCase()}</div>
              <span style={{ flex: 1 }}>{l.parentName}</span>
              <button className="btn small ghost" onClick={() => removeLink(l.id)} aria-label={`Remove ${l.parentName}`}>
                <X size={15} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
