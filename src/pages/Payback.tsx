import { computeModel } from '../calc/model';
import { applySharePreset, PRESET_30_70, PRESET_50_50 } from '../calc/partners';
import { PayoffChart } from '../components/Charts';
import { money, monthsLabel } from '../format';
import type { AppState, Compounding, Partner } from '../types';

export function Payback({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const model = computeModel(state);

  function patch(id: string, p: Partial<Partner>) {
    setState({
      ...state,
      partners: state.partners.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Payback</h1>
          <p>
            Two parties. Principal defaults to each party’s share of startup. Monthly compounding is
            the default; yearly is the original spreadsheet style.
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => setState({ ...state, partners: applySharePreset(state.partners, PRESET_30_70) })}
          >
            30 / 70
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setState({ ...state, partners: applySharePreset(state.partners, PRESET_50_50) })}
          >
            50 / 50
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <label className="field" style={{ maxWidth: 220 }}>
            <span>Compounding</span>
            <select
              value={state.assumptions.compounding}
              onChange={(e) =>
                setState({
                  ...state,
                  assumptions: { ...state.assumptions, compounding: e.target.value as Compounding },
                })
              }
            >
              <option value="monthly">Monthly (default)</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <div className="muted">Startup after persisted unit toggles: {money(model.startupTotal)}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        {model.partners.map((p, idx) => {
          const raw = state.partners.find((x) => x.id === p.id)!;
          return (
            <div className="card" key={p.id}>
              <input
                style={{ fontFamily: 'var(--serif)', fontSize: 22, border: 0, background: 'transparent' }}
                value={raw.name}
                onChange={(e) => patch(raw.id, { name: e.target.value })}
              />
              <div className="grid grid-2" style={{ marginTop: 10 }}>
                <label className="field">
                  <span>Share %</span>
                  <input type="number" value={raw.sharePct} onChange={(e) => patch(raw.id, { sharePct: Number(e.target.value) })} />
                </label>
                <label className="field">
                  <span>Interest pa</span>
                  <input
                    type="number"
                    step="0.01"
                    value={raw.interestPa}
                    onChange={(e) => patch(raw.id, { interestPa: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Monthly repayment</span>
                  <input
                    type="number"
                    value={raw.monthlyRepayment}
                    onChange={(e) => patch(raw.id, { monthlyRepayment: Number(e.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Principal override</span>
                  <input
                    type="number"
                    placeholder={String(Math.round(p.startupShare))}
                    value={raw.principalOverride ?? ''}
                    onChange={(e) =>
                      patch(raw.id, {
                        principalOverride: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-2" style={{ marginTop: 14 }}>
                <div>
                  <div className="muted">Startup share</div>
                  <div className="kpi" style={{ fontSize: 26 }}>{money(p.startupShare)}</div>
                </div>
                <div>
                  <div className="muted">Time to clear</div>
                  <div className="kpi" style={{ fontSize: 26 }}>{monthsLabel(p.amort.monthsToClear)}</div>
                </div>
                <div>
                  <div className="muted">Total interest</div>
                  <div className="kpi" style={{ fontSize: 22 }}>{money(p.amort.totalInterest)}</div>
                </div>
                <div>
                  <div className="muted">Cash after debt</div>
                  <div className={`kpi ${p.cashAfterDebt < 0 ? 'neg' : 'pos'}`} style={{ fontSize: 22 }}>
                    {money(p.cashAfterDebt)}
                  </div>
                </div>
                <div>
                  <div className="muted">After debt + drawings</div>
                  <div className="kpi" style={{ fontSize: 22 }}>{money(p.cashAfterDebtAndDrawings)}</div>
                </div>
                <div>
                  <div className="muted">Profit share / mo</div>
                  <div className="kpi" style={{ fontSize: 22 }}>{money(p.profitShare)}</div>
                </div>
              </div>
              {idx === 1 && raw.monthlyRepayment === 0 && (
                <p className="notes">Party B repayment is $0 in the seed — set it; it was not invented.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>Dual payoff</h3>
        <PayoffChart
          series={model.partners.map((p) => ({
            name: p.name,
            points: p.amort.rows.map((r) => ({ month: r.month, closing: r.closing })),
          }))}
          colors={['#5f6e3d', '#c4a574']}
        />
        <div className="legend">
          {model.partners.map((p, i) => (
            <span key={p.id}>
              <i className="swatch" style={{ background: i === 0 ? '#5f6e3d' : '#c4a574' }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
