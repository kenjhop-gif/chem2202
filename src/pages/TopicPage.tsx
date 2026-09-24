import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Footprints, PlayCircle, Printer, Rocket, Sparkles, Target } from 'lucide-react';
import { TOPIC_CONTENT } from '../content/registry';
import { TOPIC_META, sectionOf } from '../content/curriculum';
import { Example, LearnBlocks } from '../components/Blocks';
import { Rich } from '../components/Rich';
import { summarize, timeAgo, useAttempts } from '../progress/store';
import { loadPrefs, savePrefs, type PracticeMode } from '../progress/prefs';

const TABS = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'examples', label: 'Examples', icon: Sparkles },
  { id: 'practice', label: 'Practice', icon: Target },
  { id: 'videos', label: 'Videos', icon: PlayCircle },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function TopicPage() {
  const { topicId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const topic = TOPIC_CONTENT[topicId];
  const meta = TOPIC_META[topicId];
  const tab = (params.get('tab') as TabId) ?? 'learn';

  if (!meta) return <Navigate to="/" replace />;
  if (!topic) return <ComingSoon topicId={topicId} />;

  const section = sectionOf(meta.section);
  const setTab = (id: TabId) => setParams({ tab: id }, { replace: true });

  return (
    <div className={`sec-${meta.section}`}>
      <div className="container narrow topic-hero">
        <Link to="/library" className="crumb">
          <ArrowLeft size={16} /> {section.title}
        </Link>
        <div className="band">
          <span className="pill" style={{ background: 'var(--surface)', color: 'var(--accent-ink)' }}>
            {meta.section === 'basics' ? meta.number : `Topic ${meta.number}`}
            {meta.group ? ` · ${meta.group}` : ''}
          </span>
          <h1 style={{ marginTop: 12 }}>{meta.title}</h1>
          <Rich as="p" text={topic.summary} />
          <MoleculeArt />
        </div>

        <div className="tabs" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="tab-panel" key={tab}>
          {tab === 'learn' && (
            <>
              <LearnBlocks blocks={topic.learn} />
              <div className="row" style={{ marginTop: 32, flexWrap: 'wrap' }}>
                <button className="btn primary" onClick={() => setTab('examples')}>
                  See worked examples
                </button>
                <button className="btn ghost" onClick={() => setTab('practice')}>
                  Skip to practice
                </button>
              </div>
            </>
          )}
          {tab === 'examples' && (
            <>
              {topic.examples.map((ex, i) => (
                <Example key={i} example={ex} index={i} />
              ))}
              <div className="row" style={{ marginTop: 24 }}>
                <button className="btn primary" onClick={() => setTab('practice')}>
                  Try it yourself
                </button>
              </div>
            </>
          )}
          {tab === 'practice' && <PracticeIntro topicId={topicId} />}
          {tab === 'videos' && <Videos topicId={topicId} />}
        </div>
      </div>
    </div>
  );
}

function PracticeIntro({ topicId }: { topicId: string }) {
  const topic = TOPIC_CONTENT[topicId];
  const navigate = useNavigate();
  const attempts = useAttempts();
  const p = summarize(attempts, topicId);
  const prefs = loadPrefs();
  const seen = prefs.seenTopics?.includes(topicId);
  const [mode, setMode] = useState<PracticeMode>(seen ? (prefs.practiceMode ?? 'steps') : 'steps');

  const start = () => {
    savePrefs({ practiceMode: mode, seenTopics: [...new Set([...(prefs.seenTopics ?? []), topicId])] });
    navigate(`/topic/${topicId}/practice?mode=${mode}`);
  };

  return (
    <div className="practice-intro">
      <div className="card pad">
        <h2>Guided practice</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          {topic.practice.length} questions with fresh numbers every time. Hints are always there. Use as many as you like.
        </p>
        <p style={{ marginTop: 20, fontWeight: 600 }}>How do you want to work?</p>
        <div className="choices" style={{ marginTop: 10 }}>
          <button className="choice" aria-pressed={mode === 'steps'} onClick={() => setMode('steps')}>
            <span className="radio" />
            <span>
              <b>Walk me through it</b>
              <br />
              <span className="tiny">Each question is broken into small steps.</span>
            </span>
            <Footprints size={20} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </button>
          <button className="choice" aria-pressed={mode === 'try'} onClick={() => setMode('try')}>
            <span className="radio" />
            <span>
              <b>Let me try it first</b>
              <br />
              <span className="tiny">Enter the final answer. If you get stuck, break it into steps.</span>
            </span>
            <Rocket size={20} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </button>
        </div>
        <button className="btn primary block" style={{ marginTop: 20 }} onClick={start}>
          Start practice
        </button>
      </div>
      <div className="stack">
        <div className="card pad">
          <h3>Your progress</h3>
          {p.questions ? (
            <div className="stat-row" style={{ margin: '14px 0 0' }}>
              <div className="stat">
                <b>{p.questions}</b>
                <span>questions done</span>
              </div>
              <div className="stat">
                <b>{p.withoutHints}</b>
                <span>solved without hints</span>
              </div>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 6 }}>Nothing yet. Your first question is waiting.</p>
          )}
          {p.lastPractised && <p className="tiny" style={{ marginTop: 10 }}>Last practised {timeAgo(p.lastPractised)}</p>}
        </div>
        <Link to={`/topic/${topicId}/guide`} className="card pad row" style={{ textDecoration: 'none' }}>
          <Printer size={20} color="var(--accent)" />
          <div>
            <h3>Printable step guide</h3>
            <p className="tiny">The method on one page, with examples</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function Videos({ topicId }: { topicId: string }) {
  const topic = TOPIC_CONTENT[topicId];
  if (!topic.videos.length) {
    return (
      <div className="card empty">
        <div className="icon">
          <PlayCircle size={26} />
        </div>
        <h3>Videos are on the way</h3>
        <p style={{ marginTop: 6 }}>We’re checking each video for accuracy before adding it here.</p>
      </div>
    );
  }
  return (
    <div className="video-grid">
      {topic.videos.map((v) => (
        <div key={v.youtubeId} className="card" style={{ overflow: 'hidden' }}>
          <iframe
            className="video-frame"
            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
            title={v.title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
          <div style={{ padding: '14px 16px' }}>
            <h3>{v.title}</h3>
            <p className="tiny">{v.channel}</p>
            {v.note && <p className="muted" style={{ marginTop: 6, fontSize: '0.92rem' }}>{v.note}</p>}
            <a className="crumb" style={{ marginTop: 8 }} href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noreferrer">
              Open on YouTube →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComingSoon({ topicId }: { topicId: string }) {
  const meta = TOPIC_META[topicId];
  return (
    <div className={`container narrow sec-${meta.section}`} style={{ paddingTop: 40 }}>
      <Link to="/library" className="crumb">
        <ArrowLeft size={16} /> All topics
      </Link>
      <div className="card empty" style={{ marginTop: 20 }}>
        <div className="icon">
          <BookOpen size={26} />
        </div>
        <h2>{meta.title}</h2>
        <p style={{ marginTop: 8 }}>This topic is being written. Check back soon!</p>
      </div>
    </div>
  );
}

function MoleculeArt() {
  return (
    <svg className="band-art" width="220" height="160" viewBox="0 0 220 160" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <line x1="60" y1="80" x2="120" y2="50" />
        <line x1="120" y1="50" x2="180" y2="80" />
        <line x1="120" y1="50" x2="120" y2="120" />
      </g>
      <circle cx="120" cy="50" r="26" fill="currentColor" />
      <circle cx="60" cy="80" r="16" fill="currentColor" />
      <circle cx="180" cy="80" r="16" fill="currentColor" />
      <circle cx="120" cy="128" r="16" fill="currentColor" />
    </svg>
  );
}
