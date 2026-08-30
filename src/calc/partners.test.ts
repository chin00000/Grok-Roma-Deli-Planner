import { describe, expect, it } from 'vitest';
import { applySharePreset, PRESET_70_30, PRESET_50_50, splitStartup } from './partners';
import { seedState } from '../seed';
import type { Partner } from '../types';

const partners = (a: number, b: number): Partner[] => [
  { id: 'p-a', name: 'Partner A (Small)', sharePct: a, monthlyRepayment: 0, interestPa: 0.1, principalOverride: null },
  { id: 'p-b', name: 'Partner B (Sudy)', sharePct: b, monthlyRepayment: 6000, interestPa: 0.1, principalOverride: null },
];

describe('partner split', () => {
  it('seed is 70/30 Partner A (Small) / Partner B (Sudy)', () => {
    const s = seedState();
    expect(s.partners[0]).toMatchObject({
      id: 'p-a',
      name: 'Partner A (Small)',
      sharePct: 70,
      monthlyRepayment: 0,
    });
    expect(s.partners[1]).toMatchObject({
      id: 'p-b',
      name: 'Partner B (Sudy)',
      sharePct: 30,
      monthlyRepayment: 6000,
    });
  });

  it('seed owner-operators are Nikita and Maddison', () => {
    const s = seedState();
    expect(s.employees.find((e) => e.ownerIndex === 1)?.name).toBe('Nikita');
    expect(s.employees.find((e) => e.ownerIndex === 2)?.name).toBe('Maddison');
    expect(s.employees.find((e) => e.ownerIndex === 1)?.monthlySalary).toBe(0);
    expect(s.employees.find((e) => e.ownerIndex === 2)?.monthlySalary).toBe(0);
  });

  it('splits 70/30 of startup', () => {
    const r = splitStartup(208953, partners(70, 30));
    expect(r[0]!.name).toBe('Partner A (Small)');
    expect(r[1]!.name).toBe('Partner B (Sudy)');
    expect(r[0]!.startupShare).toBeCloseTo(208953 * 0.7, 6);
    expect(r[1]!.startupShare).toBeCloseTo(208953 * 0.3, 6);
    expect(r[0]!.principal).toBe(r[0]!.startupShare);
    expect(r[1]!.principal).toBe(r[1]!.startupShare);
  });

  it('normalises shares that do not sum to 100', () => {
    const r = splitStartup(100, partners(30, 30));
    expect(r[0]!.startupShare).toBeCloseTo(50, 8);
    expect(r[1]!.startupShare).toBeCloseTo(50, 8);
  });

  it('honours a principal override', () => {
    const p = partners(70, 30);
    p[0]!.principalOverride = 10000;
    const r = splitStartup(100000, p);
    expect(r[0]!.principal).toBe(10000);
    expect(r[0]!.startupShare).toBe(70000);
  });

  it('applies 50/50 and 70/30 presets', () => {
    const fifty = applySharePreset(partners(70, 30), PRESET_50_50);
    expect(fifty[0]!.sharePct).toBe(50);
    expect(fifty[1]!.sharePct).toBe(50);
    const orig = applySharePreset(fifty, PRESET_70_30);
    expect(orig[0]!.sharePct).toBe(70);
    expect(orig[1]!.sharePct).toBe(30);
  });
});
