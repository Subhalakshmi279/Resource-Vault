import { describe, it, expect } from 'vitest';

describe('Discovery Type Filter', () => {
  const resources = [
    { id: '1', title: 'React Docs', type: 'website' },
    { id: '2', title: 'Vitest API', type: 'tool' },
    { id: '3', title: 'TS Handbook', type: 'book' }
  ];

  it('filters out unrelated resource types', () => {
    const selectedType = 'book';
    const filtered = resources.filter(res => res.type === selectedType);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('TS Handbook');
  });

  it('returns all resources when type is "all"', () => {
    const selectedType = 'all';
    const filtered = selectedType === 'all' ? resources : resources.filter(res => res.type === selectedType);

    expect(filtered).toHaveLength(3);
  });
});
