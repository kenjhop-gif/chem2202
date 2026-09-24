import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Footprints, Lightbulb, RotateCcw, Rocket } from 'lucide-react';
import { TOPIC_META, sectionOf } from '../content/curriculum';
import { watchAttempts } from '../firebase/data';
import { timeAgo, useAttempts, type AttemptRecord } from './store';
import { useAuth } from '../auth/AuthProvider';

/** Live practice log for any student the viewer is allowed to see. */
export function useStudentAttempts(uid: string): { attempts: AttemptRecord[]; loading: boolean; error: string } {
  const { profile } = useAuth();
  const own = useAttempts();
  const isMe = profile?.uid === uid;
  const [state, setState] = useState<{ attempts: AttemptRecord[]; loading: boolean; error: string }>({ attempts: [], loading: true, error: '' });
  useEffect(() => {
    if (isMe) return;
    setState({ attempts: [], loading: true, error: '' });
    return watchAttempts(
      uid,
      (attempts) => setState({ attempts, loading: false, error: '' }),
      () => setState({ attempts: [], loading: false, error: 'You don’t have access to this student’s progress.' }),
    );
  }, [uid, isMe]);
  return isMe ? { attempts: own, loading: false, error: '' } : state;
}

interface TopicRow {
  topicId: string;
  questions: number;
  withoutHints: number;
  hints: number;
  retries: number;
  revealed: number;
  stepsMode: number;
  tryMode: number;
  last: number;
}

export function ProgressView({ attempts, showPracticeLinks = false }: { attempts: AttemptRecord[]; showPracticeLinks?: boolean }) {
  const done = useMemo(() => attempts.filter((a) => a.completed), [attempts]);

  const rows = useMemo(() => {
    const byTopic = new Map<string, TopicRow>();
    for (const a of done) {
      const r =
        byTopic.get(a.topicId) ??
        { topicId: a.topicId, questions: 0, withoutHints: 0, hints: 0, retries: 0, revealed: 0, stepsMode: 0, tryMode: 0, last: 0 };
      r.questions++;
      if (a.hints === 0 && a.revealed === 0) r.withoutHints++;
      r.hints += a.hints;
      r.retries += a.retries;
      r.revealed += a.revealed;
      if (a.mode === 'try' && !a.switchedToSteps) r.tryMode++;
      else r.stepsMode++;
      r.last = Math.max(r.last, a.finishedAt);
      byTopic.set(a.topicId, r);
    }
    return [...byTopic.values()].sort((a, b) => b.last - a.last);
  }, [done]);

  const week = Date.now() - 7 * 86400000;
  const daysThisWeek = new Set(done.filter((a) => a.finishedAt > week).map((a) => new Date(a.finishedAt).toDateString())).size;
  const recent = [...attempts].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 15);

  if (!attempts.length) {
    return (
      <div className="card empty">
        <h3>No practice yet</h3>
        <p style={{ marginTop: 6 }}>Progress shows up here after the first practice question.</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="stat-row" style={{ margin: 0 }}>
        <div className="stat">
          <b>{done.length}</b>
          <span>questions worked through</span>
        </div>
        <div className="stat">
          <b>{rows.length}</b>
          <span>topics practised</span>
        </div>
        <div className="stat">
          <b>{daysThisWeek}</b>
          <span>days active this week</span>
        </div>
        <div className="stat">
          <b>{done.filter((a) => a.hints === 0 && a.revealed === 0).length}</b>
          <span>solved without hints</span>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head">
          <h3>By topic</h3>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="nice">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Questions</th>
                <th>No hints</th>
                <th>Hints</th>
                <th>Retries</th>
                <th>“Show me”</th>
                <th>Last practised</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = TOPIC_META[r.topicId];
                return (
                  <tr key={r.topicId} className={meta ? `sec-${meta.section}` : ''}>
                    <td>
                      {meta ? (
                        showPracticeLinks ? (
                          <Link to={`/topic/${r.topicId}`} className="topic-link">
                            <span className="dot" /> {meta.title}
                          </Link>
                        ) : (
                          <span className="topic-link">
                            <span className="dot" /> {meta.title}
                          </span>
                        )
                      ) : (
                        r.topicId
                      )}
                      {meta && <div className="tiny">{sectionOf(meta.section).shortTitle}</div>}
                    </td>
                    <td>{r.questions}</td>
                    <td>{r.withoutHints}</td>
                    <td>{r.hints}</td>
                    <td>{r.retries}</td>
                    <td>{r.revealed}</td>
                    <td className="tiny">{timeAgo(r.last)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head">
          <h3>Recent activity</h3>
        </div>
        <ul className="activity">
          {recent.map((a) => (
            <li key={a.id}>
              <span className="mode-icon" title={a.mode === 'try' ? 'Tried first' : 'Step by step'}>
                {a.mode === 'try' ? <Rocket size={15} /> : <Footprints size={15} />}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="act-title">
                  {TOPIC_META[a.topicId]?.title ?? a.topicId} · <span className="muted">{a.skill}</span>
                </div>
                <div className="tiny">
                  {new Date(a.finishedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {!a.completed && ' · skipped'}
                  {a.switchedToSteps && ' · switched to steps'}
                </div>
              </div>
              <div className="act-badges">
                {a.hints > 0 && (
                  <span title="Hints">
                    <Lightbulb size={13} /> {a.hints}
                  </span>
                )}
                {a.retries > 0 && (
                  <span title="Retries">
                    <RotateCcw size={13} /> {a.retries}
                  </span>
                )}
                {a.revealed > 0 && (
                  <span title="Show me">
                    <Eye size={13} /> {a.revealed}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="tiny">
        Progress records what was practised and how (hints, retries, mode). It isn’t a grade: using hints is part of learning.
      </p>
    </div>
  );
}
