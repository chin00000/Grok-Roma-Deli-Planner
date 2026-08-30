import { describe, expect, it } from 'vitest';
import { amortise } from './loan';

describe('loan amortisation', () => {
  it('clears a zero principal immediately', () => {
    const a = amortise({ principal: 0, interestPa: 0.1, monthlyRepayment: 1000 });
    expect(a.monthsToClear).toBe(0);
    expect(a.totalInterest).toBe(0);
    expect(a.neverClears).toBe(false);
  });

  it('monthly compounding: 12 months at 12% on $1200', () => {
    const a = amortise({
      principal: 1200,
      interestPa: 0.12,
      monthlyRepayment: 106.619,
      compounding: 'monthly',
    });
    expect(a.neverClears).toBe(false);
    expect(a.monthsToClear).toBe(12);
    expect(a.totalInterest).toBeGreaterThan(0);
    const last = a.rows[a.rows.length - 1]!;
    expect(last.closing).toBeLessThan(0.02);
  });

  it('does not clear when repayment is below monthly interest', () => {
    const a = amortise({
      principal: 100000,
      interestPa: 0.12,
      monthlyRepayment: 100,
      compounding: 'monthly',
    });
    expect(a.neverClears).toBe(true);
    expect(a.monthsToClear).toBeNull();
  });

  it('charges yearly interest once per 12 months', () => {
    const a = amortise({
      principal: 1000,
      interestPa: 0.1,
      monthlyRepayment: 200,
      compounding: 'yearly',
    });
    const m1 = a.rows.find((r) => r.month === 1)!;
    expect(m1.interest).toBeCloseTo(100, 6);
    const m2 = a.rows.find((r) => r.month === 2)!;
    expect(m2.interest).toBe(0);
  });

  it('uses monthly compounding by default', () => {
    const a = amortise({ principal: 1000, interestPa: 0.12, monthlyRepayment: 90 });
    const m1 = a.rows.find((r) => r.month === 1)!;
    expect(m1.interest).toBeCloseTo(10, 8);
  });
});
