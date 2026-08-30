import type {
  DayPart,
  Employee,
  PenaltyRates,
  RosterCell,
  UnitId,
  Weekday,
} from '../types';
import { DAY_PARTS } from '../types';

export function ordinaryHourlyRate(emp: Employee): number {
  if (emp.employmentType === 'owner') return 0;
  if (emp.employmentType === 'casual' && !emp.rateIncludesCasualLoading) {
    return emp.hourlyRate * (1 + emp.casualLoadingPct / 100);
  }
  return emp.hourlyRate;
}

export function penaltyMultiplier(
  day: Weekday,
  dayPart: DayPart,
  penalties: PenaltyRates,
): number {
  const evening = dayPart === 'wine_bar';
  if (day === 'sat') return evening ? penalties.saturdayEvening : penalties.saturday;
  if (day === 'sun') return evening ? penalties.sundayEvening : penalties.sunday;
  return evening ? penalties.evening : penalties.weekday;
}

export interface LoadedCost {
  employeeId: string;
  weeklyGross: number;
  weeklyLeaveLoading: number;
  weeklyOte: number;
  weeklySuper: number;
  weeklyWorkCover: number;
  weeklyLoaded: number;
  monthlyLoaded: number;
  byUnitWeekly: Record<UnitId, number>;
  byUnitMonthly: Record<UnitId, number>;
  hoursByUnit: Record<UnitId, number>;
  totalHours: number;
}

const ZERO_UNITS = (): Record<UnitId, number> => ({ cafe: 0, wine: 0, catering: 0 });

function unitFor(dayPart: DayPart): UnitId {
  return DAY_PARTS.find((d) => d.id === dayPart)?.unit ?? 'cafe';
}

/**
 * Fully loaded labour for one person.
 * Owners: monthly drawings (salary) do not multiply by rostered hours.
 * Roster hours still exist for coverage. Super + WorkCover apply to drawings.
 * Casuals: 25% loading is applied only when the flag says the rate does not already include it.
 * Permanents: 17.5% leave loading on 4 weeks ordinary, spread over 52 weeks (assumption).
 */
export function fullyLoadedCost(
  emp: Employee,
  roster: RosterCell[],
  penalties: PenaltyRates,
  workCoverPer100: number,
  weeksPerMonth: number,
  opts?: { includeSalary?: boolean },
): LoadedCost {
  const includeSalary = opts?.includeSalary ?? true;
  const cells = roster.filter((c) => c.employeeId === emp.id && c.hours > 0);
  const hoursByUnit = ZERO_UNITS();
  let totalHours = 0;
  const grossByUnit = ZERO_UNITS();

  if (emp.employmentType === 'owner') {
    for (const c of cells) {
      hoursByUnit[unitFor(c.dayPart)] += c.hours;
      totalHours += c.hours;
    }
    const monthlySalary = includeSalary ? emp.monthlySalary : 0;
    const monthlySuper = monthlySalary * (emp.superPct / 100);
    const monthlyWc = emp.workCoverApplies
      ? monthlySalary * (workCoverPer100 / 100)
      : 0;
    const monthlyLoaded = monthlySalary + monthlySuper + monthlyWc;
    const weeklyLoaded = weeksPerMonth === 0 ? 0 : monthlyLoaded / weeksPerMonth;
    const weeklySalary = weeksPerMonth === 0 ? 0 : monthlySalary / weeksPerMonth;
    const byUnitWeekly = ZERO_UNITS();
    const byUnitMonthly = ZERO_UNITS();
    const hourTotal = totalHours || 1;
    for (const u of ['cafe', 'wine', 'catering'] as UnitId[]) {
      const share = totalHours === 0 ? (u === 'cafe' ? 1 : 0) : hoursByUnit[u] / hourTotal;
      byUnitMonthly[u] = monthlyLoaded * share;
      byUnitWeekly[u] = weeklyLoaded * share;
    }
    return {
      employeeId: emp.id,
      weeklyGross: weeklySalary,
      weeklyLeaveLoading: 0,
      weeklyOte: weeklySalary,
      weeklySuper: weeksPerMonth === 0 ? 0 : monthlySuper / weeksPerMonth,
      weeklyWorkCover: weeksPerMonth === 0 ? 0 : monthlyWc / weeksPerMonth,
      weeklyLoaded,
      monthlyLoaded,
      byUnitWeekly,
      byUnitMonthly,
      hoursByUnit,
      totalHours,
    };
  }

  const rate = ordinaryHourlyRate(emp);
  for (const c of cells) {
    const mult = penaltyMultiplier(c.day, c.dayPart, penalties);
    const cost = rate * c.hours * mult;
    const u = unitFor(c.dayPart);
    grossByUnit[u] += cost;
    hoursByUnit[u] += c.hours;
    totalHours += c.hours;
  }

  const weeklyGross = grossByUnit.cafe + grossByUnit.wine + grossByUnit.catering;
  const ordinaryHours = totalHours;
  const weeklyLeaveLoading =
    emp.employmentType === 'permanent'
      ? (rate * ordinaryHours * 4 * (emp.leaveLoadingPct / 100)) / 52
      : 0;
  const weeklyOte = weeklyGross + weeklyLeaveLoading;
  const weeklySuper = weeklyOte * (emp.superPct / 100);
  const weeklyWorkCover = emp.workCoverApplies
    ? weeklyOte * (workCoverPer100 / 100)
    : 0;
  const weeklyLoaded = weeklyOte + weeklySuper + weeklyWorkCover;
  const monthlyLoaded = weeklyLoaded * weeksPerMonth;

  const byUnitWeekly = ZERO_UNITS();
  const byUnitMonthly = ZERO_UNITS();
  const loadedFactor = weeklyGross === 0 ? 0 : weeklyLoaded / weeklyGross;
  for (const u of ['cafe', 'wine', 'catering'] as UnitId[]) {
    byUnitWeekly[u] = grossByUnit[u] * loadedFactor;
    byUnitMonthly[u] = byUnitWeekly[u] * weeksPerMonth;
  }

  return {
    employeeId: emp.id,
    weeklyGross,
    weeklyLeaveLoading,
    weeklyOte,
    weeklySuper,
    weeklyWorkCover,
    weeklyLoaded,
    monthlyLoaded,
    byUnitWeekly,
    byUnitMonthly,
    hoursByUnit,
    totalHours,
  };
}

export function labourTotals(
  employees: Employee[],
  roster: RosterCell[],
  penalties: PenaltyRates,
  workCoverPer100: number,
  weeksPerMonth: number,
  ownerInclude: { 1: boolean; 2: boolean } = { 1: true, 2: true },
): { people: LoadedCost[]; weekly: number; monthly: number; byUnitMonthly: Record<UnitId, number> } {
  const people = employees.map((e) => {
    const includeSalary =
      !e.isOwner ||
      (e.ownerIndex === 1 ? ownerInclude[1] : e.ownerIndex === 2 ? ownerInclude[2] : true);
    return fullyLoadedCost(e, roster, penalties, workCoverPer100, weeksPerMonth, {
      includeSalary,
    });
  });
  const byUnitMonthly = ZERO_UNITS();
  let weekly = 0;
  let monthly = 0;
  for (const p of people) {
    weekly += p.weeklyLoaded;
    monthly += p.monthlyLoaded;
    byUnitMonthly.cafe += p.byUnitMonthly.cafe;
    byUnitMonthly.wine += p.byUnitMonthly.wine;
    byUnitMonthly.catering += p.byUnitMonthly.catering;
  }
  return { people, weekly, monthly, byUnitMonthly };
}
