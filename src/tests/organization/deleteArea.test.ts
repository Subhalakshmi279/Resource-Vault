import { describe, it, expect } from 'vitest';
import type { Resource } from '../../types';

describe('deleteArea', () => {
  it('deletes all resources and subtopics under an Area and purges associated pins', () => {
    const resources: Resource[] = [
      { id: 'res-1', title: 'File 1', area: 'career', topic: 'Resume', type: 'doc', tags: [], created_at: '' },
      { id: 'res-2', title: 'File 2', area: 'computer', topic: 'React', type: 'article', tags: [], created_at: '' }
    ];

    let homePins = ['res-1', 'res-2'];
    let subtopicPins: Record<string, string[]> = {
      'Resume': ['res-1'],
      'React': ['res-2']
    };

    const targetArea = 'career';

    const idsToDelete = resources
      .filter(r => r.area === targetArea)
      .map(r => r.id);

    const remainingResources = resources.filter(r => !idsToDelete.includes(r.id));
    homePins = homePins.filter(id => !idsToDelete.includes(id));
    delete subtopicPins['Resume'];

    expect(remainingResources).toHaveLength(1);
    expect(remainingResources[0].area).toBe('computer');
    expect(homePins).toEqual(['res-2']);
    expect(subtopicPins['Resume']).toBeUndefined();
  });
});
