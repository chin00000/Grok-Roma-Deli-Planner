import type { Frequency } from '../types';

/** Convert a cost at the given frequency to a monthly equivalent. */
export function toMonthly(cost: number, frequency: Frequency): number {
  switch (frequency) {
    case 'weekly':
      return (cost * 52) / 12;
    case 'monthly':
      return cost;
    case 'quarterly':
      return cost / 3;
    case 'yearly':
      return cost / 12;
  }
}

/** Convert a cost at the given frequency to an annual equivalent. */
export function toAnnual(cost: number, frequency: Frequency): number {
  return toMonthly(cost, frequency) * 12;
}

export function toWeeklyFromMonthly(monthly: number): number {
  return (monthly * 12) / 52;
}
