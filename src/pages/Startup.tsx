import { Fragment, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link2, Plus, Trash2 } from 'lucide-react';
import { startupByCategory } from '../calc/model';
import { CategoryInput } from '../components/CategoryInput';
import { NotesCell } from '../components/NotesCell';
import { groupByItemCategory } from '../groupCategory';
import { isUsedPriceMissing } from '../calc/startup';
import { money, signedClass } from '../format';
import type { AppState, ItemCondition, StartupItem, UnitId } from '../types';
import { UNITS, newId } from '../types';

function hrefFor(url: string): string {
  const raw = url.trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function Startup({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const cats = startupByCategory(state, state.units);
  const grand = cats.reduce((s, c) => s + c.total, 0);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [urlEditPos, setUrlEditPos] = useState<{ left: number; top: number } | null>(null);
  const [excTip, setExcTip] = useState<{ left: number; top: number } | null>(null);

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
      newPrice: 0,
      usedPrice: null,
      condition: 'new',
      notes: '',
      supplier: '',
      url: '',
      excludeFromContingency: false,
      final: false,
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

  function placePopover(el: HTMLElement, width = 280) {
    const r = el.getBoundingClientRect();
    let left = r.right + 8;
    let top = r.top + r.height / 2;
    if (left + width > window.innerWidth - 8) left = r.left - width - 8;
    if (left < 8) left = 8;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    const height = 44;
    const minTop = 8 + height / 2;
    const maxTop = window.innerHeight - 8 - height / 2;
    if (top < minTop) top = minTop;
    if (top > maxTop) top = Math.max(minTop, maxTop);
    return { left, top };
  }

  function startEditUrl(el: HTMLElement, id: string) {
    setEditingUrlId(id);
    setUrlEditPos(placePopover(el));
  }

  function onUrlClick(e: MouseEvent<HTMLButtonElement>, item: StartupItem) {
    e.preventDefault();
    const raw = item.url.trim();
    if (!raw) {
      startEditUrl(e.currentTarget, item.id);
      return;
    }
    window.open(hrefFor(raw), '_blank', 'noopener,noreferrer');
  }

  function onUrlContext(e: MouseEvent<HTMLButtonElement>, item: StartupItem) {
    e.preventDefault();
    startEditUrl(e.currentTarget, item.id);
  }

  function onExcEnter(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    let left = r.left;
    const top = r.bottom + 8;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if (left < 12) left = 12;
    setExcTip({ left, top });
  }

  const editingUrlItem = editingUrlId
    ? state.startupItems.find((x) => x.id === editingUrlId)
    : undefined;

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Startup capital</h1>
          <p>
            One-off costs by unit. Each item has a new price and an optional used price; the New |
            Used toggle chooses which amount feeds totals. Used with a blank used price counts as $0
            (it does not fall back to new). Contingency is a % of the selected amounts, excluding
            flagged working capital / wine stock / liquor. Terracotta rows still need
            digging; green rows are final.
          </p>
        </div>
        <div className={`kpi ${signedClass(grand)}`}>{money(grand)}</div>
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
                    <th className="cat-col">Category</th>
                    <th className="num">New price</th>
                    <th className="num">Used price</th>
                    <th>Condition</th>
                    <th className="supplier-col">Supplier</th>
                    <th className="url-col">URL</th>
                    <th className="notes-col">Notes</th>
                    <th
                      className="exc-col"
                      onMouseEnter={onExcEnter}
                      onMouseLeave={() => setExcTip(null)}
                    >
                      EXC.CON.
                    </th>
                    <th>Final</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {groupByItemCategory(items).map((group) => (
                    <Fragment key={group.key || '__uncat'}>
                      <tr className={`cat-head${group.uncategorised ? ' uncat' : ''}`}>
                        <td colSpan={11}>{group.label}</td>
                      </tr>
                      {group.items.map((i) => {
                    const missing = isUsedPriceMissing(i);
                    const hasUrl = i.url.trim() !== '';
                    return (
                      <tr
                        key={i.id}
                        className={i.final ? 'line-final' : 'line-draft'}
                      >
                        <td>
                          <input className="cell" value={i.name} onChange={(e) => patchItem(i.id, { name: e.target.value })} />
                          {missing && (
                            <span className="row-hint">Used price missing — counted as $0</span>
                          )}
                        </td>
                        <td className="cat-cell">
                          <CategoryInput
                            value={i.category}
                            onCommit={(category) => patchItem(i.id, { category })}
                            aria-label={`${i.name} category`}
                          />
                        </td>
                        <td className="num" style={{ opacity: i.condition === 'used' ? 0.45 : 1 }}>
                          <input
                            className="cell"
                            type="number"
                            value={i.newPrice}
                            onChange={(e) => patchItem(i.id, { newPrice: Number(e.target.value) })}
                            aria-label={`${i.name} new price`}
                          />
                        </td>
                        <td className="num" style={{ opacity: i.condition === 'new' ? 0.45 : 1 }}>
                          <input
                            className="cell"
                            type="number"
                            placeholder=""
                            value={i.usedPrice ?? ''}
                            onChange={(e) =>
                              patchItem(i.id, {
                                usedPrice: e.target.value === '' ? null : Number(e.target.value),
                              })
                            }
                            aria-label={`${i.name} used price`}
                          />
                        </td>
                        <td>
                          <div className="seg" role="group" aria-label={`${i.name} condition`}>
                            {(['new', 'used'] as ItemCondition[]).map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={i.condition === c ? 'on' : ''}
                                aria-pressed={i.condition === c}
                                onClick={() => patchItem(i.id, { condition: c })}
                              >
                                {c === 'new' ? 'New' : 'Used'}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="supplier-cell">
                          <input className="cell supplier-input" value={i.supplier} onChange={(e) => patchItem(i.id, { supplier: e.target.value })} />
                        </td>
                        <td className="url-cell">
                          <button
                            type="button"
                            className={`url-btn${hasUrl ? ' has-url' : ''}`}
                            aria-label={hasUrl ? 'Open link' : 'Add link'}
                            onClick={(e) => onUrlClick(e, i)}
                            onContextMenu={(e) => onUrlContext(e, i)}
                          >
                            <Link2 size={16} />
                          </button>
                        </td>
                        <NotesCell
                          value={i.notes}
                          onChange={(notes) => patchItem(i.id, { notes })}
                          aria-label={`${i.name} notes`}
                        />
                        <td className="exc-cell">
                          <input
                            type="checkbox"
                            checked={i.excludeFromContingency}
                            disabled={i.final}
                            onChange={(e) => patchItem(i.id, { excludeFromContingency: e.target.checked })}
                            aria-label="Exclude from contingency"
                            title={i.final ? 'Locked while price is final' : undefined}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={i.final}
                            onChange={(e) => {
                              const final = e.target.checked;
                              if (final) {
                                patchItem(i.id, { final: true, excludeFromContingency: true });
                              } else {
                                patchItem(i.id, { final: false });
                              }
                            }}
                            aria-label="Final"
                          />
                        </td>
                        <td>
                          <button type="button" className="icon-btn" aria-label="Delete" onClick={() => remove(i.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                      })}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Items</td>
                    <td className={`num ${signedClass(roll?.items ?? 0)}`} colSpan={2}>
                      {money(roll?.items ?? 0)}
                    </td>
                    <td colSpan={7} className="muted">
                      Selected new/used amounts
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      {cat.contingencyPct}% Contingency
                    </td>
                    <td className={`num ${signedClass(roll?.contingency ?? 0)}`} colSpan={2}>
                      {money(roll?.contingency ?? 0)}
                    </td>
                    <td colSpan={7} className="muted">
                      Rounded to nearest dollar
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>Unit total</td>
                    <td className={`num ${signedClass(roll?.total ?? 0)}`} colSpan={2}>
                      {money(roll?.total ?? 0)}
                    </td>
                    <td colSpan={7} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}

      {editingUrlId && editingUrlItem && urlEditPos &&
        createPortal(
          <div
            className="url-edit"
            style={{ left: urlEditPos.left, top: urlEditPos.top }}
          >
            <input
              type="url"
              value={editingUrlItem.url}
              autoFocus
              onFocus={(e) => e.target.select()}
              onChange={(e) => patchItem(editingUrlItem.id, { url: e.target.value })}
              onBlur={() => {
                setEditingUrlId(null);
                setUrlEditPos(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="https://"
              aria-label="Edit link"
            />
          </div>,
          document.body,
        )}

      {excTip &&
        createPortal(
          <div
            className="exc-tip"
            style={{ left: excTip.left, top: excTip.top }}
            role="tooltip"
          >
            Exclude from contingency. Ticked lines skip this category's contingency %. Final prices tick this automatically.
          </div>,
          document.body,
        )}
    </div>
  );
}
