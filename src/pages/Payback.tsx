import { useState, type CSSProperties } from 'react';
import { computeModel } from '../calc/model';
import { applySharePreset, PRESET_70_30, PRESET_50_50 } from '../calc/partners';
import type { Amortisation } from '../calc/loan';
import { Donut, LineChart, PayoffChart } from '../components/Charts';
import { money, monthsLabel } from '../format';
import type { AppState, Compounding, Partner } from '../types';

const PARTNER_COLORS = ['#5f6e3d', '#c4a574'];

function partnerSeries(amort: Amortisation) {
  let cumInterest = 0;
  let cumPrincipal = 0;
  let interestPaid = 0;
  const remaining: { month: number; value: number }[] = [];
  const cumInt: { month: number; value: number }[] = [];
  const cumPrin: { month: number; value: number }[] = [];
  const monthlyInt: { month: number; value: number }[] = [];
  const monthlyRep: { month: number; value: number }[] = [];
  for (const r of amort.rows) {
    const principalPaid = Math.max(0, r.repayment - r.interest);
    cumInterest += r.interest;
    cumPrincipal += principalPaid;
    interestPaid += Math.min(r.repayment, r.interest);
    remaining.push({ month: r.month, value: r.closing });
    cumInt.push({ month: r.month, value: cumInterest });
    cumPrin.push({ month: r.month, value: cumPrincipal });
    monthlyInt.push({ month: r.month, value: r.interest });
    monthlyRep.push({ month: r.month, value: r.repayment });
  }
  const last = amort.rows[amort.rows.length - 1];
  return {
    remaining,
    cumInt,
    cumPrin,
    monthlyInt,
    monthlyRep,
    mix: {
      remaining: last?.closing ?? 0,
      interestPaid,
      principalRepaid: cumPrincipal,
    },
  };
}

export function Payback({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const model = computeModel(state);
  const [selectedId, setSelectedId] = useState(state.partners[0]?.id ?? 'p-a');

  function patch(id: string, p: Partial<Partner>) {
    setState({
      ...state,
      partners: state.partners.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });
  }

  const selected = model.partners.find((p) => p.id === selectedId) ?? model.partners[0];
  if (!selected) {
    return (
      <div className="rise">
        <div className="page-head">
          <h1>Payback</h1>
        </div>
      </div>
    );
  }
  const selectedIdx = Math.max(0, model.partners.findIndex((p) => p.id === selected.id));
  const selectedColor = PARTNER_COLORS[selectedIdx % PARTNER_COLORS.length] ?? '#5f6e3d';
  const charts = partnerSeries(selected.amort);

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Payback</h1>
          <p>
            Two partners. Principal defaults to each partner’s share of startup. Seed is 70/30
            Partner A (Small) / Partner B (Sudy); 50/50 is a preset. Monthly compounding is the
            default; yearly is the original spreadsheet style.
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => setState({ ...state, partners: applySharePreset(state.partners, PRESET_70_30) })}
          >
            70 / 30
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

      <div className="toggle-row">
        <span className="muted">Charts &amp; snapshot</span>
        <div className="seg seg-lg" role="group" aria-label="Selected partner">
          {model.partners.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`${selected.id === p.id ? 'on' : ''} ${i === 1 ? 'tone-b' : ''}`}
              aria-pressed={selected.id === p.id}
              onClick={() => setSelectedId(p.id)}
            >
              {p.name}
            </button>
          ))}
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
        {model.partners.map((p, i) => {
          const raw = state.partners.find((x) => x.id === p.id)!;
          const isSel = p.id === selected.id;
          return (
            <div
              className={`card${isSel ? ' selected' : ''}`}
              key={p.id}
              style={isSel ? ({ '--sel': i === 0 ? 'var(--olive)' : 'var(--tan)' } as CSSProperties) : undefined}
            >
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
              {raw.id === 'p-a' && raw.monthlyRepayment === 0 && (
                <p className="notes">
                  Partner A (Small) repayment is $0 in the seed — set it; it was not invented.
                </p>
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
          colors={[...PARTNER_COLORS]}
        />
        <div className="legend">
          {model.partners.map((p, i) => (
            <span key={p.id}>
              <i className="swatch" style={{ background: PARTNER_COLORS[i % PARTNER_COLORS.length] ?? '#5f6e3d' }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>{selected.name}</h3>
            <div className="grid grid-4" style={{ marginTop: 10 }}>
              <div>
                <div className="muted">Time to clear</div>
                <div className="kpi" style={{ fontSize: 22 }}>{monthsLabel(selected.amort.monthsToClear)}</div>
              </div>
              <div>
                <div className="muted">Remaining</div>
                <div className="kpi" style={{ fontSize: 22 }}>{money(charts.mix.remaining)}</div>
              </div>
              <div>
                <div className="muted">Total interest</div>
                <div className="kpi" style={{ fontSize: 22 }}>{money(selected.amort.totalInterest)}</div>
              </div>
              <div>
                <div className="muted">Cash after debt</div>
                <div className={`kpi ${selected.cashAfterDebt < 0 ? 'neg' : 'pos'}`} style={{ fontSize: 22 }}>
                  {money(selected.cashAfterDebt)}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Remaining balance</h3>
            <LineChart
              series={[{ name: selected.name, points: charts.remaining }]}
              colors={[selectedColor]}
              ariaLabel={`${selected.name} remaining balance`}
            />
            <div className="legend">
              <span>
                <i className="swatch" style={{ background: selectedColor }} />
                Closing balance
              </span>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Cumulative interest vs principal repaid</h3>
              <LineChart
                series={[
                  { name: 'Interest', points: charts.cumInt },
                  { name: 'Principal repaid', points: charts.cumPrin },
                ]}
                colors={['#c4a574', '#5f6e3d']}
                ariaLabel="Cumulative interest versus principal repaid"
              />
              <div className="legend">
                <span>
                  <i className="swatch" style={{ background: '#c4a574' }} />
                  Cumulative interest
                </span>
                <span>
                  <i className="swatch" style={{ background: '#5f6e3d' }} />
                  Cumulative principal repaid
                </span>
              </div>
            </div>
            <div className="card">
              <h3>Monthly interest vs repayment</h3>
              <LineChart
                series={[
                  { name: 'Interest', points: charts.monthlyInt },
                  { name: 'Repayment', points: charts.monthlyRep },
                ]}
                colors={['#9a6b2f', '#5f6e3d']}
                ariaLabel="Monthly interest versus repayment"
              />
              <div className="legend">
                <span>
                  <i className="swatch" style={{ background: '#9a6b2f' }} />
                  Interest
                </span>
                <span>
                  <i className="swatch" style={{ background: '#5f6e3d' }} />
                  Repayment
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Payoff mix</h3>
            <Donut
              parts={[
                { label: 'Remaining principal', value: charts.mix.remaining, color: selectedColor },
                { label: 'Interest paid', value: charts.mix.interestPaid, color: '#c4a574' },
                { label: 'Principal repaid', value: charts.mix.principalRepaid, color: '#3f6b4a' },
              ]}
            />
          </div>
    </div>
  );
}
