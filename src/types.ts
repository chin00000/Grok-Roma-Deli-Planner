export type UnitId = 'cafe' | 'wine' | 'catering';
export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type EmploymentType = 'casual' | 'permanent' | 'owner';
export type DayPart = 'coffee_rush' | 'cafe_deli' | 'catering_prep' | 'wine_bar';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type Theme = 'light' | 'dark';
export type Compounding = 'monthly' | 'yearly';
export type TabId =
  | 'home'
  | 'startup'
  | 'outgoings'
  | 'labour'
  | 'revenue'
  | 'payback'
  | 'settings';

export const UNITS: { id: UnitId; label: string }[] = [
  { id: 'cafe', label: 'Cafe' },
  { id: 'wine', label: 'Wine bar' },
  { id: 'catering', label: 'Catering' },
];

export const DAYS: { id: Weekday; label: string; short: string }[] = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
  { id: 'sun', label: 'Sunday', short: 'Sun' },
];

export const DAY_PARTS: { id: DayPart; label: string; unit: UnitId }[] = [
  { id: 'coffee_rush', label: 'Coffee rush', unit: 'cafe' },
  { id: 'cafe_deli', label: 'Cafe / deli', unit: 'cafe' },
  { id: 'catering_prep', label: 'Catering prep', unit: 'catering' },
  { id: 'wine_bar', label: 'Wine bar', unit: 'wine' },
];

export const FREQUENCIES: Frequency[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

export interface StartupCategory {
  id: string;
  name: string;
  unit: UnitId;
  contingencyPct: number;
  sort: number;
}

export type ItemCondition = 'new' | 'used';

export interface StartupItem {
  id: string;
  categoryId: string;
  name: string;
  /** Free-text grouping inside a department window. Missing/blank = uncategorised. */
  category?: string;
  newPrice: number;
  usedPrice: number | null;
  condition: ItemCondition;
  notes: string;
  supplier: string;
  url: string;
  unit: UnitId;
  excludeFromContingency: boolean;
  final: boolean;
}

export interface OutgoingCategory {
  id: string;
  name: string;
  unit: UnitId;
  sort: number;
}

export interface OutgoingItem {
  id: string;
  categoryId: string;
  name: string;
  /** Free-text grouping inside a department window. Missing/blank = uncategorised. */
  category?: string;
  cost: number;
  frequency: Frequency;
  notes: string;
  unit: UnitId;
  final: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  ownerIndex?: 1 | 2;
  employmentType: EmploymentType;
  hourlyRate: number;
  monthlySalary: number;
  superPct: number;
  leaveLoadingPct: number;
  casualLoadingPct: number;
  rateIncludesCasualLoading: boolean;
  workCoverApplies: boolean;
}

export interface RosterCell {
  id: string;
  employeeId: string;
  day: Weekday;
  dayPart: DayPart;
  hours: number;
  /** Hours from midnight (e.g. 8.5 = 8:30). Optional on older cells. */
  startHour?: number;
  endHour?: number;
}

export type RosterDept = 'deli' | 'catering' | 'wine';

export const DAY_PART_START: Record<DayPart, number> = {
  coffee_rush: 6,
  cafe_deli: 8,
  catering_prep: 9,
  wine_bar: 17,
};

export const ROSTER_DEPTS: { id: RosterDept; label: string }[] = [
  { id: 'deli', label: 'Deli' },
  { id: 'catering', label: 'Catering' },
  { id: 'wine', label: 'Wine' },
];

export function deptOf(dayPart: DayPart): RosterDept {
  if (dayPart === 'catering_prep') return 'catering';
  if (dayPart === 'wine_bar') return 'wine';
  return 'deli';
}

export function dayPartForDept(dept: RosterDept, startHour: number): DayPart {
  if (dept === 'catering') return 'catering_prep';
  if (dept === 'wine') return 'wine_bar';
  return startHour < 8 ? 'coffee_rush' : 'cafe_deli';
}

export function nextDept(dept: RosterDept): RosterDept {
  const order: RosterDept[] = ['deli', 'catering', 'wine'];
  return order[(order.indexOf(dept) + 1) % order.length] ?? 'deli';
}

export function snapHalf(h: number): number {
  return Math.round(h * 2) / 2;
}

/** Infer start/end for cells that only have hours. Does not mutate the cell. */
export function inferTimes(cell: RosterCell): { startHour: number; endHour: number; hours: number } {
  let start = cell.startHour;
  let end = cell.endHour;
  if (typeof start !== 'number' || Number.isNaN(start) || typeof end !== 'number' || Number.isNaN(end)) {
    start = DAY_PART_START[cell.dayPart] ?? 8;
    end = start + (Number(cell.hours) || 0);
  }
  const hours = Math.max(0.5, end - start);
  return { startHour: start, endHour: start + hours, hours };
}

export function cellWithRange(
  cell: RosterCell,
  startHour: number,
  endHour: number,
  day: Weekday = cell.day,
): RosterCell {
  const start = snapHalf(startHour);
  const end = snapHalf(endHour);
  const hours = Math.max(0.5, end - start);
  const dept = deptOf(cell.dayPart);
  return {
    ...cell,
    day,
    startHour: start,
    endHour: start + hours,
    hours,
    dayPart: dayPartForDept(dept, start),
  };
}

export interface PenaltyRates {
  weekday: number;
  evening: number;
  saturday: number;
  sunday: number;
  saturdayEvening: number;
  sundayEvening: number;
}

export interface RevenueStream {
  id: string;
  name: string;
  unit: UnitId;
  daysPerMonth: number;
  hoursPerSession: number;
  volume: number;
  aov: number;
  cogsPct: number;
  otherVarPct: number;
  extraFixedMonthly: number;
  notes: string;
  optimisticVolume: number;
  mealsPerDay: number;
  daysPerWeek: number;
  weeksPerMonth: number;
  usesMealFormula: boolean;
}

export interface Partner {
  id: string;
  name: string;
  sharePct: number;
  monthlyRepayment: number;
  interestPa: number;
  principalOverride: number | null;
}

export interface Assumptions {
  superPct: number;
  workCoverPer100: number;
  weeksPerMonthLabour: number;
  compounding: Compounding;
  fairWorkL2CasualOrdinary: number;
  hospitalityAward: string;
}

export interface UnitToggles {
  cafe: boolean;
  wine: boolean;
  catering: boolean;
}

export interface AppState {
  version: number;
  asOf: string;
  units: UnitToggles;
  startupCategories: StartupCategory[];
  startupItems: StartupItem[];
  outgoingCategories: OutgoingCategory[];
  outgoingItems: OutgoingItem[];
  employees: Employee[];
  roster: RosterCell[];
  penalties: PenaltyRates;
  revenue: RevenueStream[];
  partners: Partner[];
  assumptions: Assumptions;
  theme: Theme;
}

/** Home view-only overlays. Never persisted. */
export interface Preview {
  wineOn: boolean;
  cateringOn: boolean;
  includeOwner1Salary: boolean;
  includeOwner2Salary: boolean;
  cafeCovers: number;
  wineCovers: number;
  mealsPerDay: number;
}

export function defaultPreview(state: AppState): Preview {
  const cafe = state.revenue.find((r) => r.unit === 'cafe');
  const wine = state.revenue.find((r) => r.unit === 'wine');
  const cat = state.revenue.find((r) => r.unit === 'catering');
  return {
    wineOn: state.units.wine,
    cateringOn: state.units.catering,
    includeOwner1Salary: true,
    includeOwner2Salary: true,
    cafeCovers: cafe?.volume ?? 90,
    wineCovers: wine?.volume ?? 32,
    mealsPerDay: cat?.mealsPerDay ?? 15,
  };
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
