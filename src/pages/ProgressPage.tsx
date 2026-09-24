import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDoc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { ProgressView, useStudentAttempts } from '../progress/ProgressView';
import { userRef } from '../firebase/data';

/** /progress (own) or /progress/:uid (a linked student, or anyone for admins). */
export function ProgressPage() {
  const { uid: param } = useParams();
  const { profile } = useAuth();
  const uid = param ?? profile!.uid;
  const isMe = uid === profile!.uid;
  const { attempts, loading, error } = useStudentAttempts(uid);
  const [name, setName] = useState<string>(isMe ? profile!.displayName : '');

  useEffect(() => {
    if (isMe) return;
    getDoc(userRef(uid))
      .then((s) => setName((s.data()?.displayName as string) ?? 'Student'))
      .catch(() => setName('Student'));
  }, [uid, isMe]);

  const back = profile!.role === 'admin' && !isMe ? '/admin' : profile!.role === 'parent' ? '/' : '/';

  return (
    <div className="container" style={{ padding: '28px 20px 64px', maxWidth: 960 }}>
      {!isMe && (
        <Link to={back} className="crumb">
          <ArrowLeft size={16} /> Back
        </Link>
      )}
      <h1 style={{ marginTop: 12 }}>{isMe ? 'Your progress' : `${name || '…'}’s progress`}</h1>
      <p className="muted" style={{ margin: '6px 0 24px' }}>
        {isMe ? 'Everything you’ve practised, topic by topic.' : 'What they’ve practised and how. Updated live.'}
      </p>
      {error ? (
        <div className="card empty">
          <p>{error}</p>
        </div>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <ProgressView attempts={attempts} showPracticeLinks={isMe} />
      )}
    </div>
  );
}
