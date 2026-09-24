import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { TOPIC_CONTENT } from '../content/registry';
import { TOPIC_META, sectionOf } from '../content/curriculum';
import { Example } from '../components/Blocks';
import { Rich } from '../components/Rich';

export function StepGuidePage() {
  const { topicId = '' } = useParams();
  const topic = TOPIC_CONTENT[topicId];
  if (!topic) return <Navigate to="/" replace />;
  const meta = TOPIC_META[topicId];
  const keys = topic.learn.filter((b) => b.type === 'key' || b.type === 'equation');

  return (
    <div className={`container narrow sec-${meta.section}`} style={{ padding: '28px 20px 64px' }}>
      <div className="row no-print">
        <Link to={`/topic/${topicId}?tab=practice`} className="crumb">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="spacer" />
        <button className="btn primary small" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </button>
      </div>

      <p className="tiny" style={{ marginTop: 20 }}>
        Chemistry 2202 · {sectionOf(meta.section).title}
      </p>
      <h1 style={{ marginTop: 4 }}>Step guide: {meta.title}</h1>

      <div className="card pad" style={{ marginTop: 20 }}>
        <h2>The method</h2>
        <ol className="prose" style={{ marginTop: 12, paddingLeft: '1.3em' }}>
          {topic.stepGuide.map((s, i) => (
            <li key={i}>
              <Rich text={s} />
            </li>
          ))}
        </ol>
      </div>

      {keys.length > 0 && (
        <div className="card pad" style={{ marginTop: 16 }}>
          <h2>Key ideas and formulas</h2>
          <ul className="prose" style={{ marginTop: 12, paddingLeft: '1.3em' }}>
            {keys.map((b, i) => (
              <li key={i}>
                {b.type === 'key' ? (
                  <>
                    <b><Rich text={b.title} />:</b> <Rich text={b.text} />
                  </>
                ) : b.type === 'equation' ? (
                  <>
                    <b><Rich text={b.text} /></b>
                    {b.caption && <> ({<Rich text={b.caption} />})</>}
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 style={{ margin: '28px 0 14px' }}>Worked examples</h2>
      {topic.examples.map((ex, i) => (
        <Example key={i} example={ex} index={i} revealAll />
      ))}
    </div>
  );
}
