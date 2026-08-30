import { Plus, Trash2 } from 'lucide-react';
import { computeModel } from '../calc/model';
import { money, percent } from '../format';
import type { AppState, RevenueStream, UnitId } from '../types';
import { UNITS, newId } from '../types';

export function Revenue({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const model = computeModel(state);

  function patch(id: string, p: Partial<RevenueStream>) {
    setState({
      ...state,
      revenue: state.revenue.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });
  }

  function add() {
    const stream: RevenueStream = {
      id: newId('rev'),
      name: 'New stream',
      unit: 'cafe',
      daysPerMonth: 25,
      hoursPerSession: 8,
      volume: 0,
      aov: 20,
      cogsPct: 32,
      otherVarPct: 1.6,
      extraFixedMonthly: 0,
      notes: '',
      optimisticVolume: 0,
      mealsPerDay: 0,
      daysPerWeek: 5,
      weeksPerMonth: 4,
      usesMealFormula: false,
    };
    setState({ ...state, revenue: [...state.revenue, stream] });
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Revenue</h1>
          <p>
            Cafe, wine bar, catering. Extra units can be added. Labour is linked from the roster by
            unit. Optimistic volumes are notes only — they do not drive the model.
          </p>
        </div>
        <button type="button" className="btn" onClick={add}>
          <Plus size={14} /> Add stream
        </button>
      </div>

      {state.revenue.map((s) => {
        const r = model.streams.find((x) => x.id === s.id);
        return (
          <div className="card" key={s.id} style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="row grow">
                <input
                  style={{ maxWidth: 260, fontFamily: 'var(--serif)', fontSize: 22, background: 'transparent', border: 0 }}
                  value={s.name}
                  onChange={(e) => patch(s.id, { name: e.target.value })}
                />
                <select
                  className="cell"
                  style={{ maxWidth: 140 }}
                  value={s.unit}
                  onChange={(e) => patch(s.id, { unit: e.target.value as UnitId })}
                >
                  {UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <span className="chip">{state.units[s.unit] ? 'unit on' : 'unit persisted off'}</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Delete stream"
                onClick={() => setState({ ...state, revenue: state.revenue.filter((x) => x.id !== s.id) })}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-4" style={{ marginTop: 12 }}>
              {s.usesMealFormula ? (
                <>
                  <label className="field">
                    <span>Meals / day</span>
                    <input type="number" value={s.mealsPerDay} onChange={(e) => patch(s.id, { mealsPerDay: Number(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>Days / week</span>
                    <input type="number" value={s.daysPerWeek} onChange={(e) => patch(s.id, { daysPerWeek: Number(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>Weeks / month</span>
                    <input type="number" value={s.weeksPerMonth} onChange={(e) => patch(s.id, { weeksPerMonth: Number(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>AOV</span>
                    <input type="number" value={s.aov} onChange={(e) => patch(s.id, { aov: Number(e.target.value) })} />
                  </label>
                </>
              ) : (
                <>
                  <label className="field">
                    <span>{s.unit === 'wine' ? 'Nights / month' : 'Days / month'}</span>
                    <input type="number" value={s.daysPerMonth} onChange={(e) => patch(s.id, { daysPerMonth: Number(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>{s.unit === 'wine' ? 'Covers / night' : 'Covers / day'}</span>
                    <input type="number" value={s.volume} onChange={(e) => patch(s.id, { volume: Number(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>Hours / session</span>
                    <input type="number" value={s.hoursPerSession} onChange={(e) => patch(s.id, { hoursPerSession: Number(e.target.value) })} />
                  </label>
                  <label className="field">
                    <span>AOV</span>
                    <input type="number" value={s.aov} onChange={(e) => patch(s.id, { aov: Number(e.target.value) })} />
                  </label>
                </>
              )}
              <label className="field">
                <span>COGS %</span>
                <input type="number" step="0.1" value={s.cogsPct} onChange={(e) => patch(s.id, { cogsPct: Number(e.target.value) })} />
              </label>
              <label className="field">
                <span>Other variable %</span>
                <input type="number" step="0.1" value={s.otherVarPct} onChange={(e) => patch(s.id, { otherVarPct: Number(e.target.value) })} />
              </label>
              <label className="field">
                <span>Optimistic volume (note)</span>
                <input type="number" value={s.optimisticVolume} onChange={(e) => patch(s.id, { optimisticVolume: Number(e.target.value) })} />
              </label>
              <label className="toggle" style={{ alignItems: 'flex-end' }}>
                <span>Meal formula (d × w × 4)</span>
                <input
                  type="checkbox"
                  checked={s.usesMealFormula}
                  onChange={(e) => patch(s.id, { usesMealFormula: e.target.checked })}
                />
              </label>
            </div>
            <label className="field" style={{ marginTop: 10 }}>
              <span>Notes</span>
              <textarea value={s.notes} onChange={(e) => patch(s.id, { notes: e.target.value })} />
            </label>

            {r && (
              <div className="grid grid-4" style={{ marginTop: 14 }}>
                <div>
                  <div className="muted">Revenue</div>
                  <div className="kpi" style={{ fontSize: 24 }}>{money(r.revenue)}</div>
                </div>
                <div>
                  <div className="muted">COGS {percent(s.cogsPct)}</div>
                  <div className="kpi" style={{ fontSize: 24 }}>{money(r.cogs)}</div>
                </div>
                <div>
                  <div className="muted">Linked labour</div>
                  <div className="kpi" style={{ fontSize: 24 }}>{money(r.labour)}</div>
                </div>
                <div>
                  <div className="muted">Contribution</div>
                  <div className="kpi" style={{ fontSize: 24 }}>{money(r.contribution)}</div>
                </div>
                <div>
                  <div className="muted">Extra fixed (outgoings)</div>
                  <div className="kpi" style={{ fontSize: 24 }}>{money(r.extraFixed)}</div>
                </div>
                <div>
                  <div className="muted">Operating profit</div>
                  <div className="kpi" style={{ fontSize: 24 }}>{money(r.operatingProfit)}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
