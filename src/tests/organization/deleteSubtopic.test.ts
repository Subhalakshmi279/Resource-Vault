import { describe, it, expect } from 'vitest';
import type { Resource } from '../../types';

describe('deleteSubtopic', () => {
  it('removes subtopic resources, cleans up home pins, and removes subtopic pin entries', () => {
    const resources: Resource[] = [
      { id: 'res-1', title: 'File 1', area: 'career', topic: 'Backend', type: 'doc', tags: [], created_at: '' },
      { id: 'res-2', title: 'File 2', area: 'career', topic: 'Frontend', type: 'doc', tags: [], created_at: '' }
    ];

    let homePins = ['res-1', 'res-2'];
    let subtopicPins: Record<string, string[]> = {
      'Backend': ['res-1'],
      'Frontend': ['res-2']
    };

    const targetSubtopic = 'Backend';
    const targetArea = 'career';

    const idsToDelete = resources
      .filter(r => r.area === targetArea && r.topic === targetSubtopic)
      .map(r => r.id);

    // Update resources state
    const remainingResources = resources.filter(r => !idsToDelete.includes(r.id));
    // Clean up home pins
    homePins = homePins.filter(id => !idsToDelete.includes(id));
    // Clean up subtopic pin mapping
    delete subtopicPins[targetSubtopic];

    expect(remainingResources).toHaveLength(1);
    expect(remainingResources[0].id).toBe('res-2');
    expect(homePins).toEqual(['res-2']);
    expect(subtopicPins['Backend']).toBeUndefined();
    expect(subtopicPins['Frontend']).toEqual(['res-2']);
  });
});
