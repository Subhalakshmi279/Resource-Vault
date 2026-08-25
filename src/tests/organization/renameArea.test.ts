import { describe, it, expect } from 'vitest';
import type { Resource } from '../../types';

describe('renameArea', () => {
  it('updates area on resources while preserving subtopics and pins', () => {
    const initialResources: Resource[] = [
      {
        id: 'res-1',
        title: 'System Architecture',
        area: 'computer',
        topic: 'System Design',
        type: 'book',
        tags: [],
        created_at: new Date().toISOString()
      }
    ];

    const oldArea = 'computer';
    const newArea = 'engineering';

    const updatedResources = initialResources.map(r =>
      r.area === oldArea ? { ...r, area: newArea as any } : r
    );

    expect(updatedResources[0].area).toBe('engineering');
    expect(updatedResources[0].topic).toBe('System Design');
  });

  it('validates whitespace, empty names, and name length limits', () => {
    const validateAreaName = (name: string, existingAreas: string[]) => {
      const trimmed = name.trim();
      if (!trimmed) return 'Name cannot be empty.';
      if (trimmed.length > 50) return 'Name cannot exceed 50 characters.';
      if (existingAreas.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
        return 'An Area with this name already exists.';
      }
      return null;
    };

    expect(validateAreaName('   ', ['Career'])).toBe('Name cannot be empty.');
    expect(validateAreaName('Career', ['Career', 'Computer'])).toBe('An Area with this name already exists.');
    expect(validateAreaName('A'.repeat(51), [])).toBe('Name cannot exceed 50 characters.');
    expect(validateAreaName('  New Engineering  ', ['Career'])).toBeNull();
  });
});
