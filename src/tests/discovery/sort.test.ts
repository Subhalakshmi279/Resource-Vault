import { describe, it, expect } from 'vitest';

describe('Discovery Sort Logic', () => {
  const resources = [
    { id: '1', title: 'React Docs', created_at: '2026-08-20T10:00:00Z' },
    { id: '2', title: 'Vite Guide', created_at: '2026-08-22T10:00:00Z' },
    { id: '3', title: 'A Handbook', created_at: '2026-08-21T10:00:00Z' }
  ];

  it('sorts by newest first', () => {
    const sorted = [...resources].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    expect(sorted[0].id).toBe('2'); // Vite Guide is newest
    expect(sorted[2].id).toBe('1'); // React Docs is oldest
  });

  it('sorts by oldest first', () => {
    const sorted = [...resources].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    expect(sorted[0].id).toBe('1');
    expect(sorted[2].id).toBe('2');
  });

  it('sorts alphabetically A to Z', () => {
    const sorted = [...resources].sort((a, b) => a.title.localeCompare(b.title));
    expect(sorted[0].title).toBe('A Handbook');
    expect(sorted[2].title).toBe('Vite Guide');
  });
});
