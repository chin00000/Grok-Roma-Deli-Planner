import { describe, expect, it } from 'vitest';
import { fullyLoadedCost, ordinaryHourlyRate } from './labour';
import type { Employee, PenaltyRates, RosterCell } from '../types';

const penalties: PenaltyRates = {
  weekday: 1,
  evening: 1.1,
  saturday: 1.25,
  sunday: 1.5,
  saturdayEvening: 1.5,
  sundayEvening: 1.75,
};

const weeks = 52 / 12;

function casual(partial: Partial<Employee> & Pick<Employee, 'id' | 'hourlyRate'>): Employee {
  return {
    name: 'Test',
    role: 'FOH',
    isOwner: false,
    employmentType: 'casual',
    monthlySalary: 0,
    superPct: 12,
    leaveLoadingPct: 0,
    casualLoadingPct: 25,
    rateIncludesCasualLoading: false,
    workCoverApplies: true,
    ...partial,
  };
}

describe('labour fully loaded', () => {
  it('applies 25% casual loading when the rate does not include it', () => {
    const emp = casual({ id: 'jr', hourlyRate: 26, rateIncludesCasualLoading: false });
    expect(ordinaryHourlyRate(emp)).toBeCloseTo(32.5, 6);
  });

  it('does not double-count loading on Casual Senior $42 (35+7)', () => {
    const emp = casual({
      id: 'cs',
      hourlyRate: 42,
      rateIncludesCasualLoading: true,
    });
    expect(ordinaryHourlyRate(emp)).toBe(42);
  });

  it('loads wages with super 12% and WorkCover $1.160 / $100', () => {
    const emp = casual({
      id: 'a',
      hourlyRate: 40,
      rateIncludesCasualLoading: true,
      superPct: 12,
    });
    const roster: RosterCell[] = [
      { id: '1', employeeId: 'a', day: 'mon', dayPart: 'cafe_deli', hours: 10 },
    ];
    const c = fullyLoadedCost(emp, roster, penalties, 1.16, weeks);
    expect(c.weeklyGross).toBe(400);
    expect(c.weeklyLeaveLoading).toBe(0);
    expect(c.weeklySuper).toBeCloseTo(48, 6);
    expect(c.weeklyWorkCover).toBeCloseTo(4.64, 6);
    expect(c.weeklyLoaded).toBeCloseTo(452.64, 6);
    expect(c.monthlyLoaded).toBeCloseTo(452.64 * weeks, 6);
  });

  it('adds 17.5% leave loading for permanents spread over 52 weeks', () => {
    const emp: Employee = {
      id: 'p',
      name: 'Perm',
      role: 'Cook',
      isOwner: false,
      employmentType: 'permanent',
      hourlyRate: 30,
      monthlySalary: 0,
      superPct: 12,
      leaveLoadingPct: 17.5,
      casualLoadingPct: 0,
      rateIncludesCasualLoading: false,
      workCoverApplies: true,
    };
    const roster: RosterCell[] = [
      { id: '1', employeeId: 'p', day: 'mon', dayPart: 'cafe_deli', hours: 20 },
    ];
    const c = fullyLoadedCost(emp, roster, penalties, 1.16, weeks);
    expect(c.weeklyGross).toBe(600);
    expect(c.weeklyLeaveLoading).toBeCloseTo((30 * 20 * 4 * 0.175) / 52, 8);
  });

  it('does not multiply owner salary by rostered hours', () => {
    const emp: Employee = {
      id: 'o1',
      name: 'Rick',
      role: 'Owner',
      isOwner: true,
      ownerIndex: 1,
      employmentType: 'owner',
      hourlyRate: 0,
      monthlySalary: 4000,
      superPct: 12,
      leaveLoadingPct: 0,
      casualLoadingPct: 0,
      rateIncludesCasualLoading: false,
      workCoverApplies: true,
    };
    const roster: RosterCell[] = [
      { id: '1', employeeId: 'o1', day: 'mon', dayPart: 'cafe_deli', hours: 40 },
    ];
    const withPay = fullyLoadedCost(emp, roster, penalties, 1.16, weeks);
    const without = fullyLoadedCost(emp, roster, penalties, 1.16, weeks, {
      includeSalary: false,
    });
    expect(withPay.monthlyLoaded).toBeCloseTo(4000 * 1.12 + 4000 * 0.0116, 6);
    expect(without.monthlyLoaded).toBe(0);
    expect(withPay.totalHours).toBe(40);
    expect(without.totalHours).toBe(40);
  });
});
