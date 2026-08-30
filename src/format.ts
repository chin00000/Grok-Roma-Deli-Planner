const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

const audExact = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat('en-AU', { style: 'percent', maximumFractionDigits: 1 });

export function money(n: number, exact = false): string {
  return (exact ? audExact : aud).format(n);
}

export function number(n: number): string {
  return num.format(n);
}

export function percent(n: number, alreadyRatio = false): string {
  return pct.format(alreadyRatio ? n : n / 100);
}

export function monthsLabel(m: number | null): string {
  if (m === null) return 'Never (repayment below interest)';
  if (m === 0) return 'Cleared';
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${m} mo`;
  if (mo === 0) return `${y} yr`;
  return `${y} yr ${mo} mo`;
}
