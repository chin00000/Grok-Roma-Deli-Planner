import { Plus, Trash2 } from 'lucide-react';
import { startupByCategory } from '../calc/model';
import { money } from '../format';
import type { AppState, StartupItem, UnitId } from '../types';
import { UNITS, newId } from '../types';

export function Startup({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const cats = startupByCategory(state, state.units);
  const grand = cats.reduce((s, c) => s + c.total, 0);

  function patchItem(id: string, patch: Partial<StartupItem>) {
    setState({
      ...state,
      startupItems: state.startupItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  function addItem(categoryId: string, unit: UnitId) {
    const item: StartupItem = {
      id: newId('si'),
      categoryId,
      unit,
      name: 'New item',
      cost: 0,
      notes: '',
      supplier: '',
      url: '',
      excludeFromContingency: false,
    };
    setState({ ...state, startupItems: [...state.startupItems, item] });
  }

  function remove(id: string) {
    setState({ ...state, startupItems: state.startupItems.filter((i) => i.id !== id) });
  }

  function setContingency(id: string, pct: number) {
    setState({
      ...state,
      startupCategories: state.startupCategories.map((c) =>
        c.id === id ? { ...c, contingencyPct: pct } : c,
      ),
    });
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Startup capital</h1>
          <p>
            One-off costs by unit. Contingency is a % of the category, excluding flagged working
            capital / wine stock / liquor.
          </p>
        </div>
        <div className="kpi">{money(grand)}</div>
      </div>

      {state.startupCategories.map((cat) => {
        const roll = cats.find((c) => c.categoryId === cat.id);
        const items = state.startupItems.filter((i) => i.categoryId === cat.id);
        return (
          <div className="card" key={cat.id} style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 22 }}>{cat.name}</h2>
                <span className="unit-tag">{UNITS.find((u) => u.id === cat.unit)?.label}</span>
                {!state.units[cat.unit] && <span className="muted"> · unit persisted off</span>}
              </div>
              <div className="row">
                <label className="field" style={{ width: 120 }}>
                  <span>Contingency %</span>
                  <input
                    type="number"
                    value={cat.contingencyPct}
                    onChange={(e) => setContingency(cat.id, Number(e.target.value))}
                  />
                </label>
                <button type="button" className="btn" onClick={() => addItem(cat.id, cat.unit)}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">AUD</th>
                    <th>Supplier</th>
                    <th>URL</th>
                    <th>Notes</th>
                    <th>Excl. contig.</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <input className="cell" value={i.name} onChange={(e) => patchItem(i.id, { name: e.target.value })} />
                      </td>
                      <td className="num">
                        <input
                          className="cell"
                          type="number"
                          value={i.cost}
                          onChange={(e) => patchItem(i.id, { cost: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input className="cell" value={i.supplier} onChange={(e) => patchItem(i.id, { supplier: e.target.value })} />
                      </td>
                      <td>
                        <input className="cell" value={i.url} onChange={(e) => patchItem(i.id, { url: e.target.value })} />
                      </td>
                      <td>
                        <input className="cell" value={i.notes} onChange={(e) => patchItem(i.id, { notes: e.target.value })} />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={i.excludeFromContingency}
                          onChange={(e) => patchItem(i.id, { excludeFromContingency: e.target.checked })}
                          aria-label="Exclude from contingency"
                        />
                      </td>
                      <td>
                        <button type="button" className="icon-btn" aria-label="Delete" onClick={() => remove(i.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Items</td>
                    <td className="num">{money(roll?.items ?? 0)}</td>
                    <td colSpan={5} />
                  </tr>
                  <tr>
                    <td>
                      Contingency {cat.contingencyPct}% of {money(roll?.contingencyBase ?? 0)}
                    </td>
                    <td className="num">{money(roll?.contingency ?? 0)}</td>
                    <td colSpan={5} className="muted">
                      Rounded to nearest dollar
                    </td>
                  </tr>
                  <tr>
                    <td>Unit total</td>
                    <td className="num">{money(roll?.total ?? 0)}</td>
                    <td colSpan={5} />
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
