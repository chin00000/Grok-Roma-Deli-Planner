export type Compounding = 'monthly' | 'yearly';

export interface AmortRow {
  month: number;
  opening: number;
  interest: number;
  repayment: number;
  closing: number;
}

export interface Amortisation {
  rows: AmortRow[];
  monthsToClear: number | null;
  yearsToClear: number | null;
  totalInterest: number;
  totalRepaid: number;
  neverClears: boolean;
}

const MAX_MONTHS = 600;

/**
 * Amortise a principal with a fixed monthly repayment.
 * Monthly compounding: interest = opening × (pa / 12) each month.
 * Yearly compounding: interest charged once per 12 months on the opening of that year.
 */
export function amortise(params: {
  principal: number;
  interestPa: number;
  monthlyRepayment: number;
  compounding?: Compounding;
}): Amortisation {
  const compounding = params.compounding ?? 'monthly';
  const principal = Math.max(0, params.principal);
  const rPa = params.interestPa;
  const payment = params.monthlyRepayment;
  const rows: AmortRow[] = [];

  if (principal === 0) {
    return {
      rows: [{ month: 0, opening: 0, interest: 0, repayment: 0, closing: 0 }],
      monthsToClear: 0,
      yearsToClear: 0,
      totalInterest: 0,
      totalRepaid: 0,
      neverClears: false,
    };
  }

  let balance = principal;
  let totalInterest = 0;
  let totalRepaid = 0;
  let monthsToClear: number | null = null;

  rows.push({
    month: 0,
    opening: principal,
    interest: 0,
    repayment: 0,
    closing: principal,
  });

  for (let m = 1; m <= MAX_MONTHS; m++) {
    const opening = balance;
    let interest = 0;
    if (compounding === 'monthly') {
      interest = opening * (rPa / 12);
    } else if (m % 12 === 1) {
      interest = opening * rPa;
    }
    const due = opening + interest;
    const repayment = payment <= 0 ? 0 : Math.min(payment, due);
    const closing = Math.max(0, due - repayment);
    rows.push({ month: m, opening, interest, repayment, closing });
    totalInterest += interest;
    totalRepaid += repayment;
    balance = closing;
    if (closing <= 0.005) {
      monthsToClear = m;
      balance = 0;
      break;
    }
    if (payment > 0 && repayment < interest - 1e-9 && m > 24) {
      break;
    }
  }

  const neverClears = monthsToClear === null;
  return {
    rows,
    monthsToClear,
    yearsToClear: monthsToClear === null ? null : monthsToClear / 12,
    totalInterest,
    totalRepaid,
    neverClears,
  };
}
