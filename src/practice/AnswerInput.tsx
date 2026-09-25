import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { AnswerSpec } from '../content/types';
import type { Response } from '../engine/check';
import { parseNumber, formatSig } from '../engine/numeric';
import { Formula, Rich } from '../components/Rich';
import { tryParseFormula } from '../engine/formula';
import { elementsIn, tally } from '../engine/balance';

interface Props {
  spec: AnswerSpec;
  onSubmit(response: Response): void;
  /** Changes to trigger the shake animation after a miss. */
  missCount: number;
  /** Choice index flagged as wrong by the last check. */
  wrongChoice?: number | null;
}

export function AnswerInput(props: Props) {
  switch (props.spec.kind) {
    case 'numeric':
      return <NumericInput {...props} spec={props.spec} />;
    case 'choice':
      return <ChoiceInput {...props} spec={props.spec} />;
    case 'formula':
      return <FormulaInput {...props} />;
    case 'name':
      return <NameInput {...props} />;
    case 'balance':
      return <BalanceInput {...props} spec={props.spec} />;
  }
}

function BalanceInput({ spec, onSubmit }: Props & { spec: Extract<AnswerSpec, { kind: 'balance' }> }) {
  const all = [...spec.reactants, ...spec.products];
  const [vals, setVals] = useState<string[]>(all.map(() => ''));
  const [showCounter, setShowCounter] = useState(true);
  const coef = vals.map((v) => (v.trim() === '' ? 1 : Number(v)));
  const valid = coef.every((c) => Number.isInteger(c) && c >= 1);
  const left = valid ? tally(spec.reactants, coef.slice(0, spec.reactants.length)) : {};
  const right = valid ? tally(spec.products, coef.slice(spec.reactants.length)) : {};
  const els = elementsIn(all);
  const submit = () => onSubmit({ kind: 'balance', coefficients: vals.map((v) => (v.trim() === '' ? null : Number(v))) });

  const box = (i: number) => (
    <input
      key={i}
      className="coef-input"
      inputMode="numeric"
      aria-label={`Coefficient for ${all[i]}`}
      placeholder="1"
      value={vals[i]}
      onChange={(e) => setVals((vs) => vs.map((v, j) => (j === i ? e.target.value.replace(/[^0-9]/g, '') : v)))}
      onKeyDown={(e) => e.key === 'Enter' && submit()}
      autoFocus={i === 0}
    />
  );

  return (
    <div>
      <div className="equation-row">
        {all.map((f, i) => (
          <span key={i} className="eq-term">
            {i > 0 && <span className="eq-op">{i === spec.reactants.length ? '→' : '+'}</span>}
            {box(i)}
            <Formula formula={f} />
          </span>
        ))}
      </div>
      {showCounter && valid && (
        <table className="atom-counter">
          <thead>
            <tr>
              <th>Atom</th>
              <th>Left</th>
              <th>Right</th>
            </tr>
          </thead>
          <tbody>
            {els.map((el) => {
              const ok = (left[el] ?? 0) === (right[el] ?? 0);
              return (
                <tr key={el} className={ok ? 'ok' : 'off'}>
                  <td>{el}</td>
                  <td>{left[el] ?? 0}</td>
                  <td>
                    {right[el] ?? 0} {ok ? '✓' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="step-actions">
        <CheckButton onClick={submit} />
        <button className="btn small ghost" onClick={() => setShowCounter((s) => !s)}>
          {showCounter ? 'Hide atom counter' : 'Show atom counter'}
        </button>
      </div>
    </div>
  );
}

function NameInput({ onSubmit, missCount }: Props) {
  const [text, setText] = useState('');
  const submit = () => onSubmit({ kind: 'name', text });
  return (
    <div className="answer-row">
      <input
        key={missCount}
        className={`input${missCount ? ' shake' : ''}`}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="e.g. iron(III) chloride"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        aria-label="Name"
        autoFocus
        style={{ fontWeight: 500 }}
      />
      <CheckButton onClick={submit} />
    </div>
  );
}

function CheckButton({ onClick, label = 'Check' }: { onClick(): void; label?: string }) {
  return (
    <button className="btn primary" onClick={onClick}>
      {label} <ArrowRight size={18} />
    </button>
  );
}

function NumericInput({ spec, onSubmit, missCount }: Props & { spec: Extract<AnswerSpec, { kind: 'numeric' }> }) {
  const [text, setText] = useState('');
  const [unit, setUnit] = useState<string | undefined>();
  const ref = useRef<HTMLInputElement>(null);
  const parsed = parseNumber(text);
  const looksScientific = /[eE×xX*^]|10\^/.test(text);

  // Where the caret should land after a helper key inserts text (applied once React has re-rendered).
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && pendingCaret.current !== null) {
      el.focus();
      el.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [text]);

  const insert = (s: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    pendingCaret.current = start + s.length;
    setText(text.slice(0, start) + s + text.slice(end));
  };

  const submit = () => onSubmit({ kind: 'numeric', text, unit: spec.unitChoices ? unit : spec.unit });

  return (
    <div>
      <div className="answer-row">
        <input
          ref={ref}
          key={missCount}
          className={`input${missCount ? ' shake' : ''}`}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={spec.expectScientific ? 'e.g. 3.01e23' : 'Your answer'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          aria-label="Answer"
          autoFocus
        />
        {spec.unit && !spec.unitChoices && (
          <span className="unit-tag">
            <Rich text={spec.unit} />
          </span>
        )}
        <CheckButton onClick={submit} />
      </div>
      {spec.unitChoices && (
        <div className="unit-choices" role="group" aria-label="Unit">
          {spec.unitChoices.map((u) => (
            <button key={u} aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u}
            </button>
          ))}
        </div>
      )}
      {(spec.expectScientific || looksScientific) && (
        <div className="helper-keys">
          <button onMouseDown={keepFocus} onClick={() => insert('×10^')} aria-label="Insert times ten to the power">
            ×10ⁿ
          </button>
          <button onMouseDown={keepFocus} onClick={() => insert('-')} aria-label="Insert minus sign">
            −
          </button>
        </div>
      )}
      {text && (looksScientific || !parsed) && (
        <div className="preview" aria-live="polite">
          {looksScientific && parsed && (
            <>
              Reads as <strong><Rich text={previewSci(parsed.value, parsed.sigFigs)} /></strong>
            </>
          )}
          {!parsed && /\d/.test(text) && <span>Keep typing… e.g. 3.01×10^23 or 3.01e23</span>}
        </div>
      )}
    </div>
  );
}

function previewSci(value: number, sig: number): string {
  return formatSig(value, sig, 1);
}

function ChoiceInput({ spec, onSubmit, wrongChoice }: Props & { spec: Extract<AnswerSpec, { kind: 'choice' }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div>
      <div className="choices">
        {spec.options.map((opt, i) => (
          <button
            key={i}
            className={`choice${wrongChoice === i && picked === i ? ' wrong' : ''}`}
            aria-pressed={picked === i}
            onClick={() => setPicked(i)}
          >
            <span className="radio" />
            <Rich text={opt} />
          </button>
        ))}
      </div>
      <div className="step-actions">
        <CheckButton onClick={() => picked !== null && onSubmit({ kind: 'choice', index: picked })} />
      </div>
    </div>
  );
}

function FormulaInput({ onSubmit, missCount }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const valid = tryParseFormula(text) !== null;
  const insert = (s: string) => {
    setText((t) => t + s);
    ref.current?.focus();
  };
  const submit = () => onSubmit({ kind: 'formula', text });
  return (
    <div>
      <div className="answer-row">
        <input
          ref={ref}
          key={missCount}
          className={`input${missCount ? ' shake' : ''}`}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. Ca(NO3)2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          aria-label="Formula"
          autoFocus
        />
        <CheckButton onClick={submit} />
      </div>
      <div className="helper-keys">
        {['(', ')', '·'].map((k) => (
          <button key={k} onMouseDown={keepFocus} onClick={() => insert(k)}>
            {k}
          </button>
        ))}
      </div>
      <div className="preview" aria-live="polite">
        {text && (
          <>
            Preview <strong><Formula formula={text} /></strong>
            {!valid && <span> · check the symbols and brackets</span>}
          </>
        )}
      </div>
    </div>
  );
}

/** Keeps the text box focused (and the phone keyboard open) when a helper key is tapped. */
function keepFocus(e: { preventDefault(): void }) {
  e.preventDefault();
}
