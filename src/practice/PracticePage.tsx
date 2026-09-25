import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coffee,
  Eye,
  Footprints,
  Lightbulb,
  PartyPopper,
  RotateCcw,
  Rocket,
  SkipForward,
  Sparkles,
  X,
} from 'lucide-react';
import { TOPIC_CONTENT } from '../content/registry';
import { TOPIC_META } from '../content/curriculum';
import type { AnswerSpec, Question, Step } from '../content/types';
import { checkAnswer, formatAnswer, type CheckResult, type Response } from '../engine/check';
import { createRng, randomSeed } from '../engine/rng';
import { AnswerInput } from './AnswerInput';
import { Rich } from '../components/Rich';
import { progressStore } from '../progress/store';
import { savePrefs, type PracticeMode } from '../progress/prefs';

interface StepState {
  tries: number;
  hints: number;
  revealed: boolean;
  done: boolean;
  result: CheckResult | null;
  wrongChoice: number | null;
}

const freshStep = (): StepState => ({ tries: 0, hints: 0, revealed: false, done: false, result: null, wrongChoice: null });

interface QuestionOutcome {
  hints: number;
  retries: number;
  revealed: number;
  completed: boolean;
}

export function PracticePage() {
  const { topicId = '' } = useParams();
  const [params] = useSearchParams();
  const topic = TOPIC_CONTENT[topicId];
  const [mode, setMode] = useState<PracticeMode>((params.get('mode') as PracticeMode) ?? 'steps');
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<QuestionOutcome[]>([]);
  const seeds = useMemo(() => topic?.practice.map(() => randomSeed()) ?? [], [topic, round]);

  if (!topic) return <Navigate to="/" replace />;
  const meta = TOPIC_META[topicId];
  const total = topic.practice.length;
  const finished = index >= total;

  const onDone = (o: QuestionOutcome) => setOutcomes((list) => [...list, o]);
  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setOutcomes([]);
  };
  const changeMode = (m: PracticeMode) => {
    setMode(m);
    savePrefs({ practiceMode: m });
  };

  return (
    <div className={`sec-${meta.section}`}>
      <div className="container narrow">
        <div className="practice-top">
          <Link to={`/topic/${topicId}?tab=practice`} className="crumb">
            <ArrowLeft size={16} /> {meta.title}
          </Link>
          <div className="spacer" />
          <Link to="/break" className="btn ghost small">
            <Coffee size={16} /> Break
          </Link>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="dots" aria-label={`Question ${Math.min(index + 1, total)} of ${total}`}>
            {topic.practice.map((_, i) => (
              <span key={i} className={i < index ? 'done' : i === index ? 'current' : ''} />
            ))}
          </div>
          <div className="spacer" />
          {!finished && (
            <div className="segmented" role="group" aria-label="Practice mode">
              <button aria-pressed={mode === 'steps'} onClick={() => changeMode('steps')}>
                <Footprints size={15} /> Walk me through
              </button>
              <button aria-pressed={mode === 'try'} onClick={() => changeMode('try')}>
                <Rocket size={15} /> Try first
              </button>
            </div>
          )}
        </div>

        {finished ? (
          <Summary outcomes={outcomes} onRestart={restart} topicId={topicId} />
        ) : (
          <QuestionRunner
            key={`${round}-${index}`}
            topicId={topicId}
            templateIndex={index}
            seed={seeds[index]}
            mode={mode}
            number={index + 1}
            total={total}
            onDone={onDone}
            onNext={() => setIndex((i) => i + 1)}
          />
        )}
      </div>
    </div>
  );
}

interface RunnerProps {
  topicId: string;
  templateIndex: number;
  seed: number;
  mode: PracticeMode;
  number: number;
  total: number;
  onDone(o: QuestionOutcome): void;
  onNext(): void;
}

function QuestionRunner({ topicId, templateIndex, seed, mode, number, total, onDone, onNext }: RunnerProps) {
  const template = TOPIC_CONTENT[topicId].practice[templateIndex];
  const question: Question = useMemo(() => template.generate(createRng(seed)), [template, seed]);
  const startedAt = useRef(Date.now());
  const startMode = useRef(mode);

  const [qMode, setQMode] = useState<PracticeMode>(mode);
  const [switched, setSwitched] = useState(false);
  const [steps, setSteps] = useState<StepState[]>(() => question.steps.map(freshStep));
  const [tryState, setTryState] = useState({ tries: 0, result: null as CheckResult | null, done: false, wrongChoice: null as number | null });
  const [recorded, setRecorded] = useState(false);

  // Follow the mode toggle until the student has started on this question.
  const untouched = !switched && tryState.tries === 0 && steps.every((s) => s.tries === 0 && s.hints === 0 && !s.done);
  useEffect(() => {
    if (untouched) {
      setQMode(mode);
      startMode.current = mode;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const activeStep = steps.findIndex((s) => !s.done);
  const stepsComplete = activeStep === -1;
  const complete = qMode === 'try' ? tryState.done : stepsComplete;

  const finish = (completed: boolean) => {
    if (recorded) return;
    setRecorded(true);
    const outcome: QuestionOutcome = {
      hints: steps.reduce((a, s) => a + s.hints, 0),
      retries: steps.reduce((a, s) => a + s.tries, 0) + tryState.tries,
      revealed: steps.filter((s) => s.revealed).length,
      completed,
    };
    onDone(outcome);
    progressStore.add({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topicId,
      templateId: template.id,
      skill: template.skill,
      mode: startMode.current,
      switchedToSteps: switched,
      ...outcome,
      startedAt: startedAt.current,
      finishedAt: Date.now(),
    });
  };

  useEffect(() => {
    if (complete) finish(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const updateStep = (i: number, patch: Partial<StepState>) =>
    setSteps((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const submitStep = (i: number, response: Response) => {
    const step = question.steps[i];
    const result = checkAnswer(step.answer, response, step.mistakes);
    const s = steps[i];
    if (result.status === 'correct') updateStep(i, { done: true, result });
    else if (result.status === 'incorrect')
      updateStep(i, { tries: s.tries + 1, result, wrongChoice: response.kind === 'choice' ? response.index : null });
    else updateStep(i, { result });
  };

  const lastStep = question.steps[question.steps.length - 1];
  const submitTry = (response: Response) => {
    const result = checkAnswer(lastStep.answer, response, [...(question.finalMistakes ?? []), ...(lastStep.mistakes ?? [])]);
    if (result.status === 'correct') setTryState((t) => ({ ...t, result, done: true }));
    else if (result.status === 'incorrect')
      setTryState((t) => ({ ...t, tries: t.tries + 1, result, wrongChoice: response.kind === 'choice' ? response.index : null }));
    else setTryState((t) => ({ ...t, result }));
  };

  const breakItDown = () => {
    setQMode('steps');
    setSwitched(true);
  };

  const skip = () => {
    finish(false);
    onNext();
  };

  return (
    <article className="card q-card">
      <div className="q-label">
        Question {number} of {total} · {template.skill}
      </div>
      <Rich as="p" className="q-prompt" text={question.prompt} />

      {qMode === 'try' ? (
        <div className="steps">
          <div className={`step ${tryState.done ? 'done' : 'active'}`}>
            <div className="step-head">
              <span className="step-num">{tryState.done ? <Check size={15} /> : <Rocket size={14} />}</span>
              <div className="step-prompt">Your final answer</div>
            </div>
            {!tryState.done && (
              <div className="step-body">
                <AnswerInput
                  spec={lastStep.answer}
                  onSubmit={submitTry}
                  missCount={tryState.tries}
                  wrongChoice={tryState.wrongChoice}
                />
                <FeedbackView result={tryState.result} />
                <div className="step-actions">
                  <button className={`btn small ${tryState.tries >= 1 ? 'soft' : 'ghost'}`} onClick={breakItDown}>
                    <Footprints size={16} /> Break it down into steps
                  </button>
                </div>
              </div>
            )}
            {tryState.done && (
              <div className="step-body">
                <FeedbackView result={tryState.result} />
                <FullSolution steps={question.steps} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="steps">
          {switched && (
            <div className="feedback note">
              <Footprints size={18} /> Let’s break it down. One small step at a time.
            </div>
          )}
          {question.steps.map((step, i) =>
            i > (stepsComplete ? question.steps.length : activeStep) ? null : (
              <StepCard
                key={i}
                step={step}
                index={i}
                state={steps[i]}
                active={i === activeStep}
                onSubmit={(r) => submitStep(i, r)}
                onHint={() => updateStep(i, { hints: steps[i].hints + 1 })}
                onReveal={() => updateStep(i, { revealed: true, done: true, result: null })}
              />
            ),
          )}
        </div>
      )}

      <div className="next-bar">
        {!complete && (
          <button className="btn ghost small" onClick={skip}>
            <SkipForward size={16} /> Skip
          </button>
        )}
        {complete && <NextButton label={number === total ? 'Finish' : 'Next question'} onClick={onNext} />}
      </div>
    </article>
  );
}

/**
 * Focuses itself after a short delay, so the Enter press that submitted the answer
 * doesn't also skip past the explanation.
 */
function NextButton({ label, onClick }: { label: string; onClick(): void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setArmed(true);
      ref.current?.focus({ preventScroll: true });
    }, 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <button ref={ref} className="btn primary" onClick={() => armed && onClick()}>
      {label} <ArrowRight size={18} />
    </button>
  );
}

function StepCard({
  step,
  index,
  state,
  active,
  onSubmit,
  onHint,
  onReveal,
}: {
  step: Step;
  index: number;
  state: StepState;
  active: boolean;
  onSubmit(r: Response): void;
  onHint(): void;
  onReveal(): void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && index > 0) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active, index]);

  const hintsLeft = state.hints < step.hints.length;
  const pulse = state.tries >= 2;
  const cls = ['step', state.done ? 'done' : '', active ? 'active' : '', state.revealed ? 'revealed' : ''].join(' ');

  return (
    <div className={cls} ref={ref}>
      <div className="step-head">
        <span className="step-num">{state.done ? state.revealed ? <Eye size={14} /> : <Check size={15} /> : index + 1}</span>
        <Rich as="div" className="step-prompt" text={step.prompt} />
      </div>

      {active && (
        <div className="step-body">
          <AnswerInput spec={step.answer} onSubmit={onSubmit} missCount={state.tries} wrongChoice={state.wrongChoice} />
          <FeedbackView result={state.result} />
          {state.hints > 0 && (
            <div className="hint-list">
              {step.hints.slice(0, state.hints).map((h, i) => (
                <div key={i} className="hint">
                  <span className="lvl">Hint {i + 1}</span>
                  <Rich text={h} />
                </div>
              ))}
            </div>
          )}
          <div className="step-actions">
            {hintsLeft ? (
              <button className={`btn small${pulse ? ' pulse' : ''}`} onClick={onHint}>
                <Lightbulb size={16} /> {state.hints === 0 ? 'Hint' : 'Another hint'}
              </button>
            ) : (
              <button className={`btn small${pulse ? ' pulse' : ''}`} onClick={onReveal}>
                <Eye size={16} /> Show me
              </button>
            )}
          </div>
        </div>
      )}

      {state.done && (
        <div className="step-explain">
          {state.revealed && (
            <p style={{ marginBottom: 4 }}>
              Answer: <b><Rich text={answerText(step.answer)} /></b>
            </p>
          )}
          {state.result?.note && (
            <div className="feedback note" style={{ margin: '0 0 8px' }}>
              <Sparkles size={16} /> <Rich text={state.result.note} />
            </div>
          )}
          <Rich text={step.explain} />
        </div>
      )}
    </div>
  );
}

function answerText(spec: AnswerSpec): string {
  if (spec.kind === 'numeric') return `${formatAnswer(spec)}${spec.unit ? ` ${spec.unit}` : ''}`;
  if (spec.kind === 'choice') return spec.options[spec.correct];
  if (spec.kind === 'name') return spec.accepted[0];
  return `[[${spec.formula}]]`;
}

function FeedbackView({ result }: { result: CheckResult | null }) {
  if (!result) return null;
  if (result.status === 'correct') {
    return (
      <>
        <div className="feedback good">
          <Check size={18} /> <span>Nice work!</span>
        </div>
        {result.note && (
          <div className="feedback note">
            <Sparkles size={18} /> <Rich text={result.note} />
          </div>
        )}
      </>
    );
  }
  return (
    <div className={`feedback ${result.status === 'invalid' ? 'note' : 'miss'}`} key={result.message}>
      {result.status === 'invalid' ? <Lightbulb size={18} /> : <X size={18} />}
      <Rich text={result.message ?? 'Not quite.'} />
    </div>
  );
}

function FullSolution({ steps }: { steps: Step[] }) {
  return (
    <div className="solution">
      <b>Full solution</b>
      <ol>
        {steps.map((s, i) => (
          <li key={i}>
            <Rich text={s.explain} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Summary({ outcomes, onRestart, topicId }: { outcomes: QuestionOutcome[]; onRestart(): void; topicId: string }) {
  const done = outcomes.filter((o) => o.completed);
  const clean = done.filter((o) => o.hints === 0 && o.revealed === 0);
  const hints = outcomes.reduce((a, o) => a + o.hints, 0);
  return (
    <div className="card celebrate">
      <div className="big">
        <PartyPopper size={52} color="var(--accent)" />
      </div>
      <h2 style={{ marginTop: 14 }}>Set complete!</h2>
      <p className="muted" style={{ marginTop: 6 }}>
        Every question you worked through is practice that sticks, hints included.
      </p>
      <div className="stat-row">
        <div className="stat">
          <b>{done.length}</b>
          <span>questions worked through</span>
        </div>
        <div className="stat">
          <b>{clean.length}</b>
          <span>solved without hints</span>
        </div>
        <div className="stat">
          <b>{hints}</b>
          <span>hints used</span>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={onRestart}>
          <RotateCcw size={18} /> Practise again with new numbers
        </button>
        <Link className="btn" to={`/topic/${topicId}`}>
          Back to topic
        </Link>
      </div>
    </div>
  );
}
