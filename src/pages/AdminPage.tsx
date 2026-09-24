import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Search, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { adminUpdateUser, removeLink, watchAllUsers, watchLinks, type ParentLink, type Role, type UserProfile } from '../firebase/data';

export function AdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => watchAllUsers(setUsers, () => setError('Couldn’t load users. Is this account an admin?')), []);
  useEffect(() => watchLinks(null, null, setLinks, () => undefined), []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users ?? [])
      .filter((u) => !term || u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      .sort((a, b) => a.role.localeCompare(b.role) || a.displayName.localeCompare(b.displayName));
  }, [users, q]);

  if (profile?.role !== 'admin') {
    return (
      <div className="container narrow" style={{ padding: 40 }}>
        <div className="card empty">Admins only.</div>
      </div>
    );
  }

  const update = (uid: string, patch: Partial<Pick<UserProfile, 'role' | 'disabled' | 'hasAccess'>>) =>
    adminUpdateUser(uid, patch).catch(() => setError('That change didn’t save. Try again.'));

  const counts = {
    student: users?.filter((u) => u.role === 'student').length ?? 0,
    parent: users?.filter((u) => u.role === 'parent').length ?? 0,
  };

  return (
    <div className="container" style={{ padding: '32px 20px 64px' }}>
      <h1>Admin</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {counts.student} students · {counts.parent} parents · {links.length} parent links
      </p>

      <div className="row" style={{ margin: '20px 0 14px' }}>
        <div className="search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" />
        </div>
      </div>
      {error && <div className="feedback miss" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="nice admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Active</th>
                <th>Access</th>
                <th>Parent links</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users === null ? (
                <tr>
                  <td colSpan={6} className="muted">Loading…</td>
                </tr>
              ) : (
                shown.map((u) => {
                  const mine = links.filter((l) => l.studentUid === u.uid || l.parentUid === u.uid);
                  const isSelf = u.uid === profile.uid;
                  return (
                    <tr key={u.uid} className={u.disabled ? 'is-disabled' : ''}>
                      <td>
                        <b>{u.displayName}</b>
                        <div className="tiny">{u.email}</div>
                      </td>
                      <td>
                        <select
                          className="select"
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => update(u.uid, { role: e.target.value as Role })}
                          aria-label={`Role for ${u.displayName}`}
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <Toggle
                          on={!u.disabled}
                          disabled={isSelf}
                          label={`${u.disabled ? 'Enable' : 'Disable'} ${u.displayName}`}
                          onChange={(on) => update(u.uid, { disabled: !on })}
                        />
                      </td>
                      <td>
                        <Toggle on={u.hasAccess} label={`Access for ${u.displayName}`} onChange={(on) => update(u.uid, { hasAccess: on })} />
                      </td>
                      <td>
                        {mine.length === 0 && <span className="tiny">—</span>}
                        {mine.map((l) => (
                          <span key={l.id} className="chip">
                            {l.studentUid === u.uid ? `Parent: ${l.parentName}` : `Student: ${l.studentName}`}
                            <button onClick={() => removeLink(l.id)} aria-label="Remove link">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </td>
                      <td>
                        {u.role !== 'parent' && (
                          <Link to={`/progress/${u.uid}`} className="btn small ghost">
                            <BarChart3 size={15} /> Progress
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="tiny" style={{ marginTop: 12 }}>
        Turning an account off blocks it from the app right away. To delete an account permanently, use the Firebase console
        (Authentication → Users). “Access” is for a future subscription and is on for everyone for now.
      </p>
    </div>
  );
}

function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange(on: boolean): void; label: string; disabled?: boolean }) {
  return (
    <button
      className="toggle"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  );
}
