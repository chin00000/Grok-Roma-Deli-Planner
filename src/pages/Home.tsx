import { AlertTriangle } from 'lucide-react';
import { computeModel } from '../calc/model';
import { Donut, PayoffChart, StackBar } from '../components/Charts';
import { money, monthsLabel, percent } from '../format';
import type { AppState, Preview } from '../types';

function Switch({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="toggle">
      <span>{label}</span>
      <button type="button" className={`switch${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
        <i />
      </button>
    </div>
  );
}

export function Home({
  state,
  preview,
  setPreview,
}: {
  state: AppState;
  preview: Preview;
  setPreview: (p: Preview) => void;
}) {
  const model = computeModel(state, preview);
  const a = model.partners[0];
  const b = model.partners[1];

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Whole business</h1>
          <p>
            Ten-second view of every unit that is currently on. Toggles below are preview-only and
            never write to saved data.
          </p>
        </div>
      </div>

      <div className="banner" role="status">
        <AlertTriangle size={16} />
        <span>
          Preview only — Wine / Catering / owner salaries / covers change this screen, not the
          database. Persisted unit switches live in Settings.
        </span>
      </div>

      <details open>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 10 }}>
          Scenario preview
        </summary>
        <div className="preview-panel">
          <Switch
            label="Wine bar"
            on={preview.wineOn}
            onClick={() => setPreview({ ...preview, wineOn: !preview.wineOn })}
          />
          <Switch
            label="Catering"
            on={preview.cateringOn}
            onClick={() => setPreview({ ...preview, cateringOn: !preview.cateringOn })}
          />
          <Switch
            label="Owner 1 salary"
            on={preview.includeOwner1Salary}
            onClick={() => setPreview({ ...preview, includeOwner1Salary: !preview.includeOwner1Salary })}
          />
          <Switch
            label="Owner 2 salary"
            on={preview.includeOwner2Salary}
            onClick={() => setPreview({ ...preview, includeOwner2Salary: !preview.includeOwner2Salary })}
          />
          <label className="field">
            <span>Cafe covers / day</span>
            <input
              type="number"
              value={preview.cafeCovers}
              min={0}
              onChange={(e) => setPreview({ ...preview, cafeCovers: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span>Wine covers / night</span>
            <input
              type="number"
              value={preview.wineCovers}
              min={0}
              onChange={(e) => setPreview({ ...preview, wineCovers: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span>Meals / day</span>
            <input
              type="number"
              value={preview.mealsPerDay}
              min={0}
              onChange={(e) => setPreview({ ...preview, mealsPerDay: Number(e.target.value) })}
            />
          </label>
        </div>
      </details>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card">
          <h3>Revenue / mo</h3>
          <div className="kpi">{money(model.revenue)}</div>
          <div className="kpi-sub">Active units only</div>
        </div>
        <div className="card">
          <h3>Contribution vs fixed</h3>
          <div className="kpi">{money(model.contribution)}</div>
          <div className="kpi-sub">Fixed {money(model.fixedTotal)} · OP {money(model.operatingProfit)}</div>
        </div>
        <div className="card">
          <h3>Labour vs sales</h3>
          <div className="kpi">{percent(model.labourToSales, true)}</div>
          <div className="kpi-sub">Loaded labour {money(model.labourMonthly)} · prime cost {percent(model.primeCostPct)}</div>
        </div>
        <div className="card">
          <h3>Cash after debt</h3>
          <div className={`kpi ${model.cashAfterDebt < 0 ? 'neg' : 'pos'}`}>{money(model.cashAfterDebt)}</div>
          <div className="kpi-sub">After drawings {money(model.cashAfterDebtAndDrawings)}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h3>Revenue mix</h3>
          <Donut
            parts={model.streams.map((s, i) => ({
              label: s.name,
              value: s.revenue,
              color: ['#5f6e3d', '#c4a574', '#8c7a62'][i],
            }))}
          />
        </div>
        <div className="card">
          <h3>Contribution vs fixed</h3>
          <StackBar
            parts={[
              { label: 'Contribution', value: Math.max(0, model.contribution), color: '#5f6e3d' },
              { label: 'Fixed', value: model.fixedTotal, color: '#c4a574' },
            ]}
          />
          <div className="kpi-sub" style={{ marginTop: 12 }}>
            Break-even cafe covers / day:{' '}
            {model.breakEvenCafeCoversPerDay === null
              ? '—'
              : model.breakEvenCafeCoversPerDay.toLocaleString('en-AU', { maximumFractionDigits: 1 })}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h3>Partner split</h3>
          <StackBar
            parts={model.partners.map((p, i) => ({
              label: `${p.name} ${p.sharePct}%`,
              value: p.startupShare,
              color: i === 0 ? '#5f6e3d' : '#c4a574',
            }))}
          />
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            {model.partners.map((p) => (
              <div key={p.id}>
                <div className="muted">{p.name}</div>
                <div className="kpi" style={{ fontSize: 22 }}>{money(p.profitShare)}</div>
                <div className="kpi-sub">Share of operating profit / mo</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Payback timeline</h3>
          <PayoffChart
            series={model.partners.map((p) => ({
              name: p.name,
              points: p.amort.rows.map((r) => ({ month: r.month, closing: r.closing })),
            }))}
            colors={['#5f6e3d', '#c4a574']}
          />
          <div className="legend">
            {a && (
              <span>
                {a.name}: {monthsLabel(a.amort.monthsToClear)} · interest {money(a.amort.totalInterest)}
              </span>
            )}
            {b && (
              <span>
                {b.name}: {monthsLabel(b.amort.monthsToClear)} · interest {money(b.amort.totalInterest)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Unit snapshot</h3>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th className="num">Revenue</th>
                <th className="num">COGS</th>
                <th className="num">Labour</th>
                <th className="num">Contribution</th>
                <th className="num">Fixed</th>
                <th className="num">Operating profit</th>
              </tr>
            </thead>
            <tbody>
              {model.streams.map((s) => (
                <tr key={s.id} style={{ opacity: s.on ? 1 : 0.45 }}>
                  <td>
                    {s.name} {s.on ? '' : '(off)'}
                  </td>
                  <td className="num">{money(s.revenue)}</td>
                  <td className="num">{money(s.cogs)}</td>
                  <td className="num">{money(s.labour)}</td>
                  <td className="num">{money(s.contribution)}</td>
                  <td className="num">{money(s.extraFixed)}</td>
                  <td className="num">{money(s.operatingProfit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{money(model.revenue)}</td>
                <td className="num">{money(model.cogs)}</td>
                <td className="num">{money(model.labourMonthly)}</td>
                <td className="num">{money(model.contribution)}</td>
                <td className="num">{money(model.fixedTotal)}</td>
                <td className="num">{money(model.operatingProfit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
