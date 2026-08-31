import { beforeEach, describe, expect, it } from 'vitest';
import { seedState } from './seed';
import { BACKUP_KEY, STORAGE_KEY, exportJson, loadState, saveState } from './store';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

describe('loadState category migration', () => {
  it('keeps STORAGE_KEY v2 and does not replace a parseable save missing category', () => {
    expect(STORAGE_KEY).toBe('roma-deli-planner-v2');
    expect(BACKUP_KEY).toBe('roma-deli-planner-v2-prev');

    const old = {
      version: 2,
      startupItems: [
        {
          id: 'keep-si',
          categoryId: 'sc-cafe',
          unit: 'cafe',
          name: 'Custom machine',
          newPrice: 1234,
          usedPrice: null,
          condition: 'new',
          notes: 'mine',
          supplier: 'Acme',
          url: '',
          excludeFromContingency: false,
          final: false,
        },
      ],
      outgoingItems: [
        {
          id: 'keep-oi',
          categoryId: 'oc-cafe',
          unit: 'cafe',
          name: 'Custom rent',
          cost: 99,
          frequency: 'monthly',
          notes: '',
          final: false,
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    const loaded = loadState();
    const si = loaded.startupItems.find((i) => i.id === 'keep-si');
    const oi = loaded.outgoingItems.find((i) => i.id === 'keep-oi');
    expect(si?.name).toBe('Custom machine');
    expect(si?.newPrice).toBe(1234);
    expect(si?.category).toBeUndefined();
    expect(oi?.name).toBe('Custom rent');
    expect(oi?.cost).toBe(99);
    expect(oi?.category).toBeUndefined();
    expect(loaded.startupItems.some((i) => i.id === 'si-coffee')).toBe(false);
  });

  it('round-trips category through JSON backup', () => {
    const state = seedState();
    const coffee = state.startupItems.find((i) => i.id === 'si-coffee')!;
    coffee.category = 'Equipment';
    const rent = state.outgoingItems.find((i) => i.id === 'oi-rent')!;
    rent.category = 'Premises';
    const json = exportJson(state);
    expect(json).toContain('"category": "Equipment"');
    expect(json).toContain('"category": "Premises"');
    localStorage.setItem(STORAGE_KEY, json);
    const loaded = loadState();
    expect(loaded.startupItems.find((i) => i.id === 'si-coffee')?.category).toBe('Equipment');
    expect(loaded.outgoingItems.find((i) => i.id === 'oi-rent')?.category).toBe('Premises');
  });

  it('copies last-good save to prev key', () => {
    localStorage.setItem(STORAGE_KEY, '{"version":2,"startupItems":[]}');
    saveState(seedState());
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{"version":2,"startupItems":[]}');
  });
});
