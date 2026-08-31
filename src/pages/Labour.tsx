import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { labourTotals } from '../calc/labour';
import { RosterMap } from '../components/RosterMap';
import { money, signedClass } from '../format';
import type { AppState, Employee, EmploymentType } from '../types';
import { newId } from '../types';

export function Labour({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [penaltiesOpen, setPenaltiesOpen] = useState(false);

  const totals = labourTotals(
    state.employees,
    state.roster,
    state.penalties,
    state.assumptions.workCoverPer100,
    state.assumptions.weeksPerMonthLabour,
  );

  const staff = state.employees.filter((e) => !e.isOwner);
  const owners = state.employees.filter((e) => e.isOwner);

  function patchEmp(id: string, p: Partial<Employee>) {
    setState({
      ...state,
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...p } : e)),
    });
  }

  function addEmployee(owner: boolean) {
    if (!owner && staff.length >= 5) return;
    if (owner && owners.length >= 2) return;
    const emp: Employee = owner
      ? {
          id: newId('emp'),
          name: owners.length === 0 ? 'Nikita' : 'Maddison',
          role: 'Owner-operator',
          isOwner: true,
          ownerIndex: owners.length === 0 ? 1 : 2,
          employmentType: 'owner',
          hourlyRate: 0,
          monthlySalary: 0,
          superPct: state.assumptions.superPct,
          leaveLoadingPct: 0,
          casualLoadingPct: 0,
          rateIncludesCasualLoading: false,
          workCoverApplies: true,
        }
      : {
          id: newId('emp'),
          name: 'New staff',
          role: 'FOH',
          isOwner: false,
          employmentType: 'casual',
          hourlyRate: 26,
          monthlySalary: 0,
          superPct: state.assumptions.superPct,
          leaveLoadingPct: 0,
          casualLoadingPct: 25,
          rateIncludesCasualLoading: false,
          workCoverApplies: true,
        };
    setState({ ...state, employees: [...state.employees, emp] });
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Labour</h1>
          <p>
            QLD Hospitality Award MA000009. Super {state.assumptions.superPct}% (ATO 2026–27). Fair Work
            L2 casual ordinary 1 Jul 2026 ${state.assumptions.fairWorkL2CasualOrdinary.toFixed(2)}/h.
            Casual Senior $42 is 35+7 — loading flag on so it is not doubled. Penalty multipliers are
            editable assumptions.
          </p>
        </div>
        <div>
          <div className={`kpi ${signedClass(totals.monthly)}`}>{money(totals.monthly)}</div>
          <div className="kpi-sub">Fully loaded / month · <span className={signedClass(totals.weekly)}>{money(totals.weekly)}</span> / week</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="fold-head">
          <h3>People</h3>
          <div className="row">
            <button type="button" className="btn" disabled={staff.length >= 5} onClick={() => addEmployee(false)}>
              <Plus size={14} /> Staff ({staff.length}/5)
            </button>
            <button type="button" className="btn" disabled={owners.length >= 2} onClick={() => addEmployee(true)}>
              <Plus size={14} /> Owner ({owners.length}/2)
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-expanded={peopleOpen}
              aria-label={peopleOpen ? 'Collapse people' : 'Expand people'}
              onClick={() => setPeopleOpen((v) => !v)}
            >
              <ChevronDown size={16} className={peopleOpen ? 'fold-chevron open' : 'fold-chevron'} />
            </button>
          </div>
        </div>
        {peopleOpen ? (
          <>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Type</th>
                    <th className="num">Hourly</th>
                    <th className="num">Owner salary / mo</th>
                    <th className="num">Super %</th>
                    <th>Loading in rate</th>
                    <th>Leave 17.5%</th>
                    <th>WorkCover</th>
                    <th className="num">Loaded / mo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {state.employees.map((e) => {
                    const cost = totals.people.find((p) => p.employeeId === e.id);
                    return (
                      <tr key={e.id}>
                        <td>
                          <input className="cell" value={e.name} onChange={(ev) => patchEmp(e.id, { name: ev.target.value })} />
                        </td>
                        <td>
                          <input className="cell" value={e.role} onChange={(ev) => patchEmp(e.id, { role: ev.target.value })} />
                        </td>
                        <td>
                          <select
                            className="cell"
                            value={e.employmentType}
                            onChange={(ev) =>
                              patchEmp(e.id, {
                                employmentType: ev.target.value as EmploymentType,
                                isOwner: ev.target.value === 'owner',
                              })
                            }
                          >
                            <option value="casual">Casual</option>
                            <option value="permanent">Permanent</option>
                            <option value="owner">Owner</option>
                          </select>
                        </td>
                        <td className="num">
                          <input
                            className="cell"
                            type="number"
                            disabled={e.employmentType === 'owner'}
                            value={e.hourlyRate}
                            onChange={(ev) => patchEmp(e.id, { hourlyRate: Number(ev.target.value) })}
                          />
                        </td>
                        <td className="num">
                          <input
                            className="cell"
                            type="number"
                            disabled={e.employmentType !== 'owner'}
                            value={e.monthlySalary}
                            onChange={(ev) => patchEmp(e.id, { monthlySalary: Number(ev.target.value) })}
                          />
                        </td>
                        <td className="num">
                          <input
                            className="cell"
                            type="number"
                            value={e.superPct}
                            onChange={(ev) => patchEmp(e.id, { superPct: Number(ev.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={e.rateIncludesCasualLoading}
                            disabled={e.employmentType !== 'casual'}
                            onChange={(ev) => patchEmp(e.id, { rateIncludesCasualLoading: ev.target.checked })}
                            aria-label="Rate already includes casual loading"
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={e.leaveLoadingPct > 0}
                            disabled={e.employmentType !== 'permanent'}
                            onChange={(ev) => patchEmp(e.id, { leaveLoadingPct: ev.target.checked ? 17.5 : 0 })}
                            aria-label="Leave loading 17.5%"
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={e.workCoverApplies}
                            onChange={(ev) => patchEmp(e.id, { workCoverApplies: ev.target.checked })}
                            aria-label="WorkCover applies"
                          />
                        </td>
                        <td className={`num ${signedClass(cost?.monthlyLoaded ?? 0)}`}>{money(cost?.monthlyLoaded ?? 0)}</td>
                        <td>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="Delete"
                            onClick={() =>
                              setState({
                                ...state,
                                employees: state.employees.filter((x) => x.id !== e.id),
                                roster: state.roster.filter((c) => c.employeeId !== e.id),
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="notes" style={{ marginTop: 10 }}>
              Partner A — Nikita (Small's side). Partner B — Maddison (Sudy's side). Both are salary, not
              hourly. Owners appear on the roster for coverage. Salary is monthly drawings and is not
              multiplied by hours. Default drawings are $0 until you set them.
            </p>
          </>
        ) : (
          <div className="name-chips" role="list">
            {state.employees.map((e) => (
              <div
                key={e.id}
                className="name-chip"
                role="listitem"
                draggable
                onDragStart={(ev) => {
                  ev.dataTransfer.setData('application/x-roma-employee', e.id);
                  ev.dataTransfer.setData('text/plain', e.id);
                  ev.dataTransfer.effectAllowed = 'copy';
                }}
              >
                {e.name}
                {e.isOwner ? ' · owner' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="fold-head">
          <h3>Penalty multipliers</h3>
          <button
            type="button"
            className="icon-btn"
            aria-expanded={penaltiesOpen}
            aria-label={penaltiesOpen ? 'Collapse penalty multipliers' : 'Expand penalty multipliers'}
            onClick={() => setPenaltiesOpen((v) => !v)}
          >
            <ChevronDown size={16} className={penaltiesOpen ? 'fold-chevron open' : 'fold-chevron'} />
          </button>
        </div>
        {penaltiesOpen ? (
          <div className="grid grid-3" style={{ marginTop: 12 }}>
            {(
              [
                ['weekday', 'Weekday'],
                ['evening', '7–10pm'],
                ['saturday', 'Saturday'],
                ['sunday', 'Sunday'],
                ['saturdayEvening', 'Sat evening'],
                ['sundayEvening', 'Sun evening'],
              ] as const
            ).map(([k, label]) => (
              <label className="field" key={k}>
                <span>{label}</span>
                <input
                  type="number"
                  step="0.05"
                  value={state.penalties[k]}
                  onChange={(e) =>
                    setState({ ...state, penalties: { ...state.penalties, [k]: Number(e.target.value) } })
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3>Weekly roster</h3>
        <div style={{ marginTop: 12 }}>
          <RosterMap
            employees={state.employees}
            roster={state.roster}
            onChange={(roster) => setState({ ...state, roster })}
          />
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Drag a name from People (collapse the table to see chips). Stretch a block to set hours. Colour
          is department. Wine blocks use evening penalties.
        </p>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th className="num">Weekly loaded</th>
                <th className="num">Monthly loaded</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cafe</td>
                <td className={`num ${signedClass(totals.byUnitMonthly.cafe / state.assumptions.weeksPerMonthLabour)}`}>{money(totals.byUnitMonthly.cafe / state.assumptions.weeksPerMonthLabour)}</td>
                <td className={`num ${signedClass(totals.byUnitMonthly.cafe)}`}>{money(totals.byUnitMonthly.cafe)}</td>
              </tr>
              <tr>
                <td>Wine bar</td>
                <td className={`num ${signedClass(totals.byUnitMonthly.wine / state.assumptions.weeksPerMonthLabour)}`}>{money(totals.byUnitMonthly.wine / state.assumptions.weeksPerMonthLabour)}</td>
                <td className={`num ${signedClass(totals.byUnitMonthly.wine)}`}>{money(totals.byUnitMonthly.wine)}</td>
              </tr>
              <tr>
                <td>Catering</td>
                <td className={`num ${signedClass(totals.byUnitMonthly.catering / state.assumptions.weeksPerMonthLabour)}`}>{money(totals.byUnitMonthly.catering / state.assumptions.weeksPerMonthLabour)}</td>
                <td className={`num ${signedClass(totals.byUnitMonthly.catering)}`}>{money(totals.byUnitMonthly.catering)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
