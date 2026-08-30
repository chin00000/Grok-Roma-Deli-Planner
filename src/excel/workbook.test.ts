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
