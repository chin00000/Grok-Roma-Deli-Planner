import { describe, expect, it } from 'vitest';
import { toAnnual, toMonthly } from './frequency';

describe('frequency → monthly', () => {
  it('keeps monthly as-is', () => {
    expect(toMonthly(8804, 'monthly')).toBe(8804);
  });

  it('converts weekly using 52/12', () => {
    expect(toMonthly(100, 'weekly')).toBeCloseTo(433.333333, 6);
  });

  it('converts quarterly by dividing by 3', () => {
    expect(toMonthly(900, 'quarterly')).toBe(300);
  });

  it('converts yearly by dividing by 12', () => {
    expect(toMonthly(1860.7, 'yearly')).toBeCloseTo(155.058333, 5);
  });

  it('annual is 12 × monthly', () => {
    expect(toAnnual(155, 'monthly')).toBe(1860);
    expect(toAnnual(100, 'weekly')).toBeCloseTo(5200, 6);
  });
});
