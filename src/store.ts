import { seedState } from './seed';
import type { AppState, RosterCell } from './types';

export const STORAGE_KEY = 'roma-deli-planner-v2';

function normalizeRoster(roster: RosterCell[] | undefined): RosterCell[] | undefined {
  if (!Array.isArray(roster)) return roster;
  return roster.map((c) => {
    if (typeof c.startHour === 'number' && typeof c.endHour === 'number') {
      return { ...c, hours: Math.max(0.5, c.endHour - c.startHour) };
    }
    return c;
  });
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (
      !parsed ||
      parsed.version !== 2 ||
      !Array.isArray(parsed.startupItems) ||
      parsed.startupItems.some((i) => typeof i.newPrice !== 'number' || (i.condition !== 'new' && i.condition !== 'used'))
    ) {
      return seedState();
    }
    return {
      ...parsed,
      startupItems: parsed.startupItems.map((i) => ({ ...i, final: !!i.final })),
      outgoingItems: parsed.outgoingItems.map((i) => ({ ...i, final: !!i.final })),
      roster: normalizeRoster(parsed.roster) ?? parsed.roster,
    };
  } catch {
    return seedState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function snapshot(state: AppState): string {
  return JSON.stringify(state);
}
