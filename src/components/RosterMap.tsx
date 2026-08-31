import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import type { Employee, RosterCell, Weekday } from '../types';
import {
  DAYS,
  cellWithRange,
  dayPartForDept,
  deptOf,
  inferTimes,
  nextDept,
  newId,
  snapHalf,
} from '../types';

const MAP_START = 4;
const MAP_END = 22;
const MAP_SPAN = MAP_END - MAP_START;
const DEFAULT_DUR = 4;
const MIN_DUR = 0.5;

function hourPct(hour: number): number {
  return ((hour - MAP_START) / MAP_SPAN) * 100;
}

type Drag =
  | { kind: 'move'; id: string; grabOffset: number; duration: number }
  | { kind: 'resize-start'; id: string }
  | { kind: 'resize-end'; id: string };

function shortName(name: string): string {
  const t = name.trim();
  return t.split(/\s+/)[0] || t;
}

function fmtHours(h: number): string {
  const n = Math.round(h * 10) / 10;
  return `${Number.isInteger(n) ? n : n.toFixed(1)}h`;
}

function fmtClock(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${hr}:${String(min).padStart(2, '0')}`;
}

function fmtHourLabel(h: number): string {
  if (h === MAP_START) return '4am';
  if (h === MAP_END) return '10pm';
  return String(h);
}

function clampRange(start: number, end: number): { start: number; end: number } {
  let s = snapHalf(start);
  let e = snapHalf(end);
  s = Math.min(Math.max(s, MAP_START), MAP_END - MIN_DUR);
  e = Math.min(Math.max(e, s + MIN_DUR), MAP_END);
  if (e - s < MIN_DUR) e = s + MIN_DUR;
  if (e > MAP_END) {
    e = MAP_END;
    s = Math.max(MAP_START, e - MIN_DUR);
  }
  return { start: s, end: e };
}

function packColumns(
  items: { id: string; startHour: number; endHour: number }[],
): Map<string, { col: number; cols: number }> {
  const result = new Map<string, { col: number; cols: number }>();
  if (!items.length) return result;
  const sorted = [...items].sort((a, b) => a.startHour - b.startHour || b.endHour - a.endHour);
  const clusters: typeof items[] = [];
  let cur: typeof items = [];
  let curEnd = -Infinity;
  for (const it of sorted) {
    if (!cur.length || it.startHour < curEnd - 1e-9) {
      cur.push(it);
      curEnd = Math.max(curEnd, it.endHour);
    } else {
      clusters.push(cur);
      cur = [it];
      curEnd = it.endHour;
    }
  }
  if (cur.length) clusters.push(cur);

  for (const cluster of clusters) {
    const colEnd: number[] = [];
    const colOf = new Map<string, number>();
    const ordered = [...cluster].sort((a, b) => a.startHour - b.startHour || b.endHour - a.endHour);
    for (const it of ordered) {
      let assigned = -1;
      for (let i = 0; i < colEnd.length; i++) {
        const colFinish = colEnd[i];
        if (colFinish !== undefined && colFinish <= it.startHour + 1e-9) {
          assigned = i;
          break;
        }
      }
      if (assigned === -1) {
        assigned = colEnd.length;
        colEnd.push(it.endHour);
      } else {
        colEnd[assigned] = it.endHour;
      }
      colOf.set(it.id, assigned);
    }
    const cols = Math.max(1, colEnd.length);
    for (const it of cluster) {
      result.set(it.id, { col: colOf.get(it.id) ?? 0, cols });
    }
  }
  return result;
}

function xToHour(clientX: number, rect: DOMRect): number {
  return snapHalf(MAP_START + ((clientX - rect.left) / rect.width) * MAP_SPAN);
}

export function RosterMap({
  employees,
  roster,
  onChange,
}: {
  employees: Employee[];
  roster: RosterCell[];
  onChange: (roster: RosterCell[]) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Partial<Record<Weekday, HTMLDivElement | null>>>({});
  const rosterRef = useRef(roster);
  rosterRef.current = roster;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [drag, setDrag] = useState<Drag | null>(null);

  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const timed = useMemo(
    () =>
      roster
        .filter((c) => c.hours > 0)
        .map((c) => {
          const t = inferTimes(c);
          return { cell: c, ...t };
        }),
    [roster],
  );

  const packByDay = useMemo(() => {
    const map = new Map<Weekday, Map<string, { col: number; cols: number }>>();
    for (const d of DAYS) {
      const items = timed.filter((t) => t.cell.day === d.id).map((t) => ({
        id: t.cell.id,
        startHour: t.startHour,
        endHour: t.endHour,
      }));
      map.set(d.id, packColumns(items));
    }
    return map;
  }, [timed]);

  function dayFromY(clientY: number): Weekday | null {
    for (const d of DAYS) {
      const el = dayRefs.current[d.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientY >= r.top && clientY < r.bottom) return d.id;
    }
    return null;
  }

  function patch(id: string, start: number, end: number, day?: Weekday) {
    const next = rosterRef.current.map((c) => {
      if (c.id !== id) return c;
      const range = clampRange(start, end);
      return cellWithRange(c, range.start, range.end, day ?? c.day);
    });
    onChangeRef.current(next);
  }

  useEffect(() => {
    if (!drag) return;
    const active = drag;
    function onMove(e: PointerEvent) {
      const body = bodyRef.current;
      if (!body) return;
      const hour = xToHour(e.clientX, body.getBoundingClientRect());
      const cell = rosterRef.current.find((c) => c.id === active.id);
      if (!cell) return;
      const t = inferTimes(cell);
      if (active.kind === 'move') {
        const day = dayFromY(e.clientY) ?? cell.day;
        let start = hour - active.grabOffset;
        const dur = active.duration;
        start = snapHalf(start);
        start = Math.min(Math.max(start, MAP_START), MAP_END - MIN_DUR);
        let end = start + dur;
        if (end > MAP_END) {
          end = MAP_END;
          start = Math.max(MAP_START, end - dur);
        }
        patch(cell.id, start, end, day);
      } else if (active.kind === 'resize-start') {
        patch(cell.id, hour, t.endHour);
      } else {
        patch(cell.id, t.startHour, hour);
      }
    }
    function onUp() {
      setDrag(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag]);

  function dropEmployee(e: DragEvent, fallbackDay: Weekday) {
    e.preventDefault();
    e.stopPropagation();
    const empId =
      e.dataTransfer.getData('application/x-roma-employee') || e.dataTransfer.getData('text/plain');
    if (!empId || !byId.has(empId)) return;
    const body = bodyRef.current;
    if (!body) return;
    const day = dayFromY(e.clientY) ?? fallbackDay;
    let start = xToHour(e.clientX, body.getBoundingClientRect());
    start = Math.min(Math.max(start, MAP_START), MAP_END - MIN_DUR);
    let end = start + DEFAULT_DUR;
    if (end > MAP_END) end = MAP_END;
    const range = clampRange(start, end);
    const cell: RosterCell = {
      id: newId('r'),
      employeeId: empId,
      day,
      dayPart: dayPartForDept('deli', range.start),
      hours: range.end - range.start,
      startHour: range.start,
      endHour: range.end,
    };
    onChange([...rosterRef.current, cell]);
  }

  function cycleDept(id: string) {
    onChange(
      rosterRef.current.map((c) => {
        if (c.id !== id) return c;
        const t = inferTimes(c);
        const dept = nextDept(deptOf(c.dayPart));
        return {
          ...c,
          startHour: t.startHour,
          endHour: t.endHour,
          hours: t.hours,
          dayPart: dayPartForDept(dept, t.startHour),
        };
      }),
    );
  }

  function removeCell(id: string) {
    onChange(rosterRef.current.filter((c) => c.id !== id));
  }

  const hours = Array.from({ length: MAP_END - MAP_START + 1 }, (_, i) => MAP_START + i);

  return (
    <div className="roster-map-scroll">
      <div className={`roster-map${drag ? ' is-dragging' : ''}`}>
        <div className="roster-corner" />
        <div className="roster-times-head" ref={bodyRef}>
          {hours.map((h) => (
            <div
              key={h}
              className={`roster-time${h === MAP_START ? ' is-start' : ''}${h === MAP_END ? ' is-end' : ''}`}
              style={
                h === MAP_END
                  ? { right: 0 }
                  : { left: `${hourPct(h)}%` }
              }
            >
              {fmtHourLabel(h)}
            </div>
          ))}
        </div>
        {DAYS.map((d) => {
          const pack = packByDay.get(d.id);
          const dayCells = timed.filter((t) => t.cell.day === d.id);
          return (
            <Fragment key={d.id}>
              <div className="roster-day-head">{d.short}</div>
              <div
                className="roster-day"
                data-day={d.id}
                ref={(el) => {
                  dayRefs.current[d.id] = el;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => dropEmployee(e, d.id)}
              >
                {dayCells.map((t) => {
                  const emp = byId.get(t.cell.employeeId);
                  if (!emp) return null;
                  const dept = deptOf(t.cell.dayPart);
                  const layout = pack?.get(t.cell.id) ?? { col: 0, cols: 1 };
                  const left = hourPct(t.startHour);
                  const width = Math.max(hourPct(t.endHour) - hourPct(t.startHour), 1.5);
                  const heightPct = 100 / layout.cols;
                  const topPct = layout.col * heightPct;
                  const deptLabel = dept === 'deli' ? 'Deli' : dept === 'catering' ? 'Catering' : 'Wine';
                  return (
                    <div
                      key={t.cell.id}
                      className={`roster-block dept-${dept}${drag?.id === t.cell.id ? ' dragging' : ''}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: `calc(${topPct}% + 2px)`,
                        height: `calc(${heightPct}% - 4px)`,
                      }}
                      title={`${emp.name} · ${fmtClock(t.startHour)}–${fmtClock(t.endHour)} · ${deptLabel}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={(e) => dropEmployee(e, d.id)}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        const target = e.target as HTMLElement;
                        if (target.closest('.roster-dept, .roster-x, .roster-handle')) return;
                        e.preventDefault();
                        const body = bodyRef.current;
                        if (!body) return;
                        const hour = xToHour(e.clientX, body.getBoundingClientRect());
                        setDrag({
                          kind: 'move',
                          id: t.cell.id,
                          grabOffset: hour - t.startHour,
                          duration: t.endHour - t.startHour,
                        });
                      }}
                    >
                      <div
                        className="roster-handle left"
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          e.preventDefault();
                          e.stopPropagation();
                          setDrag({ kind: 'resize-start', id: t.cell.id });
                        }}
                      />
                      <div className="roster-block-inner">
                        <span className="roster-block-name">
                          {shortName(emp.name)} {fmtHours(t.hours)}
                        </span>
                        <button
                          type="button"
                          className="roster-dept"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            cycleDept(t.cell.id);
                          }}
                          aria-label={`Department ${deptLabel}, click to change`}
                        >
                          {deptLabel}
                        </button>
                        <button
                          type="button"
                          className="roster-x"
                          aria-label={`Remove ${emp.name} block`}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCell(t.cell.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div
                        className="roster-handle right"
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          e.preventDefault();
                          e.stopPropagation();
                          setDrag({ kind: 'resize-end', id: t.cell.id });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
