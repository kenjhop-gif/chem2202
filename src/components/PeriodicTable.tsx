import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ELEMENTS, gridPosition, type Element } from '../data/elements';

const NATURAL_WIDTH = 1100;

/** The full periodic chart with a detail card for the selected element. */
export function PeriodicTable() {
  const [selected, setSelected] = useState<Element | null>(null);
  // Scale the chart down to fit the available width, so the whole table shows without scrolling.
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>();
  const [zoomed, setZoomed] = useState(false);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const update = () => {
      // Use the chart's real width (cells have a minimum size) so nothing is clipped.
      const natural = Math.max(NATURAL_WIDTH, inner.scrollWidth);
      const s = zoomed ? 1 : Math.min(1, (wrap.clientWidth - 2) / natural);
      setScale(s);
      setHeight(inner.offsetHeight * s);
    };
    // Re-measure shortly after: changing the height can add a page scrollbar, which narrows the space again.
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 30);
    };
    update();
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    window.addEventListener('resize', schedule);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [zoomed]);

  return (
    <div className="sec-u1">
      {(scale < 0.75 || zoomed) && (
        <button className="btn small ghost" style={{ marginBottom: 8 }} onClick={() => setZoomed((z) => !z)}>
          {zoomed ? 'Fit to screen' : 'Zoom in (scroll sideways)'}
        </button>
      )}
      <div ref={wrapRef} className={zoomed ? 'pt-scroll' : 'pt-fit'} style={{ height: zoomed ? undefined : height }}>
        <div
          ref={innerRef}
          className="pt"
          style={zoomed ? undefined : { width: NATURAL_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
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
                <span className={`nm${el.name.length > 11 ? " long xlong" : el.name.length > 9 ? " long" : ""}`}>{el.name}</span>
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
