import { describe, expect, it } from 'vitest';
import { applyPreview, computeModel } from './model';
import { seedState } from '../seed';
import { defaultPreview } from '../types';

describe('Home preview toggles do not mutate persisted JSON', () => {
  it('applyPreview clones and leaves the original state untouched', () => {
    const state = seedState();
    const before = JSON.stringify(state);
    const preview = {
      ...defaultPreview(state),
      wineOn: false,
      cateringOn: false,
      includeOwner1Salary: false,
      includeOwner2Salary: false,
      cafeCovers: 12,
      wineCovers: 1,
      mealsPerDay: 2,
    };
    const cloned = applyPreview(state, preview);
    expect(JSON.stringify(state)).toBe(before);
    expect(cloned.units.wine).toBe(false);
    expect(state.units.wine).toBe(true);
    expect(cloned.revenue.find((r) => r.unit === 'cafe')!.volume).toBe(12);
    expect(state.revenue.find((r) => r.unit === 'cafe')!.volume).toBe(90);
  });

  it('computeModel with preview does not mutate state', () => {
    const state = seedState();
    const before = JSON.stringify(state);
    const preview = { ...defaultPreview(state), wineOn: false, cafeCovers: 50 };
    const withWine = computeModel(state);
    const without = computeModel(state, preview);
    expect(JSON.stringify(state)).toBe(before);
    expect(without.flags.wine).toBe(false);
    expect(withWine.flags.wine).toBe(true);
    expect(without.revenue).toBeLessThan(withWine.revenue);
    expect(state.units.wine).toBe(true);
    expect(state.revenue.find((r) => r.unit === 'cafe')!.volume).toBe(90);
  });
});
