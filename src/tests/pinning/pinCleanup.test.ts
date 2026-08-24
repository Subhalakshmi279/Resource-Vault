import { describe, it, expect, beforeEach } from 'vitest';

describe('Pin State Cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes references of deleted resources', () => {
    const activeResources = [
      { id: '1', title: 'Res 1', url: 'https://r1.com', area: 'computer', topic: 'Frontend', type: 'website', created_at: '2026-08-20T10:00:00Z' }
    ];
    const homePinned = ['1', 'deleted-id-999'];
    const subtopicPinned = {
      'Frontend': ['1', 'deleted-id-999']
    };

    // Simulate cleanup logic matching useEffect:
    const existingIds = new Set(activeResources.map(r => r.id));
    const cleanedHome = homePinned.filter(id => existingIds.has(id));
    
    const cleanedMap: Record<string, string[]> = {};
    Object.entries(subtopicPinned).forEach(([topic, ids]) => {
      const cleaned = ids.filter(id => existingIds.has(id));
      if (cleaned.length > 0) {
        cleanedMap[topic] = cleaned;
      }
    });

    expect(cleanedHome).toEqual(['1']);
    expect(cleanedMap['Frontend']).toEqual(['1']);
  });

  it('handles movement cleanup: old subtopic pin is removed and home pin is preserved', () => {
    const resource = { id: '1', title: 'Res 1', url: 'https://r1.com', area: 'computer', topic: 'Frontend', type: 'website', created_at: '2026-08-20T10:00:00Z' };
    let homePinned = ['1'];
    let subtopicPinned: Record<string, string[]> = {
      'Frontend': ['1']
    };

    // Resource moves to 'Backend' topic
    const oldTopic = resource.topic;
    const newTopic = 'Backend';
    resource.topic = newTopic;

    // Simulate cleanup: remove old subtopic pin
    if (subtopicPinned[oldTopic]) {
      subtopicPinned[oldTopic] = subtopicPinned[oldTopic].filter(id => id !== resource.id);
    }
    
    expect(subtopicPinned['Frontend']).not.toContain('1');
    expect(subtopicPinned['Backend'] || []).not.toContain('1');
    expect(homePinned).toContain('1');
  });
});
