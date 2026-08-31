import { describe, expect, it } from 'vitest';
import { UNCATEGORISED_LABEL, groupByItemCategory } from './groupCategory';

describe('groupByItemCategory', () => {
  it('keeps first-seen named order and first spelling, case-insensitive', () => {
    const groups = groupByItemCategory([
      { id: 'a', category: 'Legal' },
      { id: 'b', category: '  equipment ' },
      { id: 'c', category: 'legal' },
      { id: 'd', category: 'Equipment' },
    ]);
    expect(groups.map((g) => g.label)).toEqual(['Legal', 'equipment']);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['a', 'c']);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(['b', 'd']);
  });

  it('puts blank and whitespace categories last with a quiet label', () => {
    const groups = groupByItemCategory([
      { id: 'a', category: '  ' },
      { id: 'b', category: 'Fit-out' },
      { id: 'c' },
      { id: 'd', category: '' },
    ]);
    expect(groups.map((g) => [g.label, g.uncategorised])).toEqual([
      ['Fit-out', false],
      [UNCATEGORISED_LABEL, true],
    ]);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(['a', 'c', 'd']);
  });
});
