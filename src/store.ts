import { seedState } from './seed';
import type { AppState } from './types';

export const STORAGE_KEY = 'roma-deli-planner-v2';

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
    return parsed;
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
