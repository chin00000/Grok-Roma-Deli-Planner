import { describe, expect, it } from 'vitest';
import { exportWorkbook, importWorkbook } from './workbook';
import { seedState } from '../seed';

describe('Excel startup condition column', () => {
  it('writes the word new or used and round-trips new/used prices', async () => {
    const state = seedState();
    const coffee = state.startupItems.find((i) => i.id === 'si-coffee')!;
    coffee.condition = 'used';
    coffee.usedPrice = 8750;
    const buf = await exportWorkbook(state);

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.getWorksheet('Startup');
    expect(ws).toBeTruthy();

    const headers = new Map<string, number>();
    ws!.getRow(1).eachCell((cell, col) => {
      headers.set(String(cell.value), col);
    });
    expect(headers.get('condition')).toBeGreaterThan(0);
    expect(headers.get('newPrice')).toBeGreaterThan(0);
    expect(headers.get('usedPrice')).toBeGreaterThan(0);

    const condCol = headers.get('condition')!;
    const newCol = headers.get('newPrice')!;
    const usedCol = headers.get('usedPrice')!;
    const idCol = headers.get('id')!;

    const words = new Set<string>();
    ws!.eachRow((row, i) => {
      if (i === 1) return;
      const id = String(row.getCell(idCol).value ?? '');
      if (!id || id === 'CONTINGENCY') return;
      const cond = String(row.getCell(condCol).value ?? '');
      words.add(cond);
      if (id === 'si-coffee') {
        expect(cond).toBe('used');
        expect(row.getCell(usedCol).value).toBe(8750);
        expect(row.getCell(newCol).value).toBe(coffee.newPrice);
      }
      if (id === 'si-fit') {
        expect(cond).toBe('new');
        expect(row.getCell(usedCol).value === null || row.getCell(usedCol).value === undefined || row.getCell(usedCol).value === '').toBe(true);
      }
    });
    expect([...words].sort()).toEqual(['new', 'used']);

    const imported = await importWorkbook(buf, seedState());
    const impCoffee = imported.startupItems.find((i) => i.id === 'si-coffee')!;
    const impFit = imported.startupItems.find((i) => i.id === 'si-fit')!;
    expect(impCoffee.condition).toBe('used');
    expect(impCoffee.usedPrice).toBe(8750);
    expect(impCoffee.newPrice).toBe(coffee.newPrice);
    expect(impFit.condition).toBe('new');
    expect(impFit.usedPrice).toBeNull();
  });
});

describe('Excel category column', () => {
  it('writes category and round-trips startup and outgoings', async () => {
    const state = seedState();
    const coffee = state.startupItems.find((i) => i.id === 'si-coffee')!;
    coffee.category = 'Equipment';
    const rent = state.outgoingItems.find((i) => i.id === 'oi-rent')!;
    rent.category = 'Premises';
    const buf = await exportWorkbook(state);

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    for (const sheet of ['Startup', 'Outgoings'] as const) {
      const ws = wb.getWorksheet(sheet);
      expect(ws).toBeTruthy();
      const headers = new Map<string, number>();
      ws!.getRow(1).eachCell((cell, col) => {
        headers.set(String(cell.value), col);
      });
      expect(headers.get('category')).toBeGreaterThan(0);
      expect(headers.get('categoryId')).toBeGreaterThan(0);
      expect(headers.get('category')).not.toBe(headers.get('categoryId'));
    }

    const start = wb.getWorksheet('Startup')!;
    const startHeaders = new Map<string, number>();
    start.getRow(1).eachCell((cell, col) => startHeaders.set(String(cell.value), col));
    const startCat = startHeaders.get('category')!;
    const startId = startHeaders.get('id')!;
    start.eachRow((row, i) => {
      if (i === 1) return;
      if (String(row.getCell(startId).value ?? '') === 'si-coffee') {
        expect(row.getCell(startCat).value).toBe('Equipment');
      }
    });

    const imported = await importWorkbook(buf, seedState());
    expect(imported.startupItems.find((i) => i.id === 'si-coffee')?.category).toBe('Equipment');
    expect(imported.outgoingItems.find((i) => i.id === 'oi-rent')?.category).toBe('Premises');
  });

  it('imports old workbooks that have no category column as uncategorised', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const start = wb.addWorksheet('Startup');
    start.addRow(['id', 'categoryId', 'unit', 'name', 'newPrice', 'usedPrice', 'condition', 'excludeFromContingency', 'supplier', 'url', 'notes', 'final', 'calculated']);
    start.addRow(['si-old', 'sc-cafe', 'cafe', 'Old item', 10, null, 'new', false, '', '', '', false, 10]);
    const out = wb.addWorksheet('Outgoings');
    out.addRow(['id', 'categoryId', 'unit', 'name', 'cost', 'frequency', 'monthly', 'annual', 'notes', 'final']);
    out.addRow(['oi-old', 'oc-cafe', 'cafe', 'Old outgoing', 5, 'monthly', 5, 60, '', false]);
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    const imported = await importWorkbook(buf, seedState());
    expect(imported.startupItems.find((i) => i.id === 'si-old')?.category).toBeUndefined();
    expect(imported.outgoingItems.find((i) => i.id === 'oi-old')?.category).toBeUndefined();
  });
});
