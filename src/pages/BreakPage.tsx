import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const OPTIONS = [1, 3, 5];

export function BreakPage() {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(3);
  const [left, setLeft] = useState(minutes * 60);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    setLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Matches the 10 s breathe animation: ~4 s in, ~1 s hold, ~5 s out.
  useEffect(() => {
    let inhale = true;
    setPhase('in');
    const t = setInterval(() => {
      inhale = !inhale;
      setPhase(inhale ? 'in' : 'out');
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="break-page">
      <div style={{ maxWidth: 520 }}>
        <span className="pill neutral">Take a break</span>
        <h1 style={{ marginTop: 14 }}>Breathe. You’re doing fine.</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Stepping away for a few minutes helps your brain file away what you just practised. Follow the circle.
        </p>
        <div className="breath" aria-hidden="true">
          <div className="ring" />
          <div className="orb" />
        </div>
        <div className="breath-label" aria-live="polite">
          {left === 0 ? 'Ready when you are.' : phase === 'in' ? 'Breathe in…' : 'Breathe out…'}
        </div>
        <p style={{ fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 10 }}>
          {mm}:{ss}
        </p>
        <div className="segmented" style={{ marginTop: 16 }} role="group" aria-label="Break length">
          {OPTIONS.map((m) => (
            <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <button className="btn primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> I’m ready, take me back
          </button>
        </div>
      </div>
    </div>
  );
}
