import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ELEMENTS, gridPosition, type Element } from '../data/elements';

/** The full periodic chart with a detail card for the selected element. */
export function PeriodicTable() {
  const [selected, setSelected] = useState<Element | null>(null);
  return (
    <div className="sec-u1">
      <div className="pt-scroll">
        <div className="pt">
          {ELEMENTS.map((el) => {
            const { row, col } = gridPosition(el.z);
            return (
              <button
                key={el.z}
                className={`pt-cell ${el.state}`}
                style={{ gridRow: row, gridColumn: col }}
                aria-pressed={selected?.z === el.z}
                onClick={() => setSelected(el)}
                title={`${el.name}: ${el.mass} g/mol`}
              >
                <span>{el.z}</span>
                <span className="sym">{el.symbol}</span>
                <span className="m">{el.massEstimated ? `(${el.mass})` : el.mass.toFixed(2)}</span>
              </button>
            );
          })}
          <div className="pt-gap" style={{ gridRow: 8 }} />
        </div>
      </div>

      <div className="pt-legend">
        <span><i style={{ background: 'var(--surface-2)' }} />Solid</span>
        <span><i style={{ background: 'color-mix(in srgb, var(--sec-u1) 16%, var(--surface))' }} />Liquid</span>
        <span><i style={{ background: 'color-mix(in srgb, var(--sec-u2) 14%, var(--surface))' }} />Gas</span>
        <span>(Brackets) = most stable isotope</span>
        <span className="tiny">Scroll sideways on a phone →</span>
      </div>

      {selected ? (
        <div className="pt-detail">
          <div className="big">{selected.symbol}</div>
          <div>
            <h3 style={{ textTransform: 'capitalize' }}>{selected.name}</h3>
            <p className="muted">
              Atomic number <b>{selected.z}</b> · Molar mass{' '}
              <b>{selected.massEstimated ? `(${selected.mass})` : selected.mass.toFixed(2)} g/mol</b>
            </p>
            <p className="muted">
              Electronegativity <b>{selected.electronegativity ?? '–'}</b> · Ion charge
              {selected.charges.length > 1 ? 's' : ''} <b>{selected.charges.join(', ') || '–'}</b> ·{' '}
              <span style={{ textTransform: 'capitalize' }}>{selected.state}</span> at room temperature
            </p>
          </div>
        </div>
      ) : (
        <p className="tiny" style={{ marginTop: 16 }}>
          Tap an element for details. Molar mass is the number with two decimals; the whole number is the atomic number.
        </p>
      )}
    </div>
  );
}

/** The chart in a pop-up sheet (opened from the header). */
export function PeriodicTableSheet({ onClose }: { onClose(): void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Periodic chart">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div>
            <h2>Periodic chart</h2>
            <p className="tiny">Values from the NL Periodic Chart of the Elements (2019‑20).</p>
          </div>
          <div className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <PeriodicTable />
      </div>
    </div>
  );
}
