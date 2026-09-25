import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Lock } from 'lucide-react';
import { SECTIONS, TOPICS } from '../content/curriculum';
import { isReady } from '../content/registry';
import { summarize, timeAgo, useAttempts } from '../progress/store';
import type { SectionId, TopicMeta } from '../content/types';

export function Library() {
  const attempts = useAttempts();
  const [filter, setFilter] = useState<SectionId | 'all'>('all');

  const last = useMemo(() => {
    const done = attempts.filter((a) => a.completed);
    if (!done.length) return null;
    const latest = done.reduce((a, b) => (a.finishedAt > b.finishedAt ? a : b));
    return TOPICS.find((t) => t.id === latest.topicId) ?? null;
  }, [attempts]);

  // Basics first, then the units in course order.
  const ordered = SECTIONS;
  const shown = filter === 'all' ? ordered : ordered.filter((s) => s.id === filter);

  return (
    <div className="container">
      <section className="hero">
        <h1>
          Chemistry, <span>one step at a time.</span>
        </h1>
        <p>Pick any topic, in any order. Learn it, see it worked out, then try it with hints whenever you need them.</p>
      </section>

      {last && (
        <Link to={`/topic/${last.id}`} className={`card continue-card sec-${last.section}`}>
          <span className="pill">Continue</span>
          <div style={{ minWidth: 0 }}>
            <h3>{last.title}</h3>
            <p className="tiny">Pick up where you left off</p>
          </div>
          <div className="spacer" />
          <ArrowRight size={20} />
        </Link>
      )}

      <div className="section-tabs" role="toolbar" aria-label="Filter by section">
        <button className="section-tab" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All topics
        </button>
        {ordered.map((s) => (
          <button
            key={s.id}
            className={`section-tab sec-${s.id}`}
            aria-pressed={filter === s.id}
            onClick={() => setFilter(s.id)}
          >
            <span className="dot" />
            {s.id === 'basics' ? s.shortTitle : `${s.title.split(':')[0]}: ${s.shortTitle}`}
          </button>
        ))}
      </div>

      {shown.map((section) => {
        const topics = TOPICS.filter((t) => t.section === section.id);
        const groups = [...new Set(topics.map((t) => t.group ?? ''))];
        const readyCount = topics.filter((t) => isReady(t.id)).length;
        return (
          <section key={section.id} className={`section-block sec-${section.id}`}>
            <div className="section-head">
              <div className="badge">{section.id === 'basics' ? 'B' : section.id.slice(1)}</div>
              <div style={{ flex: 1 }}>
                <h2>{section.title}</h2>
                <p className="muted" style={{ fontSize: '0.95rem' }}>{section.blurb}</p>
              </div>
              <span className="pill neutral">
                {readyCount}/{topics.length} ready
              </span>
            </div>
            {groups.map((g) => (
              <div key={g}>
                {g && <div className="group-label">{g}</div>}
                <div className="topic-grid">
                  {topics
                    .filter((t) => (t.group ?? '') === g)
                    .map((t) => (
                      <TopicCard key={t.id} topic={t} attempts={attempts} />
                    ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <footer className="footer">
        Built for NL Chemistry 2202 · Molar masses from the NL Periodic Chart (2019‑20) · Your progress is saved to your account
      </footer>
    </div>
  );
}

function TopicCard({ topic, attempts }: { topic: TopicMeta; attempts: ReturnType<typeof useAttempts> }) {
  const ready = isReady(topic.id);
  const p = summarize(attempts, topic.id);
  if (!ready) {
    return (
      <div className="topic-card soon" aria-disabled="true">
        <span className="num">{topic.number}</span>
        <h3>{topic.title}</h3>
        <div className="meta">
          <Lock size={13} /> Coming soon
        </div>
      </div>
    );
  }
  return (
    <Link to={`/topic/${topic.id}`} className="topic-card">
      <span className="num">{topic.number}</span>
      <h3>{topic.title}</h3>
      <div className="meta">
        {p.lastPractised ? (
          <>
            <CheckCircle2 size={14} color="var(--good)" />
            {p.questions} done · {timeAgo(p.lastPractised)}
          </>
        ) : (
          <>
            <Clock size={13} /> Not started
          </>
        )}
      </div>
    </Link>
  );
}
