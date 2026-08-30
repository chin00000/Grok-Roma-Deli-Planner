import type { AppState } from './types';

/** Darwin seed, 30 Aug 2026. Figures from the Roma Deli estimates workbook. */
export function seedState(): AppState {
  return {
    version: 2,
    asOf: '2026-08-30',
    units: { cafe: true, wine: true, catering: true },
    theme: 'light',
    assumptions: {
      superPct: 12,
      workCoverPer100: 1.16,
      weeksPerMonthLabour: 52 / 12,
      compounding: 'monthly',
      fairWorkL2CasualOrdinary: 33.85,
      hospitalityAward: 'MA000009',
    },
    penalties: {
      weekday: 1,
      evening: 1.1,
      saturday: 1.25,
      sunday: 1.5,
      saturdayEvening: 1.5,
      sundayEvening: 1.75,
    },
    startupCategories: [
      { id: 'sc-cafe', name: 'Cafe startup', unit: 'cafe', contingencyPct: 10, sort: 1 },
      { id: 'sc-wine', name: 'Wine bar startup', unit: 'wine', contingencyPct: 10, sort: 2 },
      { id: 'sc-cat', name: 'Catering startup', unit: 'catering', contingencyPct: 10, sort: 3 },
    ],
    startupItems: [
      { id: 'si-lease', categoryId: 'sc-cafe', unit: 'cafe', name: 'Lease bond / security deposit', newPrice: 4050, usedPrice: null, condition: 'new', notes: 'Shared premises', supplier: '', url: '', excludeFromContingency: false, final: false },
      { id: 'si-sol', categoryId: 'sc-cafe', unit: 'cafe', name: 'Solicitor fees', newPrice: 8000, usedPrice: null, condition: 'new', notes: 'GST-ex professional fees, QLD retail lease review + limited negotiation. Form-12-only $1,395 inc GST (Queensland Legal). SHA is a separate line.', supplier: 'Astris Law / Qld Legal', url: '', excludeFromContingency: false, final: false },
      { id: 'si-sha', categoryId: 'sc-cafe', unit: 'cafe', name: 'Shareholders / partnership agreement', newPrice: 2500, usedPrice: null, condition: 'new', notes: 'Sprintlaw SHA from $1,200+GST ($1,320); partnership agreement from $1,100+GST. Astris company+SHA $3,500–$8,000. Mid $2,500. Dashboard seed ownership is 70/30 Partner A (Small) / Partner B (Sudy).', supplier: 'Sprintlaw SHA', url: '', excludeFromContingency: false, final: false },
      { id: 'si-fit', categoryId: 'sc-cafe', unit: 'cafe', name: 'Shop fit-out & renovations (cafe)', newPrice: 50000, usedPrice: null, condition: 'new', notes: 'Warm-shell realistic ~$50k; new exhaust/grease trap/services ~$80k. Exhaust/hand basin/electrical live here, not in kitchen equipment.', supplier: 'Templeton Built / Access Projects', url: '', excludeFromContingency: false, final: false },
      { id: 'si-coffee', categoryId: 'sc-cafe', unit: 'cafe', name: 'Coffee equipment (machine + grinders)', newPrice: 16000, usedPrice: null, condition: 'new', notes: '', supplier: '', url: '', excludeFromContingency: false, final: false },
      { id: 'si-kit', categoryId: 'sc-cafe', unit: 'cafe', name: 'Kitchen equipment', newPrice: 29000, usedPrice: null, condition: 'new', notes: 'Mid BOM ~$28,827 inc GST: Panasonic NE-1853, Turbofan E27M3, FED-X fridge/freezer, Bonvue SL830V, Roband press, Washtech XG, milk fridge, pie warmer, slicer, ice.', supplier: 'Reward / Leading Catering / Stellar', url: '', excludeFromContingency: false, final: false },
      { id: 'si-furn', categoryId: 'sc-cafe', unit: 'cafe', name: 'Furniture, counters', newPrice: 15000, usedPrice: null, condition: 'new', notes: 'Loose furniture ~$2,300 inc GST. Remainder modest barista joinery. If joinery is already in fit-out, drop this cell to $4,500.', supplier: 'Cafe Solutions Brendale', url: '', excludeFromContingency: false, final: false },
      { id: 'si-pos', categoryId: 'sc-cafe', unit: 'cafe', name: 'POS / receipt printer', newPrice: 1000, usedPrice: null, condition: 'new', notes: 'Square Register Gen2 + Epson T82IIIL', supplier: 'Officeworks Square POS', url: '', excludeFromContingency: false, final: false },
      { id: 'si-cstock', categoryId: 'sc-cafe', unit: 'cafe', name: 'Initial cafe stock (food + coffee + packaging)', newPrice: 10000, usedPrice: null, condition: 'new', notes: '2–3 week opening stock.', supplier: 'Campos / SS Milk / Detpak', url: '', excludeFromContingency: false, final: false },
      { id: 'si-lic', categoryId: 'sc-cafe', unit: 'cafe', name: 'Licences, insurance setup', newPrice: 4977, usedPrice: null, condition: 'new', notes: 'Brisbane food licence Minor <250 m2 $1,005.90 + ASIC Pty Ltd $636 + business name 1yr $47 + FSS training $138 + remaining original setup/insurance $3,150. Liquor is the wine-bar line.', supplier: 'BCC food licence / ASIC', url: '', excludeFromContingency: false, final: false },
      { id: 'si-brand', categoryId: 'sc-cafe', unit: 'cafe', name: 'Branding, signage, website, marketing launch', newPrice: 1500, usedPrice: null, condition: 'new', notes: 'Shared branding', supplier: '', url: '', excludeFromContingency: false, final: false },
      { id: 'si-label', categoryId: 'sc-cafe', unit: 'cafe', name: 'Label maker', newPrice: 2500, usedPrice: null, condition: 'new', notes: 'Future, for food packaging.', supplier: 'Epson CW-C4010A', url: '', excludeFromContingency: false, final: false },
      { id: 'si-wc', categoryId: 'sc-cafe', unit: 'cafe', name: 'Working capital buffer', newPrice: 15000, usedPrice: null, condition: 'new', notes: 'Excluded from cafe 10% contingency.', supplier: '', url: '', excludeFromContingency: true, final: false },
      { id: 'si-wfridges', categoryId: 'sc-wine', unit: 'wine', name: 'Wine fridges / coolers / glass washer', newPrice: 6760, usedPrice: null, condition: 'new', notes: 'Vintec VWD050SSBX 50-btl dual-zone $2,499 + Polar 128L ~$1,100 + Washtech GE $3,162.', supplier: 'e&s Vintec / Nisbets Polar+Washtech', url: '', excludeFromContingency: false, final: false },
      { id: 'si-wglass', categoryId: 'sc-wine', unit: 'wine', name: 'Glassware, bar tools, smallware', newPrice: 1020, usedPrice: null, condition: 'new', notes: '48 Schott Zwiesel Vina Universal + 24 Olympia champagne + water/tasters + tools.', supplier: 'Nisbets Schott Zwiesel', url: '', excludeFromContingency: false, final: false },
      { id: 'si-wstock', categoryId: 'sc-wine', unit: 'wine', name: 'Initial wine & beverage stock', newPrice: 6200, usedPrice: null, condition: 'new', notes: 'Retail-priced 18-SKU par. Excluded from wine 10% contingency.', supplier: 'Wine Sellers Direct / Different Drop', url: '', excludeFromContingency: true, final: false },
      { id: 'si-liq', categoryId: 'sc-wine', unit: 'wine', name: 'Liquor licence & fees', newPrice: 3000, usedPrice: null, condition: 'new', notes: 'OLGR floor for meals-led subsidiary on-premises. Excluded from wine 10% contingency. Official 2026–27 PDF not extracted — do not invent application dollars.', supplier: 'Business QLD liquor licences', url: '', excludeFromContingency: true, final: false },
      { id: 'si-wbar', categoryId: 'sc-wine', unit: 'wine', name: 'Evening lighting, stools, minor bar fit-out', newPrice: 5800, usedPrice: null, condition: 'new', notes: '8× Florence stools + lighting pack + 2.4m laminate bar front.', supplier: 'Reward Florence / Bunnings Arlec', url: '', excludeFromContingency: false, final: false },
      { id: 'si-wsign', categoryId: 'sc-wine', unit: 'wine', name: 'Extra signage / wine list / menus', newPrice: 450, usedPrice: null, condition: 'new', notes: 'Officeworks A-frame + window clings + A4 lists.', supplier: 'Officeworks', url: '', excludeFromContingency: false, final: false },
      { id: 'si-cfreez', categoryId: 'sc-cat', unit: 'catering', name: 'Extra fridge / freezer capacity', newPrice: 4900, usedPrice: null, condition: 'new', notes: 'Polar 1200L 2-door upright freezer + 282L chest. Blast chiller and vacuum sealer are year-2 / optional.', supplier: 'Nisbets Polar DL897-A', url: '', excludeFromContingency: false, final: false },
      { id: 'si-cpack', categoryId: 'sc-cat', unit: 'catering', name: 'Packaging, containers, insulated bags (opening)', newPrice: 1200, usedPrice: null, condition: 'new', notes: 'Opening stock only. Replenishment sits in catering extra fixed.', supplier: 'BioPak / Nisbets Vogue bags', url: '', excludeFromContingency: false, final: false },
      { id: 'si-cfood', categoryId: 'sc-cat', unit: 'catering', name: 'Meal ingredients working capital', newPrice: 2800, usedPrice: null, condition: 'new', notes: '2 weeks food at 15 meals/day × 5 days × $8.40 (42% of $20) plus dry/frozen buffer.', supplier: '', url: '', excludeFromContingency: false, final: false },
      { id: 'si-cweb', categoryId: 'sc-cat', unit: 'catering', name: 'Basic online ordering / website upgrade', newPrice: 500, usedPrice: null, condition: 'new', notes: 'For catering & meal orders', supplier: '', url: '', excludeFromContingency: false, final: false },
      { id: 'si-cbag', categoryId: 'sc-cat', unit: 'catering', name: 'Delivery bags / equipment', newPrice: 400, usedPrice: null, condition: 'new', notes: 'Opening delivery bags.', supplier: '', url: '', excludeFromContingency: false, final: false },
    ],
    outgoingCategories: [
      { id: 'oc-cafe', name: 'Cafe monthly operating', unit: 'cafe', sort: 1 },
      { id: 'oc-wine', name: 'Wine bar extra fixed', unit: 'wine', sort: 2 },
      { id: 'oc-cat', name: 'Catering extra fixed', unit: 'catering', sort: 3 },
    ],
    outgoingItems: [
      { id: 'oi-rent', categoryId: 'oc-cafe', unit: 'cafe', name: 'Rent', cost: 2916, frequency: 'monthly', notes: 'Shared premises', final: false },
      { id: 'oi-outg', categoryId: 'oc-cafe', unit: 'cafe', name: 'Outgoings rental contribution', cost: 2758, frequency: 'monthly', notes: '', final: false },
      { id: 'oi-util', categoryId: 'oc-cafe', unit: 'cafe', name: 'Utilities (base)', cost: 580, frequency: 'monthly', notes: 'Power ~500, rates 1000/y in original note', final: false },
      { id: 'oi-pl', categoryId: 'oc-cafe', unit: 'cafe', name: 'Public liability insurance', cost: 125, frequency: 'monthly', notes: 'Liability $1,500/yr', final: false },
      { id: 'oi-wc', categoryId: 'oc-cafe', unit: 'cafe', name: 'WorkCover (standing estimate)', cost: 185, frequency: 'monthly', notes: 'Original $2,200/yr standing line. Labour tab also applies WIC 451113 $1.160 / $100 wages — possible overlap; treat one as the source of truth.', final: false },
      { id: 'oi-gas', categoryId: 'oc-cafe', unit: 'cafe', name: 'Natural gas', cost: 340, frequency: 'monthly', notes: '', final: false },
      { id: 'oi-mkt', categoryId: 'oc-cafe', unit: 'cafe', name: 'Marketing (shared)', cost: 400, frequency: 'monthly', notes: '', final: false },
      { id: 'oi-clean', categoryId: 'oc-cafe', unit: 'cafe', name: 'Cleaning, waste, misc', cost: 400, frequency: 'monthly', notes: 'One clean a week', final: false },
      { id: 'oi-xero', categoryId: 'oc-cafe', unit: 'cafe', name: 'Accounting / software (Xero)', cost: 25, frequency: 'monthly', notes: 'https://www.xero.com/au/pricing-plans/', final: false },
      { id: 'oi-maint', categoryId: 'oc-cafe', unit: 'cafe', name: 'Maintenance (cafe equipment)', cost: 150, frequency: 'monthly', notes: 'May overlap espresso PM inside compliance', final: false },
      { id: 'oi-music', categoryId: 'oc-cafe', unit: 'cafe', name: 'OneMusic dining licence', cost: 155, frequency: 'monthly', notes: 'Gold dining 31–50 seats $1,860.70 inc GST per 2025–26 schedule. CPI from 1 Sep 2026 may lift this slightly.', final: false },
      { id: 'oi-comp', categoryId: 'oc-cafe', unit: 'cafe', name: 'Compliance & kitchen ops', cost: 770, frequency: 'monthly', notes: 'Pest $220 + chemicals $120 + linen $150 + espresso PM $100 + grease trap $140 avg + trade waste $40.', final: false },
      { id: 'oi-winex', categoryId: 'oc-wine', unit: 'wine', name: 'Wine bar extra fixed', cost: 950, frequency: 'monthly', notes: 'Utilities, insurance, cleaning, marketing, maintenance increment', final: false },
      { id: 'oi-catex', categoryId: 'oc-cat', unit: 'catering', name: 'Catering extra fixed', cost: 630, frequency: 'monthly', notes: 'Original $350 power/insurance/pest increment + packaging replenishment $280 at 300 meals. Extra cook labour is not in this $630.', final: false },
    ],
    employees: [
      { id: 'emp-jr', name: 'Junior', role: 'Barista / FOH', isOwner: false, employmentType: 'casual', hourlyRate: 26, monthlySalary: 0, superPct: 12, leaveLoadingPct: 0, casualLoadingPct: 25, rateIncludesCasualLoading: false, workCoverApplies: true },
      { id: 'emp-reg', name: 'Regular', role: 'Cafe all-rounder', isOwner: false, employmentType: 'casual', hourlyRate: 30, monthlySalary: 0, superPct: 12, leaveLoadingPct: 0, casualLoadingPct: 25, rateIncludesCasualLoading: false, workCoverApplies: true },
      { id: 'emp-sen', name: 'Senior', role: 'Cook / senior FOH', isOwner: false, employmentType: 'casual', hourlyRate: 35, monthlySalary: 0, superPct: 12, leaveLoadingPct: 0, casualLoadingPct: 25, rateIncludesCasualLoading: false, workCoverApplies: true },
      { id: 'emp-csen', name: 'Casual Senior', role: 'Senior shift lead', isOwner: false, employmentType: 'casual', hourlyRate: 42, monthlySalary: 0, superPct: 12, leaveLoadingPct: 0, casualLoadingPct: 25, rateIncludesCasualLoading: true, workCoverApplies: true },
      { id: 'emp-perm', name: 'Permanent cook', role: 'Kitchen (permanent)', isOwner: false, employmentType: 'permanent', hourlyRate: 30, monthlySalary: 0, superPct: 12, leaveLoadingPct: 17.5, casualLoadingPct: 0, rateIncludesCasualLoading: false, workCoverApplies: true },
      { id: 'emp-o1', name: 'Nikita', role: 'Owner-operator', isOwner: true, ownerIndex: 1, employmentType: 'owner', hourlyRate: 0, monthlySalary: 0, superPct: 12, leaveLoadingPct: 0, casualLoadingPct: 0, rateIncludesCasualLoading: false, workCoverApplies: true },
      { id: 'emp-o2', name: 'Maddison', role: 'Owner-operator', isOwner: true, ownerIndex: 2, employmentType: 'owner', hourlyRate: 0, monthlySalary: 0, superPct: 12, leaveLoadingPct: 0, casualLoadingPct: 0, rateIncludesCasualLoading: false, workCoverApplies: true },
    ],
    roster: defaultRoster(),
    revenue: [
      { id: 'rev-cafe', name: 'Cafe', unit: 'cafe', daysPerMonth: 25, hoursPerSession: 12, volume: 90, aov: 20, cogsPct: 32, otherVarPct: 1.6, extraFixedMonthly: 0, notes: 'BASE demand. Optimistic note only: 150 covers/day.', optimisticVolume: 150, mealsPerDay: 0, daysPerWeek: 6, weeksPerMonth: 4, usesMealFormula: false },
      { id: 'rev-wine', name: 'Wine bar', unit: 'wine', daysPerMonth: 8, hoursPerSession: 5, volume: 32, aov: 30, cogsPct: 32, otherVarPct: 1.6, extraFixedMonthly: 0, notes: 'BASE demand, 8 nights, 5h. Optimistic note only: 40 covers/night.', optimisticVolume: 40, mealsPerDay: 0, daysPerWeek: 2, weeksPerMonth: 4, usesMealFormula: false },
      { id: 'rev-cat', name: 'Catering / home meals', unit: 'catering', daysPerMonth: 20, hoursPerSession: 0, volume: 300, aov: 20, cogsPct: 42, otherVarPct: 5, extraFixedMonthly: 0, notes: 'BASE: 15 meals/day × 5 days × 4 weeks = 300/mo. Optimistic note only: 30 meals/day. $20 is a single meal, not a family pack.', optimisticVolume: 600, mealsPerDay: 15, daysPerWeek: 5, weeksPerMonth: 4, usesMealFormula: true },
    ],
    partners: [
      { id: 'p-a', name: 'Partner A (Small)', sharePct: 70, monthlyRepayment: 0, interestPa: 0.1, principalOverride: null },
      { id: 'p-b', name: 'Partner B (Sudy)', sharePct: 30, monthlyRepayment: 6000, interestPa: 0.1, principalOverride: null },
    ],
  };
}

function r(
  employeeId: string,
  day: AppState['roster'][number]['day'],
  dayPart: AppState['roster'][number]['dayPart'],
  hours: number,
): AppState['roster'][number] {
  return { id: `r-${employeeId}-${day}-${dayPart}`, employeeId, day, dayPart, hours };
}

/** ~12h cafe weekdays, ~5h catering prep, Fri/Sat wine ~4–6h, Sat cafe ~10h, 2 staff at busy times. */
function defaultRoster(): AppState['roster'] {
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
  const cells: AppState['roster'] = [];
  for (const d of weekdays) {
    cells.push(r('emp-csen', d, 'coffee_rush', 2.5));
    cells.push(r('emp-jr', d, 'coffee_rush', 2.5));
    cells.push(r('emp-o1', d, 'cafe_deli', 8));
    cells.push(r('emp-reg', d, 'cafe_deli', 4));
    cells.push(r('emp-sen', d, 'catering_prep', 5));
  }
  cells.push(r('emp-csen', 'fri', 'wine_bar', 5));
  cells.push(r('emp-o1', 'fri', 'wine_bar', 4));
  cells.push(r('emp-o1', 'sat', 'cafe_deli', 6));
  cells.push(r('emp-csen', 'sat', 'cafe_deli', 4));
  cells.push(r('emp-jr', 'sat', 'coffee_rush', 3));
  cells.push(r('emp-sen', 'sat', 'catering_prep', 5));
  cells.push(r('emp-csen', 'sat', 'wine_bar', 5));
  cells.push(r('emp-o2', 'fri', 'wine_bar', 4));
  cells.push(r('emp-o2', 'sat', 'wine_bar', 5));
  cells.push(r('emp-o2', 'mon', 'cafe_deli', 6));
  cells.push(r('emp-o2', 'tue', 'cafe_deli', 6));
  cells.push(r('emp-perm', 'wed', 'cafe_deli', 6));
  cells.push(r('emp-perm', 'thu', 'cafe_deli', 6));
  return cells;
}
