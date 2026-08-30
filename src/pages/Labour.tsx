import { Plus, Trash2 } from 'lucide-react';
import { labourTotals } from '../calc/labour';
import { money } from '../format';
import type { AppState, DayPart, Employee, EmploymentType, Weekday } from '../types';
import { DAYS, DAY_PARTS, newId } from '../types';

export function Labour({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const totals = labourTotals(
    state.employees,
    state.roster,
    state.penalties,
    state.assumptions.workCoverPer100,
    state.assumptions.weeksPerMonthLabour,
  );

  const staff = state.employees.filter((e) => !e.isOwner);
  const owners = state.employees.filter((e) => e.isOwner);

  function hours(empId: string, day: Weekday, part: DayPart): number {
    return state.roster.find((c) => c.employeeId === empId && c.day === day && c.dayPart === part)?.hours ?? 0;
  }

  function setHours(empId: string, day: Weekday, part: DayPart, h: number) {
    const existing = state.roster.find((c) => c.employeeId === empId && c.day === day && c.dayPart === part);
    let roster = state.roster;
    if (existing) {
      roster = roster.map((c) => (c.id === existing.id ? { ...c, hours: h } : c));
    } else if (h > 0) {
      roster = [...roster, { id: newId('r'), employeeId: empId, day, dayPart: part, hours: h }];
    }
    setState({ ...state, roster });
  }

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
          name: owners.length === 0 ? 'Rick' : 'Partner',
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
          <div className="kpi">{money(totals.monthly)}</div>
          <div className="kpi-sub">Fully loaded / month · {money(totals.weekly)} / week</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>People</h3>
          <div className="row">
            <button type="button" className="btn" disabled={staff.length >= 5} onClick={() => addEmployee(false)}>
              <Plus size={14} /> Staff ({staff.length}/5)
            </button>
            <button type="button" className="btn" disabled={owners.length >= 2} onClick={() => addEmployee(true)}>
              <Plus size={14} /> Owner ({owners.length}/2)
            </button>
          </div>
        </div>
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
                    <td className="num">{money(cost?.monthlyLoaded ?? 0)}</td>
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
          Owners appear on the roster for coverage. Salary is monthly drawings and is not multiplied
          by hours. Default drawings are $0 until you set them.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Penalty multipliers (assumption)</h3>
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
      </div>

      <div className="card">
        <h3>Weekly roster</h3>
        <p className="muted">Hours per person / daypart. Wine-bar hours use evening penalties.</p>
        {DAY_PARTS.map((part) => (
          <div key={part.id} style={{ marginTop: 14 }}>
            <div className="unit-tag">{part.label}</div>
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    {DAYS.map((d) => (
                      <th key={d.id} className="num">
                        {d.short}
                      </th>
                    ))}
                    <th className="num">Week h</th>
                  </tr>
                </thead>
                <tbody>
                  {state.employees.map((e) => {
                    const week = DAYS.reduce((s, d) => s + hours(e.id, d.id, part.id), 0);
                    return (
                      <tr key={e.id}>
                        <td>
                          {e.name}
                          {e.isOwner ? ' · owner' : ''}
                        </td>
                        {DAYS.map((d) => (
                          <td key={d.id} className="num">
                            <input
                              className="cell"
                              type="number"
                              min={0}
                              step={0.5}
                              value={hours(e.id, d.id, part.id) || ''}
                              onChange={(ev) => setHours(e.id, d.id, part.id, Number(ev.target.value) || 0)}
                              aria-label={`${e.name} ${d.label} ${part.label} hours`}
                            />
                          </td>
                        ))}
                        <td className="num">{week || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

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
                <td className="num">{money(totals.byUnitMonthly.cafe / state.assumptions.weeksPerMonthLabour)}</td>
                <td className="num">{money(totals.byUnitMonthly.cafe)}</td>
              </tr>
              <tr>
                <td>Wine bar</td>
                <td className="num">{money(totals.byUnitMonthly.wine / state.assumptions.weeksPerMonthLabour)}</td>
                <td className="num">{money(totals.byUnitMonthly.wine)}</td>
              </tr>
              <tr>
                <td>Catering</td>
                <td className="num">{money(totals.byUnitMonthly.catering / state.assumptions.weeksPerMonthLabour)}</td>
                <td className="num">{money(totals.byUnitMonthly.catering)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
