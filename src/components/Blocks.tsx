import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Eye, Lightbulb, Sparkles } from 'lucide-react';
import type { Block, WorkedExample } from '../content/types';
import { Rich } from './Rich';
import { TOPIC_META } from '../content/curriculum';

export function LearnBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => (
        <LearnBlock key={i} block={b} />
      ))}
    </div>
  );
}

function LearnBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <Rich as="p" text={block.text} />;
    case 'h':
      return (
        <h2>
          <Rich text={block.text} />
        </h2>
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}>
              <Rich text={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case 'key':
      return (
        <div className="key-box">
          <div className="label">Key idea</div>
          <div className="title">
            <Rich text={block.title} />
          </div>
          <Rich as="p" text={block.text} />
        </div>
      );
    case 'equation':
      return (
        <div className="equation">
          <Rich text={block.text} />
          {block.caption && (
            <span className="caption">
              <Rich text={block.caption} />
            </span>
          )}
        </div>
      );
    case 'tip':
      return (
        <div className="tip-box">
          <Lightbulb size={18} />
          <Rich as="p" text={block.text} />
        </div>
      );
    case 'background': {
      const linked = block.topicId ? TOPIC_META[block.topicId] : undefined;
      return (
        <details className="background">
          <summary>
            <Sparkles size={16} color="var(--accent)" />
            Quick background: <Rich text={block.title} />
            <ChevronDown size={18} className="chev" />
          </summary>
          <div className="body">
            <Rich as="p" text={block.text} />
            {linked && (
              <p style={{ marginTop: 8 }}>
                <Link to={`/topic/${linked.id}`} className="crumb">
                  Refresher: {linked.number}. {linked.title} →
                </Link>
              </p>
            )}
          </div>
        </details>
      );
    }
    case 'table':
      return (
        <div className="table-wrap">
          <table className="nice">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={i}>
                    <Rich text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <Rich text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** Worked example that reveals one step at a time (or all at once). */
export function Example({ example, index, revealAll = false }: { example: WorkedExample; index: number; revealAll?: boolean }) {
  const [shown, setShown] = useState(revealAll ? example.steps.length : 1);
  const done = shown >= example.steps.length;
  return (
    <article className="card example">
      <div className="head">
        <span className="pill">Example {index + 1}</span>
        <h3 style={{ marginTop: 10 }}>
          <Rich text={example.title} />
        </h3>
        <Rich as="p" className="problem" text={example.problem} />
      </div>
      <ol>
        {example.steps.slice(0, shown).map((s, i) => (
          <li key={i} style={{ animation: 'rise .3s' }}>
            <div>
              <div className="lbl">
                <Rich text={s.label} />
              </div>
              <Rich text={s.work} />
            </div>
          </li>
        ))}
      </ol>
      {done ? (
        <div className="answer">
          <Sparkles size={18} />
          <Rich text={example.answer} />
        </div>
      ) : (
        <div className="row reveal-btn">
          <button className="btn soft small" onClick={() => setShown((n) => n + 1)}>
            <Eye size={16} /> Next step
          </button>
          <button className="btn ghost small" onClick={() => setShown(example.steps.length)}>
            Show all
          </button>
        </div>
      )}
    </article>
  );
}
