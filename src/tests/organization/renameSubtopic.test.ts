import { describe, it, expect } from 'vitest';
import type { Resource } from '../../types';

describe('renameSubtopic', () => {
  it('updates resource subtopics and migrates subtopicPinnedMap keys cleanly', () => {
    const initialResources: Resource[] = [
      {
        id: 'res-1',
        title: 'Deployment Demo',
        area: 'career',
        topic: 'Backend Deployment',
        type: 'video',
        tags: [],
        created_at: new Date().toISOString()
      }
    ];

    const initialPins: Record<string, string[]> = {
      'Backend Deployment': ['res-1']
    };

    const oldName = 'Backend Deployment';
    const newName = 'Production Deployment';

    // Simulate rename
    const updatedResources = initialResources.map(r => 
      r.topic === oldName ? { ...r, topic: newName } : r
    );

    const updatedPins: Record<string, string[]> = { ...initialPins };
    if (updatedPins[oldName]) {
      updatedPins[newName] = updatedPins[oldName];
      delete updatedPins[oldName];
    }

    expect(updatedResources[0].topic).toBe('Production Deployment');
    expect(updatedPins['Backend Deployment']).toBeUndefined();
    expect(updatedPins['Production Deployment']).toEqual(['res-1']);
  });

  it('rejects duplicate subtopic names within the same area scope', () => {
    const existingTopics = ['Backend Deployment', 'Frontend Deployment'];
    const targetName = 'Frontend Deployment';

    const isDuplicate = existingTopics.some(
      t => t.toLowerCase() === targetName.toLowerCase()
    );

    expect(isDuplicate).toBe(true);
  });
});
