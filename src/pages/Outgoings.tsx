import { Plus, Trash2 } from 'lucide-react';
import { toAnnual, toMonthly } from '../calc/frequency';
import { money } from '../format';
import type { AppState, Frequency, OutgoingItem, UnitId } from '../types';
import { FREQUENCIES, UNITS, newId } from '../types';

export function Outgoings({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const monthly = state.outgoingItems
    .filter((i) => state.units[i.unit])
    .reduce((s, i) => s + toMonthly(i.cost, i.frequency), 0);

  function patch(id: string, p: Partial<OutgoingItem>) {
    setState({
      ...state,
      outgoingItems: state.outgoingItems.map((i) => (i.id === id ? { ...i, ...p } : i)),
    });
  }

  function add(categoryId: string, unit: UnitId) {
    const item: OutgoingItem = {
      id: newId('oi'),
      categoryId,
      unit,
      name: 'New outgoing',
      cost: 0,
      frequency: 'monthly',
      notes: '',
    };
    setState({ ...state, outgoingItems: [...state.outgoingItems, item] });
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Outgoings</h1>
          <p>Recurring costs with weekly / monthly / quarterly / yearly frequency, normalised to monthly and annual.</p>
        </div>
        <div>
          <div className="kpi">{money(monthly)}</div>
          <div className="kpi-sub">Monthly · {money(monthly * 12)} / yr</div>
        </div>
      </div>

      {state.outgoingCategories.map((cat) => {
        const items = state.outgoingItems.filter((i) => i.categoryId === cat.id);
        const m = items.reduce((s, i) => s + toMonthly(i.cost, i.frequency), 0);
        return (
          <div className="card" key={cat.id} style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 22 }}>{cat.name}</h2>
                <span className="unit-tag">{UNITS.find((u) => u.id === cat.unit)?.label}</span>
              </div>
              <button type="button" className="btn" onClick={() => add(cat.id, cat.unit)}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Cost</th>
                    <th>Frequency</th>
                    <th className="num">Monthly</th>
                    <th className="num">Annual</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <input className="cell" value={i.name} onChange={(e) => patch(i.id, { name: e.target.value })} />
                      </td>
                      <td className="num">
                        <input
                          className="cell"
                          type="number"
                          value={i.cost}
                          onChange={(e) => patch(i.id, { cost: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <select
                          className="cell"
                          value={i.frequency}
                          onChange={(e) => patch(i.id, { frequency: e.target.value as Frequency })}
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="num">{money(toMonthly(i.cost, i.frequency), true)}</td>
                      <td className="num">{money(toAnnual(i.cost, i.frequency), true)}</td>
                      <td>
                        <input className="cell" value={i.notes} onChange={(e) => patch(i.id, { notes: e.target.value })} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Delete"
                          onClick={() =>
                            setState({
                              ...state,
                              outgoingItems: state.outgoingItems.filter((x) => x.id !== i.id),
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Category</td>
                    <td />
                    <td />
                    <td className="num">{money(m)}</td>
                    <td className="num">{money(m * 12)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
