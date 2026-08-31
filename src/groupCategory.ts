export const UNCATEGORISED_LABEL = 'Uncategorised';

export function itemCategoryLabel(value: string | undefined | null): string {
  return (value ?? '').trim();
}

/** Trim for persist-on-blur. Blank/whitespace becomes undefined (uncategorised). */
export function commitCategory(value: string | undefined | null): string | undefined {
  const trimmed = itemCategoryLabel(value);
  return trimmed || undefined;
}

export interface CategoryGroup<T> {
  key: string;
  label: string;
  uncategorised: boolean;
  items: T[];
}

/**
 * Group items by free-text category. Named groups keep first-seen order and first spelling; blank/whitespace last.
 * Callers must pass committed store values (CategoryInput writes on blur), not a live keystroke draft.
 */
export function groupByItemCategory<T extends { category?: string }>(items: T[]): CategoryGroup<T>[] {
  const named: CategoryGroup<T>[] = [];
  const uncategorisedItems: T[] = [];
  const indexByLower = new Map<string, number>();

  for (const item of items) {
    const trimmed = itemCategoryLabel(item.category);
    if (!trimmed) {
      uncategorisedItems.push(item);
      continue;
    }
    const lower = trimmed.toLowerCase();
    const existing = indexByLower.get(lower);
    if (existing === undefined) {
      indexByLower.set(lower, named.length);
      named.push({ key: lower, label: trimmed, uncategorised: false, items: [item] });
    } else {
      named[existing]?.items.push(item);
    }
  }

  if (uncategorisedItems.length === 0) return named;
  return [
    ...named,
    {
      key: '',
      label: UNCATEGORISED_LABEL,
      uncategorised: true,
      items: uncategorisedItems,
    },
  ];
}
