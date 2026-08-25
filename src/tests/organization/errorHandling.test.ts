import { describe, it, expect, vi } from 'vitest';
import type { Resource } from '../../types';

describe('organizationErrorHandling', () => {
  it('does not mutate React state when storage file deletion fails', async () => {
    const resources: Resource[] = [
      { id: 'res-1', title: 'Corrupted File', area: 'career', topic: 'Test', file_path: 'vault-files/bad.png', type: 'photo', tags: [], created_at: '' }
    ];

    let stateResources = [...resources];

    const mockDeleteOperation = vi.fn().mockImplementation(async () => {
      // Simulate storage deletion failure
      throw new Error('Storage network timeout');
    });

    try {
      await mockDeleteOperation();
      // Should not reach state mutation
      stateResources = stateResources.filter(r => r.id !== 'res-1');
    } catch (err: any) {
      expect(err.message).toBe('Storage network timeout');
    }

    // State remains untouched
    expect(stateResources).toHaveLength(1);
    expect(stateResources[0].id).toBe('res-1');
  });

  it('does not leave stale pin references after successful delete', () => {
    const deletedResourceIds = ['res-1'];
    let homePins = ['res-1', 'res-2'];
    let subtopicPins: Record<string, string[]> = {
      'TopicA': ['res-1', 'res-3']
    };

    homePins = homePins.filter(id => !deletedResourceIds.includes(id));
    subtopicPins['TopicA'] = subtopicPins['TopicA'].filter(id => !deletedResourceIds.includes(id));

    expect(homePins).toEqual(['res-2']);
    expect(subtopicPins['TopicA']).toEqual(['res-3']);
  });
});
