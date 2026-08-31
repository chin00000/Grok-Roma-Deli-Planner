import { Fragment } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toAnnual, toMonthly } from '../calc/frequency';
import { CategoryInput } from '../components/CategoryInput';
import { NotesCell } from '../components/NotesCell';
import { groupByItemCategory } from '../groupCategory';
import { money, signedClass } from '../format';
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
      final: false,
    };
    setState({ ...state, outgoingItems: [...state.outgoingItems, item] });
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Outgoings</h1>
          <p>Recurring costs with weekly / monthly / quarterly / yearly frequency, normalised to monthly and annual. Terracotta = still open, green = final.</p>
        </div>
        <div>
          <div className={`kpi ${signedClass(monthly)}`}>{money(monthly)}</div>
          <div className="kpi-sub">Monthly · <span className={signedClass(monthly * 12)}>{money(monthly * 12)}</span> / yr</div>
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
              <table className="lines">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="cat-col">Category</th>
                    <th className="out-cost num">Cost</th>
                    <th>Frequency</th>
                    <th className="num">Monthly</th>
                    <th className="num">Annual</th>
                    <th className="out-notes">Notes</th>
                    <th>Final</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {groupByItemCategory(items).map((group) => (
                    <Fragment key={group.key || '__uncat'}>
                      <tr className={`cat-head${group.uncategorised ? ' uncat' : ''}`}>
                        <td colSpan={9}>{group.label}</td>
                      </tr>
                      {group.items.map((i) => (
                    <tr key={i.id} className={i.final ? 'line-final' : 'line-draft'}>
                      <td>
                        <input className="cell" value={i.name} onChange={(e) => patch(i.id, { name: e.target.value })} />
                      </td>
                      <td className="cat-cell">
                        <CategoryInput
                          value={i.category}
                          onCommit={(category) => patch(i.id, { category })}
                          aria-label={`${i.name} category`}
                        />
                      </td>
                      <td className="out-cost num">
                        <input
                          className="cell out-cost-input"
                          type="number"
                          inputMode="numeric"
                          aria-label="Cost"
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
                      <td className={`num ${signedClass(toMonthly(i.cost, i.frequency))}`}>{money(toMonthly(i.cost, i.frequency), true)}</td>
                      <td className={`num ${signedClass(toAnnual(i.cost, i.frequency))}`}>{money(toAnnual(i.cost, i.frequency), true)}</td>
                      <NotesCell
                        className="out-notes"
                        value={i.notes}
                        onChange={(notes) => patch(i.id, { notes })}
                        aria-label={`${i.name} notes`}
                      />
                      <td>
                        <input
                          type="checkbox"
                          checked={i.final}
                          onChange={(e) => patch(i.id, { final: e.target.checked })}
                          aria-label="Final"
                        />
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
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td className="out-cost num" />
                    <td />
                    <td className={`num ${signedClass(m)}`}>{money(m)}</td>
                    <td className={`num ${signedClass(m * 12)}`}>{money(m * 12)}</td>
                    <td colSpan={3} />
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
