import type { AppState, Preview, RevenueStream, UnitId } from '../types';
import { toMonthly } from './frequency';
import { labourTotals } from './labour';
import { amortise, type Amortisation } from './loan';
import { splitStartup } from './partners';
import { startupItemAmount } from './startup';

export interface UnitFlags {
  cafe: boolean;
  wine: boolean;
  catering: boolean;
}

export function effectiveUnits(state: AppState, preview?: Preview | null): UnitFlags {
  return {
    cafe: true,
    wine: preview ? preview.wineOn : state.units.wine,
    catering: preview ? preview.cateringOn : state.units.catering,
  };
}

export function isUnitOn(unit: UnitId, flags: UnitFlags): boolean {
  return flags[unit];
}

export interface CategoryStartup {
  categoryId: string;
  name: string;
  unit: UnitId;
  items: number;
  contingencyBase: number;
  contingencyPct: number;
  contingency: number;
  total: number;
}

export function startupByCategory(state: AppState, flags: UnitFlags): CategoryStartup[] {
  return state.startupCategories
    .filter((c) => isUnitOn(c.unit, flags))
    .map((c) => {
      const items = state.startupItems.filter((i) => i.categoryId === c.id);
      const itemsSum = items.reduce((s, i) => s + startupItemAmount(i), 0);
      const contingencyBase = items
        .filter((i) => !i.excludeFromContingency)
        .reduce((s, i) => s + startupItemAmount(i), 0);
      const contingency = Math.round((contingencyBase * c.contingencyPct) / 100);
      return {
        categoryId: c.id,
        name: c.name,
        unit: c.unit,
        items: itemsSum,
        contingencyBase,
        contingencyPct: c.contingencyPct,
        contingency,
        total: itemsSum + contingency,
      };
    });
}

export interface StreamResult {
  id: string;
  name: string;
  unit: UnitId;
  on: boolean;
  volume: number;
  days: number;
  covers: number;
  revenue: number;
  cogs: number;
  otherVar: number;
  labour: number;
  extraFixed: number;
  contribution: number;
  operatingProfit: number;
  aov: number;
  cogsPct: number;
  otherVarPct: number;
}

export function streamVolume(s: RevenueStream, preview?: Preview | null): number {
  if (s.unit === 'cafe' && preview) return preview.cafeCovers;
  if (s.unit === 'wine' && preview) return preview.wineCovers;
  if (s.unit === 'catering') {
    const meals = preview ? preview.mealsPerDay : s.mealsPerDay;
    if (s.usesMealFormula) return meals * s.daysPerWeek * s.weeksPerMonth;
    return preview ? meals : s.volume;
  }
  return s.volume;
}

export interface PartnerPayback {
  id: string;
  name: string;
  sharePct: number;
  startupShare: number;
  principal: number;
  monthlyRepayment: number;
  interestPa: number;
  amort: Amortisation;
  profitShare: number;
  cashAfterDebt: number;
  cashAfterDebtAndDrawings: number;
}

export interface BusinessModel {
  flags: UnitFlags;
  startup: CategoryStartup[];
  startupTotal: number;
  outgoingsMonthly: number;
  outgoingsAnnual: number;
  outgoingsByUnit: Record<UnitId, number>;
  labourWeekly: number;
  labourMonthly: number;
  labourByUnit: Record<UnitId, number>;
  labourPeople: ReturnType<typeof labourTotals>['people'];
  streams: StreamResult[];
  revenue: number;
  cogs: number;
  otherVar: number;
  contribution: number;
  extraFixed: number;
  fixedTotal: number;
  operatingProfit: number;
  labourToSales: number;
  primeCostPct: number;
  breakEvenCafeCoversPerDay: number | null;
  ownerDrawings: number;
  partners: PartnerPayback[];
  cashAfterDebt: number;
  cashAfterDebtAndDrawings: number;
}

export function computeModel(state: AppState, preview?: Preview | null): BusinessModel {
  const flags = effectiveUnits(state, preview);
  const startup = startupByCategory(state, flags);
  const startupTotal = startup.reduce((s, c) => s + c.total, 0);

  const outgoingsByUnit: Record<UnitId, number> = { cafe: 0, wine: 0, catering: 0 };
  for (const item of state.outgoingItems) {
    if (!isUnitOn(item.unit, flags)) continue;
    outgoingsByUnit[item.unit] += toMonthly(item.cost, item.frequency);
  }
  const outgoingsMonthly = outgoingsByUnit.cafe + outgoingsByUnit.wine + outgoingsByUnit.catering;

  const ownerInclude = {
    1: preview ? preview.includeOwner1Salary : true,
    2: preview ? preview.includeOwner2Salary : true,
  };
  const labour = labourTotals(
    state.employees,
    state.roster,
    state.penalties,
    state.assumptions.workCoverPer100,
    state.assumptions.weeksPerMonthLabour,
    ownerInclude,
  );

  const labourByUnit: Record<UnitId, number> = { cafe: 0, wine: 0, catering: 0 };
  labourByUnit.cafe = labour.byUnitMonthly.cafe;
  labourByUnit.wine = flags.wine ? labour.byUnitMonthly.wine : 0;
  labourByUnit.catering = flags.catering ? labour.byUnitMonthly.catering : 0;
  const labourMonthly = labourByUnit.cafe + labourByUnit.wine + labourByUnit.catering;
  const labourWeekly = labourMonthly / state.assumptions.weeksPerMonthLabour;

  const streams: StreamResult[] = state.revenue.map((s) => {
    const on = isUnitOn(s.unit, flags);
    const volume = streamVolume(s, preview);
    const covers = s.usesMealFormula ? volume : volume * s.daysPerMonth;
    const days = s.usesMealFormula ? s.daysPerWeek * s.weeksPerMonth : s.daysPerMonth;
    const revenue = on ? (s.usesMealFormula ? volume * s.aov : volume * s.aov * s.daysPerMonth) : 0;
    const cogs = revenue * (s.cogsPct / 100);
    const otherVar = revenue * (s.otherVarPct / 100);
    const lab = on ? labourByUnit[s.unit] : 0;
    const extraFixed = on ? outgoingsByUnit[s.unit] : 0;
    const contribution = revenue - cogs - otherVar - lab;
    const operatingProfit = contribution - extraFixed;
    return {
      id: s.id,
      name: s.name,
      unit: s.unit,
      on,
      volume,
      days,
      covers,
      revenue,
      cogs,
      otherVar,
      labour: lab,
      extraFixed,
      contribution,
      operatingProfit,
      aov: s.aov,
      cogsPct: s.cogsPct,
      otherVarPct: s.otherVarPct,
    };
  });

  const revenue = streams.reduce((s, x) => s + x.revenue, 0);
  const cogs = streams.reduce((s, x) => s + x.cogs, 0);
  const otherVar = streams.reduce((s, x) => s + x.otherVar, 0);
  const contribution = streams.reduce((s, x) => s + x.contribution, 0);
  const extraFixed = streams.reduce((s, x) => s + x.extraFixed, 0);
  const operatingProfit = streams.reduce((s, x) => s + x.operatingProfit, 0);
  const labourToSales = revenue === 0 ? 0 : labourMonthly / revenue;
  const primeCostPct = revenue === 0 ? 0 : ((cogs + labourMonthly) / revenue) * 100;

  const cafe = streams.find((s) => s.unit === 'cafe');
  let breakEvenCafeCoversPerDay: number | null = null;
  if (cafe && cafe.aov > 0) {
    const contribPerCover = cafe.aov * (1 - cafe.cogsPct / 100 - cafe.otherVarPct / 100);
    const days = cafe.days || 1;
    if (contribPerCover > 0) {
      breakEvenCafeCoversPerDay = (cafe.extraFixed + cafe.labour) / contribPerCover / days;
    }
  }

  const ownerDrawings = state.employees
    .filter((e) => e.isOwner)
    .reduce((s, e) => {
      if (e.ownerIndex === 1 && preview && !preview.includeOwner1Salary) return s;
      if (e.ownerIndex === 2 && preview && !preview.includeOwner2Salary) return s;
      return s + e.monthlySalary;
    }, 0);

  const splits = splitStartup(startupTotal, state.partners);
  const partners: PartnerPayback[] = splits.map((sp) => {
    const p = state.partners.find((x) => x.id === sp.id)!;
    const amort = amortise({
      principal: sp.principal,
      interestPa: p.interestPa,
      monthlyRepayment: p.monthlyRepayment,
      compounding: state.assumptions.compounding,
    });
    const profitShare = operatingProfit * sp.shareFraction;
    const cashAfterDebt = profitShare - p.monthlyRepayment;
    const drawingsShare = ownerDrawings * sp.shareFraction;
    return {
      id: sp.id,
      name: sp.name,
      sharePct: sp.sharePct,
      startupShare: sp.startupShare,
      principal: sp.principal,
      monthlyRepayment: p.monthlyRepayment,
      interestPa: p.interestPa,
      amort,
      profitShare,
      cashAfterDebt,
      cashAfterDebtAndDrawings: cashAfterDebt - drawingsShare,
    };
  });

  const debtRepay = partners.reduce((s, p) => s + p.monthlyRepayment, 0);
  const cashAfterDebt = operatingProfit - debtRepay;
  const cashAfterDebtAndDrawings = cashAfterDebt - ownerDrawings;

  return {
    flags,
    startup,
    startupTotal,
    outgoingsMonthly,
    outgoingsAnnual: outgoingsMonthly * 12,
    outgoingsByUnit,
    labourWeekly,
    labourMonthly,
    labourByUnit,
    labourPeople: labour.people,
    streams,
    revenue,
    cogs,
    otherVar,
    contribution,
    extraFixed,
    fixedTotal: extraFixed,
    operatingProfit,
    labourToSales,
    primeCostPct,
    breakEvenCafeCoversPerDay,
    ownerDrawings,
    partners,
    cashAfterDebt,
    cashAfterDebtAndDrawings,
  };
}

/**
 * Pure overlay. Clones state in memory for preview math.
 * Must never be written back to localStorage.
 */
export function applyPreview(state: AppState, preview: Preview): AppState {
  const clone: AppState = structuredClone(state);
  clone.units = { cafe: true, wine: preview.wineOn, catering: preview.cateringOn };
  const cafe = clone.revenue.find((r) => r.unit === 'cafe');
  const wine = clone.revenue.find((r) => r.unit === 'wine');
  const cat = clone.revenue.find((r) => r.unit === 'catering');
  if (cafe) cafe.volume = preview.cafeCovers;
  if (wine) wine.volume = preview.wineCovers;
  if (cat) {
    cat.mealsPerDay = preview.mealsPerDay;
    if (cat.usesMealFormula) {
      cat.volume = preview.mealsPerDay * cat.daysPerWeek * cat.weeksPerMonth;
    }
  }
  return clone;
}
