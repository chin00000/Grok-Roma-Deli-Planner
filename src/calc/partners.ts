import type { Partner } from '../types';

export interface SplitResult {
  id: string;
  name: string;
  sharePct: number;
  shareFraction: number;
  startupShare: number;
  principal: number;
}

/**
 * Allocate startup capital by partner share percentages.
 * Shares are normalised so they always sum to 100% of capital.
 */
export function splitStartup(totalStartup: number, partners: Partner[]): SplitResult[] {
  const sumPct = partners.reduce((s, p) => s + p.sharePct, 0);
  const denom = sumPct === 0 ? 1 : sumPct;
  return partners.map((p) => {
    const shareFraction = p.sharePct / denom;
    const startupShare = totalStartup * shareFraction;
    const principal =
      p.principalOverride !== null && p.principalOverride !== undefined
        ? p.principalOverride
        : startupShare;
    return {
      id: p.id,
      name: p.name,
      sharePct: p.sharePct,
      shareFraction,
      startupShare,
      principal,
    };
  });
}

export const PRESET_70_30: { a: number; b: number } = { a: 70, b: 30 };
export const PRESET_50_50: { a: number; b: number } = { a: 50, b: 50 };

export function applySharePreset(
  partners: Partner[],
  preset: { a: number; b: number },
): Partner[] {
  if (partners.length < 2) return partners;
  return partners.map((p, i) => {
    if (i === 0) return { ...p, sharePct: preset.a };
    if (i === 1) return { ...p, sharePct: preset.b };
    return p;
  });
}
