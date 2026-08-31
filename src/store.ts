import { seedState } from './seed';
import type { AppState, ItemCondition, RosterCell, StartupItem } from './types';

export const STORAGE_KEY = 'roma-deli-planner-v2';
export const BACKUP_KEY = 'roma-deli-planner-v2-prev';

const ARRAY_KEYS = [
  'startupItems',
  'outgoingItems',
  'employees',
  'roster',
  'revenue',
  'partners',
  'startupCategories',
  'outgoingCategories',
] as const;

function normalizeRoster(roster: RosterCell[] | undefined): RosterCell[] | undefined {
  if (!Array.isArray(roster)) return roster;
  return roster.map((c) => {
    if (typeof c.startHour === 'number' && typeof c.endHour === 'number') {
      return { ...c, hours: Math.max(0.5, c.endHour - c.startHour) };
    }
    return c;
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function tryParse(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function defaultCondition(value: unknown): ItemCondition {
  return value === 'used' ? 'used' : 'new';
}

function migrateStartupItem(item: StartupItem): StartupItem {
  return {
    ...item,
    final: !!item.final,
    newPrice: typeof item.newPrice === 'number' && Number.isFinite(item.newPrice) ? item.newPrice : 0,
    condition: defaultCondition(item.condition),
  };
}

/** Fill missing top-level keys from seed. Never drop a parseable save or a user array. */
function migrate(parsed: Record<string, unknown>): AppState {
  const seed = seedState();
  const next = { ...seed, ...parsed } as AppState;

  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(parsed[key])) {
      (next as unknown as Record<string, unknown>)[key] = seed[key];
    }
  }

  next.startupItems = next.startupItems.map(migrateStartupItem);
  next.outgoingItems = next.outgoingItems.map((i) => ({ ...i, final: !!i.final }));
  next.roster = normalizeRoster(next.roster) ?? next.roster;

  return next;
}

function migrateRaw(raw: string): AppState | null {
  const parsed = tryParse(raw);
  if (!isPlainObject(parsed)) return null;
  return migrate(parsed);
}

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedState();

  const migrated = migrateRaw(raw);
  if (migrated) return migrated;

  const backup = localStorage.getItem(BACKUP_KEY);
  if (backup) {
    const fromBackup = migrateRaw(backup);
    if (fromBackup) return fromBackup;
  }
  return seedState();
}

export function saveState(state: AppState): void {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing !== null) {
    localStorage.setItem(BACKUP_KEY, existing);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function snapshot(state: AppState): string {
  return JSON.stringify(state);
}

export function exportJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function tryRestoreBackup(): AppState | null {
  const raw = localStorage.getItem(BACKUP_KEY);
  if (!raw) return null;
  return migrateRaw(raw);
}
