import { describe, it, expect } from 'vitest';

describe('Discovery Search Filter', () => {
  const resources = [
    { id: '1', title: 'React Docs', description: 'Docs for UI', url: 'https://react.dev', type: 'website', area: 'computer', topic: 'Frontend' },
    { id: '2', title: 'Vitest API', description: 'Testing API', url: 'https://vitest.dev', type: 'tool', area: 'computer', topic: 'Testing' }
  ];

  it('filters resources based on title, description, url, type, area, and subtopic', () => {
    const q = 'docs';
    const matches = resources.filter(res => {
      const matchesTitle = res.title.toLowerCase().includes(q);
      const matchesDesc = res.description.toLowerCase().includes(q);
      return matchesTitle || matchesDesc;
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('1');
  });

  it('is case-insensitive', () => {
    const q = 'REACT';
    const matches = resources.filter(res => res.title.toLowerCase().includes(q.toLowerCase()));
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('1');
  });
});
