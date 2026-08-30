import { describe, expect, it } from 'vitest';
import { applySharePreset, PRESET_30_70, PRESET_50_50, splitStartup } from './partners';
import type { Partner } from '../types';

const partners = (a: number, b: number): Partner[] => [
  { id: 'p-a', name: 'A', sharePct: a, monthlyRepayment: 6000, interestPa: 0.1, principalOverride: null },
  { id: 'p-b', name: 'B', sharePct: b, monthlyRepayment: 0, interestPa: 0.1, principalOverride: null },
];

describe('partner split', () => {
  it('splits 30/70 of startup', () => {
    const r = splitStartup(208953, partners(30, 70));
    expect(r[0]!.startupShare).toBeCloseTo(208953 * 0.3, 6);
    expect(r[1]!.startupShare).toBeCloseTo(208953 * 0.7, 6);
    expect(r[0]!.principal).toBe(r[0]!.startupShare);
    expect(r[1]!.principal).toBe(r[1]!.startupShare);
  });

  it('normalises shares that do not sum to 100', () => {
    const r = splitStartup(100, partners(30, 30));
    expect(r[0]!.startupShare).toBeCloseTo(50, 8);
    expect(r[1]!.startupShare).toBeCloseTo(50, 8);
  });

  it('honours a principal override', () => {
    const p = partners(30, 70);
    p[0]!.principalOverride = 10000;
    const r = splitStartup(100000, p);
    expect(r[0]!.principal).toBe(10000);
    expect(r[0]!.startupShare).toBe(30000);
  });

  it('applies 50/50 and 30/70 presets', () => {
    const fifty = applySharePreset(partners(30, 70), PRESET_50_50);
    expect(fifty[0]!.sharePct).toBe(50);
    expect(fifty[1]!.sharePct).toBe(50);
    const orig = applySharePreset(fifty, PRESET_30_70);
    expect(orig[0]!.sharePct).toBe(30);
    expect(orig[1]!.sharePct).toBe(70);
  });
});
