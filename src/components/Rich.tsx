// Renders content markup: **bold**, *italic*, [[H2O]] formulas, ^{23} superscripts, _{2} subscripts.
import { Fragment, type ReactNode } from 'react';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[\[[^\]]+\]\]|\^\{[^}]*\}|_\{[^}]*\})/g;

export function renderRich(text: string, keyPrefix = 'r'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const tok = m[0];
    const start = m.index!;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={key}>{renderRich(tok.slice(2, -2), key)}</strong>);
    else if (tok.startsWith('*')) out.push(<em key={key}>{renderRich(tok.slice(1, -1), key)}</em>);
    else if (tok.startsWith('[[')) out.push(<Formula key={key} formula={tok.slice(2, -2)} />);
    else if (tok.startsWith('^')) out.push(<sup key={key}>{tok.slice(2, -1)}</sup>);
    else out.push(<sub key={key}>{tok.slice(2, -1)}</sub>);
    last = start + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text, as: Tag = 'span', className }: { text: string; as?: 'span' | 'p' | 'div'; className?: string }) {
  return <Tag className={className}>{renderRich(text)}</Tag>;
}

/** Formula with automatic subscripts: "Ca(NO3)2" -> Ca(NO₃)₂, "CuSO4·5H2O" keeps the 5 full size. */
export function Formula({ formula }: { formula: string }) {
  const parts: ReactNode[] = [];
  // Split off charge markup like ^{2+} first.
  const segments = formula.split(/(\^\{[^}]*\})/);
  let k = 0;
  for (const seg of segments) {
    if (seg.startsWith('^{')) {
      parts.push(<sup key={k++}>{seg.slice(2, -1)}</sup>);
      continue;
    }
    let prev = '';
    for (const m of seg.matchAll(/\d+|[^\d]+/g)) {
      const t = m[0];
      const isNumber = /^\d/.test(t);
      // A number is a subscript when it follows a letter or ")" (not a leading or hydrate coefficient).
      if (isNumber && /[A-Za-z)]$/.test(prev)) parts.push(<sub key={k++}>{t}</sub>);
      else parts.push(<Fragment key={k++}>{t}</Fragment>);
      prev = t;
    }
  }
  return <span className="formula">{parts}</span>;
}
