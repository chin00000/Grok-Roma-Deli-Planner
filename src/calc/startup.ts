import type { StartupItem } from '../types';

/**
 * Amount that feeds totals / payback / Home.
 * Used + missing usedPrice is 0 — never fall back to newPrice.
 */
export function startupItemAmount(item: StartupItem): number {
  if (item.condition === 'used') {
    return typeof item.usedPrice === 'number' && Number.isFinite(item.usedPrice) ? item.usedPrice : 0;
  }
  return typeof item.newPrice === 'number' && Number.isFinite(item.newPrice) ? item.newPrice : 0;
}

export function isUsedPriceMissing(item: StartupItem): boolean {
  if (item.condition !== 'used') return false;
  return item.usedPrice === null || item.usedPrice === undefined || !Number.isFinite(item.usedPrice);
}
