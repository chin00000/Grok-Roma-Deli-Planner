import { describe, expect, it } from 'vitest';
import { computeModel, startupByCategory } from './model';
import { isUsedPriceMissing, startupItemAmount } from './startup';
import { seedState } from '../seed';

const ALL_ON = { cafe: true, wine: true, catering: true };

describe('startup new vs used pricing', () => {
  it('seed items are new, Darwin numbers live in newPrice, usedPrice empty', () => {
    const state = seedState();
    expect(state.startupItems.length).toBeGreaterThan(0);
    for (const item of state.startupItems) {
      expect(item.condition).toBe('new');
      expect(item.usedPrice).toBeNull();
      expect(item.newPrice).toBeGreaterThan(0);
      expect(startupItemAmount(item)).toBe(item.newPrice);
      expect(isUsedPriceMissing(item)).toBe(false);
    }
  });

  it('used toggle with a used price changes calculated startup total', () => {
    const state = seedState();
    const before = computeModel(state).startupTotal;
    const item = state.startupItems.find((i) => i.id === 'si-fit')!;
    const newPrice = item.newPrice;
    item.condition = 'used';
    item.usedPrice = 1000;
    const after = computeModel(state).startupTotal;
    expect(item.newPrice).toBe(newPrice);
    expect(after).toBeLessThan(before);
    expect(after).toBeCloseTo(before - 49000 * 1.1, 6);
  });

  it('empty used + used selected counts that line as 0 (no fallback to new)', () => {
    const state = seedState();
    const item = state.startupItems.find((i) => i.id === 'si-coffee')!;
    const beforeCats = startupByCategory(state, ALL_ON);
    const cafeBefore = beforeCats.find((c) => c.unit === 'cafe')!;
    item.condition = 'used';
    item.usedPrice = null;
    expect(startupItemAmount(item)).toBe(0);
    expect(isUsedPriceMissing(item)).toBe(true);
    const cafeAfter = startupByCategory(state, ALL_ON).find((c) => c.unit === 'cafe')!;
    expect(cafeAfter.items).toBe(cafeBefore.items - item.newPrice);
    expect(cafeAfter.contingencyBase).toBe(cafeBefore.contingencyBase - item.newPrice);
  });

  it('usedPrice 0 is a real number, not missing', () => {
    const state = seedState();
    const item = state.startupItems[0]!;
    item.condition = 'used';
    item.usedPrice = 0;
    expect(startupItemAmount(item)).toBe(0);
    expect(isUsedPriceMissing(item)).toBe(false);
  });
});
