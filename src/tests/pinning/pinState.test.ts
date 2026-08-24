import { describe, it, expect, beforeEach } from 'vitest';

describe('Pin State Independence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows resource to be pinned to both Home and Subtopic simultaneously', () => {
    const resourceId = 'test-res-123';
    const homePinned = [resourceId];
    const subtopicPinned = {
      'Frontend': [resourceId]
    };

    localStorage.setItem('resourceVault_homePinnedIds', JSON.stringify(homePinned));
    localStorage.setItem('resourceVault_subtopicPinnedMap', JSON.stringify(subtopicPinned));

    const savedHome = JSON.parse(localStorage.getItem('resourceVault_homePinnedIds') || '[]');
    const savedMap = JSON.parse(localStorage.getItem('resourceVault_subtopicPinnedMap') || '{}');

    expect(savedHome).toContain(resourceId);
    expect(savedMap['Frontend']).toContain(resourceId);
  });

  it('unpins from Home without affecting Subtopic pin', () => {
    const resourceId = 'test-res-123';
    let homePinned = [resourceId];
    let subtopicPinned = {
      'Frontend': [resourceId]
    };

    // Unpin from Home
    homePinned = homePinned.filter(id => id !== resourceId);

    expect(homePinned).not.toContain(resourceId);
    expect(subtopicPinned['Frontend']).toContain(resourceId);
  });

  it('unpins from Subtopic without affecting Home pin', () => {
    const resourceId = 'test-res-123';
    let homePinned = [resourceId];
    let subtopicPinned = {
      'Frontend': [resourceId]
    };

    // Unpin from Subtopic
    subtopicPinned['Frontend'] = subtopicPinned['Frontend'].filter(id => id !== resourceId);

    expect(homePinned).toContain(resourceId);
    expect(subtopicPinned['Frontend']).not.toContain(resourceId);
  });
});
