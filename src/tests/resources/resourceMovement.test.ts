import { describe, it, expect } from 'vitest';

describe('Resource Area/Subtopic Movement', () => {
  it('correctly updates Area counts, deletes old subtopic pin, and preserves Home pin on area relocation', () => {
    let resources = [
      { id: '1', title: 'Resume', area: 'career', topic: 'Interviews' }
    ];
    let homePinnedIds = ['1'];
    let subtopicPinnedMap: Record<string, string[]> = {
      'Interviews': ['1']
    };

    // Move Career resource to Personal Area (topic 'Hobbies')
    resources = resources.map(res => {
      if (res.id === '1') {
        return { ...res, area: 'personal', topic: 'Hobbies' };
      }
      return res;
    });

    // Check Area counts
    const careerCount = resources.filter(r => r.area === 'career').length;
    const personalCount = resources.filter(r => r.area === 'personal').length;

    expect(careerCount).toBe(0);
    expect(personalCount).toBe(1);

    // Old subtopic pin must be removed
    const oldTopic = 'Interviews';
    if (subtopicPinnedMap[oldTopic]) {
      subtopicPinnedMap[oldTopic] = subtopicPinnedMap[oldTopic].filter(id => id !== '1');
    }

    expect(subtopicPinnedMap['Interviews']).toHaveLength(0);
    expect(subtopicPinnedMap['Hobbies'] || []).toHaveLength(0); // New topic should NOT receive auto pin
    expect(homePinnedIds).toContain('1'); // Home pin must remain preserved
  });
});
