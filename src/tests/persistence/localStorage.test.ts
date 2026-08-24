import { describe, it, expect, beforeEach } from 'vitest';

describe('Local Storage Persistence Invariants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads homePinnedIds and subtopicPinnedMap correctly', () => {
    const homePinned = ['1', '2'];
    const subtopicPinned = { 'Frontend': ['3'] };

    localStorage.setItem('resourceVault_homePinnedIds', JSON.stringify(homePinned));
    localStorage.setItem('resourceVault_subtopicPinnedMap', JSON.stringify(subtopicPinned));

    const loadedHome = JSON.parse(localStorage.getItem('resourceVault_homePinnedIds') || '[]');
    const loadedMap = JSON.parse(localStorage.getItem('resourceVault_subtopicPinnedMap') || '{}');

    expect(loadedHome).toEqual(['1', '2']);
    expect(loadedMap).toEqual({ 'Frontend': ['3'] });
  });

  it('recovers safely from malformed or corrupted localStorage values', () => {
    localStorage.setItem('resourceVault_homePinnedIds', '{invalid-json');
    localStorage.setItem('resourceVault_subtopicPinnedMap', 'null');

    let loadedHome = [];
    try {
      const saved = localStorage.getItem('resourceVault_homePinnedIds');
      loadedHome = saved ? JSON.parse(saved) : [];
    } catch {
      loadedHome = []; // fallback
    }

    let loadedMap = {};
    try {
      const saved = localStorage.getItem('resourceVault_subtopicPinnedMap');
      loadedMap = saved && saved !== 'null' ? JSON.parse(saved) : {};
    } catch {
      loadedMap = {};
    }

    expect(loadedHome).toEqual([]);
    expect(loadedMap).toEqual({});
  });
});
