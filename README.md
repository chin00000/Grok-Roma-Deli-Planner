# Roma Deli Cafe Financial Planner

Local-first planner for Rick's Roma Deli Cafe (cafe + optional wine bar + optional catering). Everything lives in the browser (localStorage). There is no backend.

Seed database: Darwin, 30 August 2026. Dollars come from that workbook, not invented benchmarks.

## Run

```bash
npm install && npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

```bash
npm test
npm run build
```

## What it is

Icon-only tabs: Home, Startup, Outgoings, Labour, Revenue, Payback, Settings.

- Home: 10-second whole-business view for both partners. Revenue mix, contribution vs fixed, labour vs sales, cash after debt, payback, partner split. Scenario dropdowns (wine, catering, owner salaries, covers, meals) are preview only and do not write persisted JSON.
- Startup: categories, AUD items with a new price, an optional used price, and a New | Used toggle per row. The selected price feeds totals / payback / Home. Used with a blank used price counts as $0 (no silent fallback to new). Notes, supplier/URL, unit Cafe|Wine|Catering. Contingency is a percent of the selected amounts. Cafe excludes working capital; wine excludes stock and liquor; catering is 10 percent of its items.
- Outgoings: cost plus weekly, monthly, quarterly or yearly, normalised to monthly and annual.
- Labour: up to 5 employees plus 2 owner-operators — Partner A Nikita (Small's side) and Partner B Maddison (Sudy's side), both salary not hourly. Weekly roster by daypart (coffee rush, cafe/deli, catering prep, wine bar). Fully loaded cost by unit.
- Revenue: cafe, wine, catering (add more). Volume, AOV, COGS percent, other variable percent, linked labour, extra fixed, contribution, operating profit.
- Payback: Partner A (Small) 70 percent / Partner B (Sudy) 30 percent, plus a 50/50 preset. Bank loan principal defaults to each partner's share of startup. Dual payoff charts. Monthly compounding default. Partner B (Sudy) seed repayment is $6,000/mo; Partner A (Small) repayment is $0 until set.
- Settings: light cream / espresso dark, persisted unit on/off, Excel import/export, reset to seed.

Currency and copy: en-AU / AUD.

## Excel import / export

Settings, then Export, writes a human spreadsheet (ExcelJS): Dashboard, Startup, Outgoings, Labour, Employees, Revenue, Loans, Partners, Settings.

Sheets are colour-coded, headers frozen, AUD number formats, notes column. Startup has `newPrice`, `usedPrice`, and a `condition` column whose values are the lowercase words `new` or `used`. Internally the app keeps JSON for speed.

Import is destructive. You get a confirm dialog; accepting overwrites the saved local database.

## QLD labour assumptions

Labelled as assumptions where they are helpers rather than award text pasted into the model:

- Award: Hospitality Industry (General) Award MA000009
- Super: 12 percent Super Guarantee, ATO 2026-27, applied on ordinary time earnings / owner drawings
- Fair Work L2 casual ordinary (1 Jul 2026): $33.85/h. Reference on Labour / Settings, not auto-applied to every row
- Casual loading: 25 percent. Applied only when "rate already includes casual loading" is off
- Casual Senior $42: historical $35 + $7. Flag is on so loading is not double-counted
- Permanent leave loading: 17.5 percent on 4 weeks ordinary, spread over 52 weeks (assumption)
- Penalty multipliers: weekday / 7-10pm / Sat / Sun / Sat evening / Sun evening. Editable assumptions, not a full award engine
- WorkCover: WIC 451113 $1.160 per $100 wages, editable. The $185/mo outgoing is the original standing estimate and may overlap; pick one source of truth
- Owner drawings: default $0 until you set them. Partner A operator is Nikita; Partner B operator is Maddison. Salary does not multiply by rostered hours; owners still appear for coverage
- Labour month: 52/12 weeks. Catering meals still use 15 x 5 x 4 = 300/mo as in the Darwin model
- Loan compounding: monthly default; yearly available to match the old spreadsheet

Do not treat labour cells as a Fair Work calculator. They are a planning loader with explicit flags.

## Persistence

Key roma-deli-planner-v2 in localStorage (version 2). Older v1 saves with Party A (Rick) are not migrated — reset to the 70/30 Small/Sudy seed. Home preview state is React state only.

## Stack

Vite, React, TypeScript, CSS (no utility framework), Lucide icons, ExcelJS, Vitest.

Exact commands: install with the Node package manager, then the dev / test / build scripts defined in package.json (install, dev, test, build).
