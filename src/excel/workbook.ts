import type ExcelJS from 'exceljs';
import { computeModel } from '../calc/model';
import { startupItemAmount } from '../calc/startup';
import { toMonthly } from '../calc/frequency';
import type {
  AppState,
  DayPart,
  Employee,
  EmploymentType,
  Frequency,
  OutgoingItem,
  Partner,
  RevenueStream,
  RosterCell,
  StartupItem,
  Theme,
  UnitId,
  Weekday,
} from '../types';

async function loadExcel() {
  const mod = await import('exceljs');
  return mod.default;
}

const AUD = '"$"#,##0.00';
const PCT = '0.0%';
const COLORS: Record<string, string> = {
  Dashboard: 'C4B08A',
  Startup: 'D9C7A3',
  Outgoings: 'C9BBA6',
  Labour: 'B7A48A',
  Employees: 'E6D7BF',
  Revenue: 'A3B07A',
  Loans: '8C7A62',
  Partners: 'DCCBB0',
  Settings: 'C2B49A',
};

function header(row: ExcelJS.Row, fills: string) {
  row.font = { bold: true, color: { argb: 'FF2C2416' }, name: 'Calibri', size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + fills } };
  row.alignment = { vertical: 'middle', wrapText: true };
  row.height = 22;
}

function moneyCol(ws: ExcelJS.Worksheet, col: number, last: number) {
  for (let r = 2; r <= last; r++) {
    const cell = ws.getCell(r, col);
    cell.numFmt = AUD;
  }
}

function freeze(ws: ExcelJS.Worksheet) {
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
}

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: (string | number | boolean | null)[][],
  moneyCols: number[] = [],
) {
  const ws = wb.addWorksheet(name, {
    properties: { tabColor: { argb: 'FF' + (COLORS[name] ?? 'C4B08A') } },
  });
  const head = ws.addRow(headers);
  header(head, COLORS[name] ?? 'C4B08A');
  for (const r of rows) ws.addRow(r);
  headers.forEach((_, i) => {
    ws.getColumn(i + 1).width = Math.max(14, String(headers[i]).length + 4);
  });
  for (const c of moneyCols) moneyCol(ws, c, 1 + rows.length);
  freeze(ws);
  return ws;
}

export async function exportWorkbook(state: AppState): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcel();
  const model = computeModel(state);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Roma Deli Planner';
  wb.created = new Date();

  addSheet(
    wb,
    'Dashboard',
    ['Metric', 'Amount (AUD)', 'Notes'],
    [
      ['As of (seed)', state.asOf, 'Darwin snapshot 30 Aug 2026'],
      ['Cafe unit on', state.units.cafe ? 1 : 0, 'Persisted toggle'],
      ['Wine bar on', state.units.wine ? 1 : 0, 'Persisted toggle'],
      ['Catering on', state.units.catering ? 1 : 0, 'Persisted toggle'],
      ['Startup total', model.startupTotal, 'After persisted unit toggles + contingency'],
      ['Monthly revenue', model.revenue, 'All active units'],
      ['Monthly COGS', model.cogs, ''],
      ['Monthly other variable', model.otherVar, ''],
      ['Monthly labour (fully loaded)', model.labourMonthly, 'Super + WorkCover + loadings'],
      ['Monthly contribution', model.contribution, 'Revenue − COGS − var − labour'],
      ['Monthly fixed / extra', model.fixedTotal, 'Outgoings of active units'],
      ['Monthly operating profit', model.operatingProfit, 'Before debt & drawings'],
      ['Labour / sales', model.labourToSales, 'Ratio'],
      ['Prime cost %', model.primeCostPct / 100, '(COGS + labour) / revenue'],
      ['Break-even cafe covers/day', model.breakEvenCafeCoversPerDay ?? 0, 'Assumption: contribution per cover after COGS+var, covering cafe labour+fixed'],
      ['Cash after debt', model.cashAfterDebt, 'Operating profit − both repayments'],
      ['Cash after debt + drawings', model.cashAfterDebtAndDrawings, ''],
      [`${state.partners[0]?.name ?? 'Partner A (Small)'} share %`, (state.partners[0]?.sharePct ?? 0) / 100, 'Seed 70% Partner A (Small)'],
      [`${state.partners[1]?.name ?? 'Partner B (Sudy)'} share %`, (state.partners[1]?.sharePct ?? 0) / 100, 'Seed 30% Partner B (Sudy)'],
    ],
    [2],
  );
  const dash = wb.getWorksheet('Dashboard')!;
  dash.getCell('B14').numFmt = PCT;
  dash.getCell('B15').numFmt = '0.0';
  dash.getCell('B19').numFmt = PCT;
  dash.getCell('B20').numFmt = PCT;

  addSheet(
    wb,
    'Startup',
    ['id', 'categoryId', 'unit', 'name', 'newPrice', 'usedPrice', 'condition', 'excludeFromContingency', 'supplier', 'url', 'notes', 'final', 'category', 'calculated'],
    state.startupItems.map((i) => [
      i.id,
      i.categoryId,
      i.unit,
      i.name,
      i.newPrice,
      i.usedPrice,
      i.condition,
      i.excludeFromContingency,
      i.supplier,
      i.url,
      i.notes,
      i.final,
      i.category ?? '',
      startupItemAmount(i),
    ]),
    [5, 6, 14],
  );
  const startWs = wb.getWorksheet('Startup')!;
  startWs.addRow([]);
  startWs.addRow(['CONTINGENCY', 'categoryId', 'name', 'unit', 'pct', 'base', 'amount', 'total']);
  for (const c of model.startup) {
    startWs.addRow(['', c.categoryId, c.name, c.unit, c.contingencyPct / 100, c.contingencyBase, c.contingency, c.total]);
  }

  addSheet(
    wb,
    'Outgoings',
    ['id', 'categoryId', 'unit', 'name', 'cost', 'frequency', 'monthly', 'annual', 'notes', 'final', 'category'],
    state.outgoingItems.map((i) => [
      i.id,
      i.categoryId,
      i.unit,
      i.name,
      i.cost,
      i.frequency,
      toMonthly(i.cost, i.frequency),
      toMonthly(i.cost, i.frequency) * 12,
      i.notes,
      i.final,
      i.category ?? '',
    ]),
    [5, 7, 8],
  );

  addSheet(
    wb,
    'Labour',
    ['id', 'employeeId', 'day', 'dayPart', 'hours', 'notes', 'startHour', 'endHour'],
    state.roster.map((c) => [
      c.id,
      c.employeeId,
      c.day,
      c.dayPart,
      c.hours,
      '',
      c.startHour ?? '',
      c.endHour ?? '',
    ]),
  );

  addSheet(
    wb,
    'Employees',
    [
      'id', 'name', 'role', 'isOwner', 'ownerIndex', 'employmentType', 'hourlyRate', 'monthlySalary',
      'superPct', 'leaveLoadingPct', 'casualLoadingPct', 'rateIncludesCasualLoading', 'workCoverApplies', 'notes',
    ],
    state.employees.map((e) => [
      e.id, e.name, e.role, e.isOwner, e.ownerIndex ?? '', e.employmentType, e.hourlyRate, e.monthlySalary,
      e.superPct / 100, e.leaveLoadingPct / 100, e.casualLoadingPct / 100, e.rateIncludesCasualLoading,
      e.workCoverApplies,
      e.employmentType === 'casual' && e.rateIncludesCasualLoading
        ? 'Rate already includes casual loading (Casual Senior $42 = 35+7). Do not double-count.'
        : '',
    ]),
    [7, 8],
  );

  addSheet(
    wb,
    'Revenue',
    [
      'id', 'name', 'unit', 'daysPerMonth', 'hoursPerSession', 'volume', 'aov', 'cogsPct', 'otherVarPct',
      'extraFixedMonthly', 'usesMealFormula', 'mealsPerDay', 'daysPerWeek', 'weeksPerMonth', 'optimisticVolume', 'notes',
    ],
    state.revenue.map((s) => [
      s.id, s.name, s.unit, s.daysPerMonth, s.hoursPerSession, s.volume, s.aov, s.cogsPct / 100,
      s.otherVarPct / 100, s.extraFixedMonthly, s.usesMealFormula, s.mealsPerDay, s.daysPerWeek,
      s.weeksPerMonth, s.optimisticVolume, s.notes,
    ]),
    [7, 10],
  );

  addSheet(
    wb,
    'Loans',
    ['partnerId', 'name', 'principal', 'interestPa', 'monthlyRepayment', 'monthsToClear', 'totalInterest', 'compounding', 'notes'],
    model.partners.map((p) => [
      p.id, p.name, p.principal, p.interestPa, p.monthlyRepayment,
      p.amort.monthsToClear, p.amort.totalInterest, state.assumptions.compounding,
      'Principal defaults to this partner’s share of startup unless principalOverride is set on Partners.',
    ]),
    [3, 5, 7],
  );

  addSheet(
    wb,
    'Partners',
    ['id', 'name', 'sharePct', 'monthlyRepayment', 'interestPa', 'principalOverride', 'notes'],
    state.partners.map((p) => [
      p.id, p.name, p.sharePct / 100, p.monthlyRepayment, p.interestPa, p.principalOverride,
      p.id === 'p-a'
        ? 'Seed 70% Partner A (Small); repayment left at $0 so it is not invented'
        : 'Seed 30% Partner B (Sudy) / $6,000 per month',
    ]),
    [4, 6],
  );

  addSheet(
    wb,
    'Settings',
    ['key', 'value', 'notes'],
    [
      ['theme', state.theme, ''],
      ['superPct', state.assumptions.superPct / 100, 'ATO 2026–27 Super Guarantee. Assumption applied in labour loader.'],
      ['workCoverPer100', state.assumptions.workCoverPer100, 'WorkCover QLD WIC 451113 $1.160 per $100 wages. Editable assumption.'],
      ['weeksPerMonthLabour', state.assumptions.weeksPerMonthLabour, '52/12. Catering meals still use 4 weeks as in the Darwin model.'],
      ['compounding', state.assumptions.compounding, 'Loan default is monthly compounding.'],
      ['fairWorkL2CasualOrdinary', state.assumptions.fairWorkL2CasualOrdinary, 'Fair Work L2 casual ordinary 1 Jul 2026 $33.85/h. Reference, not auto-applied.'],
      ['hospitalityAward', state.assumptions.hospitalityAward, 'QLD Hospitality Award MA000009'],
      ['penalty.weekday', state.penalties.weekday, 'Assumption: multiplier, editable on Labour'],
      ['penalty.evening', state.penalties.evening, '7–10pm (wine bar weekday hours use this)'],
      ['penalty.saturday', state.penalties.saturday, ''],
      ['penalty.sunday', state.penalties.sunday, ''],
      ['penalty.saturdayEvening', state.penalties.saturdayEvening, ''],
      ['penalty.sundayEvening', state.penalties.sundayEvening, ''],
      ['unit.cafe', state.units.cafe ? 1 : 0, 'Persisted. Home preview toggles do not write this.'],
      ['unit.wine', state.units.wine ? 1 : 0, ''],
      ['unit.catering', state.units.catering ? 1 : 0, ''],
      ['contingency.sc-cafe', 0.1, '10% of cafe startup excluding working capital'],
      ['contingency.sc-wine', 0.1, '10% of wine capex excluding stock and liquor'],
      ['contingency.sc-cat', 0.1, '10% of catering startup items'],
    ],
  );

  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

function cell(row: ExcelJS.Row, col: number): string {
  const v = row.getCell(col).value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'text' in v) return String((v as { text: string }).text);
  if (typeof v === 'object' && 'result' in v) return String((v as { result: unknown }).result ?? '');
  if (typeof v === 'object' && 'hyperlink' in v) {
    const h = v as { text?: string; hyperlink: string };
    return String(h.text ?? h.hyperlink);
  }
  return String(v);
}

function num(row: ExcelJS.Row, col: number): number {
  const v = row.getCell(col).value;
  if (typeof v === 'number') return v;
  const n = Number(cell(row, col).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(row: ExcelJS.Row, col: number): number | null {
  const v = row.getCell(col).value;
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = cell(row, col).trim();
  if (s === '') return null;
  const n = Number(s.replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function bool(row: ExcelJS.Row, col: number): boolean {
  const v = row.getCell(col).value;
  if (typeof v === 'boolean') return v;
  const s = cell(row, col).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function headerCol(ws: ExcelJS.Worksheet, name: string): number | undefined {
  const head = ws.getRow(1);
  let found: number | undefined;
  head.eachCell((c, col) => {
    if (String(c.value ?? '').trim().toLowerCase() === name.toLowerCase()) found = col;
  });
  return found;
}

function pctVal(row: ExcelJS.Row, col: number): number {
  const v = row.getCell(col).value;
  if (typeof v === 'number') return v > 0 && v <= 1.0001 ? v * 100 : v;
  return num(row, col);
}

export async function importWorkbook(buffer: ArrayBuffer, current: AppState): Promise<AppState> {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const next: AppState = structuredClone(current);

  const employees = wb.getWorksheet('Employees');
  if (employees) {
    const list: Employee[] = [];
    employees.eachRow((row, i) => {
      if (i === 1) return;
      const id = cell(row, 1);
      if (!id || id === 'CONTINGENCY') return;
      const ownerIndexRaw = cell(row, 5);
      list.push({
        id,
        name: cell(row, 2) || 'Unnamed',
        role: cell(row, 3),
        isOwner: bool(row, 4),
        ownerIndex: ownerIndexRaw === '1' || ownerIndexRaw === '2' ? (Number(ownerIndexRaw) as 1 | 2) : undefined,
        employmentType: (cell(row, 6) as EmploymentType) || 'casual',
        hourlyRate: num(row, 7),
        monthlySalary: num(row, 8),
        superPct: pctVal(row, 9),
        leaveLoadingPct: pctVal(row, 10),
        casualLoadingPct: pctVal(row, 11),
        rateIncludesCasualLoading: bool(row, 12),
        workCoverApplies: bool(row, 13),
      });
    });
    if (list.length) next.employees = list;
  }

  const startup = wb.getWorksheet('Startup');
  if (startup) {
    const items: StartupItem[] = [];
    const finalCol = headerCol(startup, 'final');
    const categoryCol = headerCol(startup, 'category');
    startup.eachRow((row, i) => {
      if (i === 1) return;
      const id = cell(row, 1);
      if (!id || id === 'CONTINGENCY') return;
      const condRaw = cell(row, 7).trim().toLowerCase();
      const category = categoryCol ? cell(row, categoryCol) : '';
      items.push({
        id,
        categoryId: cell(row, 2),
        unit: (cell(row, 3) as UnitId) || 'cafe',
        name: cell(row, 4),
        newPrice: num(row, 5),
        usedPrice: numOrNull(row, 6),
        condition: condRaw === 'used' ? 'used' : 'new',
        excludeFromContingency: bool(row, 8),
        supplier: cell(row, 9),
        url: cell(row, 10),
        notes: cell(row, 11),
        final: finalCol ? bool(row, finalCol) : false,
        ...(category.trim() ? { category } : {}),
      });
    });
    if (items.length) next.startupItems = items;
  }

  const outgoings = wb.getWorksheet('Outgoings');
  if (outgoings) {
    const items: OutgoingItem[] = [];
    const finalCol = headerCol(outgoings, 'final');
    const categoryCol = headerCol(outgoings, 'category');
    outgoings.eachRow((row, i) => {
      if (i === 1) return;
      const id = cell(row, 1);
      if (!id) return;
      const category = categoryCol ? cell(row, categoryCol) : '';
      items.push({
        id,
        categoryId: cell(row, 2),
        unit: (cell(row, 3) as UnitId) || 'cafe',
        name: cell(row, 4),
        cost: num(row, 5),
        frequency: (cell(row, 6) as Frequency) || 'monthly',
        notes: cell(row, 9) || cell(row, 7),
        final: finalCol ? bool(row, finalCol) : false,
        ...(category.trim() ? { category } : {}),
      });
    });
    if (items.length) next.outgoingItems = items;
  }

  const labour = wb.getWorksheet('Labour');
  if (labour) {
    const roster: RosterCell[] = [];
    const startCol = headerCol(labour, 'startHour');
    const endCol = headerCol(labour, 'endHour');
    labour.eachRow((row, i) => {
      if (i === 1) return;
      const id = cell(row, 1);
      if (!id) return;
      const startHour = startCol != null ? numOrNull(row, startCol) : null;
      const endHour = endCol != null ? numOrNull(row, endCol) : null;
      const entry: RosterCell = {
        id,
        employeeId: cell(row, 2),
        day: cell(row, 3) as Weekday,
        dayPart: cell(row, 4) as DayPart,
        hours: num(row, 5),
      };
      if (startHour != null) entry.startHour = startHour;
      if (endHour != null) entry.endHour = endHour;
      if (startHour != null && endHour != null) {
        entry.hours = Math.max(0.5, endHour - startHour);
      }
      roster.push(entry);
    });
    if (roster.length) next.roster = roster;
  }

  const rev = wb.getWorksheet('Revenue');
  if (rev) {
    const streams: RevenueStream[] = [];
    rev.eachRow((row, i) => {
      if (i === 1) return;
      const id = cell(row, 1);
      if (!id) return;
      streams.push({
        id,
        name: cell(row, 2),
        unit: (cell(row, 3) as UnitId) || 'cafe',
        daysPerMonth: num(row, 4),
        hoursPerSession: num(row, 5),
        volume: num(row, 6),
        aov: num(row, 7),
        cogsPct: pctVal(row, 8),
        otherVarPct: pctVal(row, 9),
        extraFixedMonthly: num(row, 10),
        usesMealFormula: bool(row, 11),
        mealsPerDay: num(row, 12),
        daysPerWeek: num(row, 13),
        weeksPerMonth: num(row, 14),
        optimisticVolume: num(row, 15),
        notes: cell(row, 16),
      });
    });
    if (streams.length) next.revenue = streams;
  }

  const partners = wb.getWorksheet('Partners');
  if (partners) {
    const list: Partner[] = [];
    partners.eachRow((row, i) => {
      if (i === 1) return;
      const id = cell(row, 1);
      if (!id) return;
      const ov = row.getCell(6).value;
      list.push({
        id,
        name: cell(row, 2),
        sharePct: pctVal(row, 3),
        monthlyRepayment: num(row, 4),
        interestPa: typeof ov === 'number' && num(row, 5) <= 1 ? num(row, 5) : num(row, 5),
        principalOverride: cell(row, 6) === '' ? null : num(row, 6),
      });
    });
    if (list.length) next.partners = list;
  }

  const settings = wb.getWorksheet('Settings');
  if (settings) {
    const map = new Map<string, ExcelJS.Row>();
    settings.eachRow((row, i) => {
      if (i === 1) return;
      map.set(cell(row, 1), row);
    });
    const g = (k: string) => map.get(k);
    const theme = g('theme');
    if (theme) next.theme = (cell(theme, 2) as Theme) || next.theme;
    const superR = g('superPct');
    if (superR) next.assumptions.superPct = pctVal(superR, 2);
    const wc = g('workCoverPer100');
    if (wc) next.assumptions.workCoverPer100 = num(wc, 2);
    const wpm = g('weeksPerMonthLabour');
    if (wpm) next.assumptions.weeksPerMonthLabour = num(wpm, 2);
    const comp = g('compounding');
    if (comp) next.assumptions.compounding = cell(comp, 2) === 'yearly' ? 'yearly' : 'monthly';
    const pen = (k: keyof AppState['penalties'], key: string) => {
      const r = g(key);
      if (r) next.penalties[k] = num(r, 2);
    };
    pen('weekday', 'penalty.weekday');
    pen('evening', 'penalty.evening');
    pen('saturday', 'penalty.saturday');
    pen('sunday', 'penalty.sunday');
    pen('saturdayEvening', 'penalty.saturdayEvening');
    pen('sundayEvening', 'penalty.sundayEvening');
    const uw = g('unit.wine');
    if (uw) next.units.wine = bool(uw, 2);
    const uc = g('unit.catering');
    if (uc) next.units.catering = bool(uc, 2);
    next.units.cafe = true;
  }

  return next;
}
