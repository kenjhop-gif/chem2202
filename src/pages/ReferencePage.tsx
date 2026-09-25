import { useSearchParams } from 'react-router-dom';
import { Beaker, Calculator, Droplets, Grid3x3 } from 'lucide-react';
import { PeriodicTable } from '../components/PeriodicTable';
import { Rich } from '../components/Rich';
import { AMMONIUM, POLYATOMIC_ANIONS, ionText } from '../content/ions';

const SECTIONS = [
  { id: 'chart', label: 'Periodic chart', icon: Grid3x3 },
  { id: 'data', label: 'Constants and formulas', icon: Calculator },
  { id: 'solubility', label: 'Solubility table', icon: Droplets },
  { id: 'ions', label: 'Polyatomic ions', icon: Beaker },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

const FORMULAS: [string, string][] = [
  ['n = m ÷ M', 'moles from mass'],
  ['n = N ÷ N_{A}', 'moles from number of particles'],
  ['C = n ÷ V', 'molar concentration (mol/L)'],
  ['n = V ÷ V_{STP}', 'moles of gas at STP'],
  ['C_{1}V_{1} = C_{2}V_{2}', 'dilution'],
  ['% yield = (actual ÷ theoretical) × 100%', 'percent yield'],
  ['%m/v = (m_{solute} ÷ V_{solution}) × 100%', 'mass/volume percent'],
  ['%v/v = (V_{solute} ÷ V_{solution}) × 100%', 'volume/volume percent'],
  ['ppm = (m_{solute} ÷ m_{solution}) × 10^{6}', 'parts per million'],
  ['ppb = (m_{solute} ÷ m_{solution}) × 10^{9}', 'parts per billion'],
];

const SOLUBILITY: [string, string, string][] = [
  ['Group 1, NH_{4}^{+}, H^{+} (H_{3}O^{+})', 'all', 'none'],
  ['ClO_{3}^{−}, NO_{3}^{−}, ClO_{4}^{−}', 'all', 'none'],
  ['Cl^{−}, Br^{−}, I^{−}', 'most', 'Ag^{+}, Tl^{+}, Hg_{2}^{2+}, Hg^{+}, Cu^{+}, Pb^{2+}'],
  ['CH_{3}COO^{−}', 'most', 'Ag^{+}, Hg^{+}'],
  ['SO_{4}^{2−}', 'most', 'Ca^{2+}, Sr^{2+}, Ba^{2+}, Ra^{2+}, Pb^{2+}, Ag^{+}'],
  ['S^{2−}', 'group 1, group 2, NH_{4}^{+}', 'most'],
  ['OH^{−}', 'group 1, NH_{4}^{+}, Sr^{2+}, Ba^{2+}, Tl^{+}', 'most'],
  ['PO_{4}^{3−}, SO_{3}^{2−}, CO_{3}^{2−}', 'group 1, NH_{4}^{+}', 'most'],
];

export function ReferencePage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('show') as SectionId) ?? 'chart';

  return (
    <div className="container" style={{ padding: '32px 20px 64px' }}>
      <h1>Reference</h1>
      <p className="muted" style={{ marginTop: 6 }}>Matches the NL Chemistry 2202 periodic chart and data table.</p>

      <div className="tabs" role="tablist" style={{ marginTop: 20 }}>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setParams({ show: id }, { replace: true })}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="tab-panel" key={tab}>
        {tab === 'chart' && (
          <div className="card pad">
            <PeriodicTable />
          </div>
        )}

        {tab === 'data' && (
          <div className="stack" style={{ gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-head">
                <h3>Constants</h3>
              </div>
              <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
                <table className="nice">
                  <tbody>
                    <tr>
                      <td>Avogadro’s number</td>
                      <td>
                        <Rich text="N_{A}" />
                      </td>
                      <td>
                        <Rich text="**6.022 × 10^{23}** particles/mol" />
                      </td>
                    </tr>
                    <tr>
                      <td>Standard temperature and pressure</td>
                      <td>STP</td>
                      <td>
                        <b>0.00 °C</b> and <b>100.0 kPa</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Molar volume of a gas at STP</td>
                      <td>
                        <Rich text="V_{STP}" />
                      </td>
                      <td>
                        <b>22.7 L/mol</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-head">
                <h3>Formulas</h3>
              </div>
              <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
                <table className="nice">
                  <tbody>
                    {FORMULAS.map(([eq, what]) => (
                      <tr key={eq}>
                        <td style={{ fontWeight: 600 }}>
                          <Rich text={eq} />
                        </td>
                        <td className="muted">{what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'solubility' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <h3>Solubility of ionic compounds in water at 25 °C</h3>
              <p className="tiny">High solubility (aq): more than 0.1 mol/L. Low solubility (s): less than 0.1 mol/L.</p>
            </div>
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table className="nice">
                <thead>
                  <tr>
                    <th>Ion</th>
                    <th>High solubility (aq)</th>
                    <th>Low solubility (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {SOLUBILITY.map(([ion, hi, lo]) => (
                    <tr key={ion}>
                      <td style={{ fontWeight: 600 }}>
                        <Rich text={ion} />
                      </td>
                      <td>
                        <Rich text={hi} />
                      </td>
                      <td>
                        <Rich text={lo} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ions' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <h3>Common polyatomic ions</h3>
            </div>
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table className="nice">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Ion</th>
                  </tr>
                </thead>
                <tbody>
                  {[AMMONIUM, ...POLYATOMIC_ANIONS].map((ion) => (
                    <tr key={ion.formula}>
                      <td>{ion.name}</td>
                      <td>
                        <Rich text={ionText(ion)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
