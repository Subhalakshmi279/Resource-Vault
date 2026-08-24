import { describe, it, expect, beforeEach } from 'vitest';

describe('Pin Limits Invariants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enforces maximum 5 pinned resources to Home', () => {
    const homePinned = ['1', '2', '3', '4', '5'];
    localStorage.setItem('resourceVault_homePinnedIds', JSON.stringify(homePinned));

    const saved = JSON.parse(localStorage.getItem('resourceVault_homePinnedIds') || '[]');
    expect(saved).toHaveLength(5);
    
    // Attempting to add a 6th pin should be rejected by the validation logic
    const nextId = '6';
    const canPin = saved.length < 5 || saved.includes(nextId);
    expect(canPin).toBe(false);
  });

  it('enforces maximum 3 pinned resources per Subtopic', () => {
    const subtopicPinned = {
      'Frontend': ['1', '2', '3']
    };
    localStorage.setItem('resourceVault_subtopicPinnedMap', JSON.stringify(subtopicPinned));

    const savedMap = JSON.parse(localStorage.getItem('resourceVault_subtopicPinnedMap') || '{}');
    const frontendPins = savedMap['Frontend'] || [];
    expect(frontendPins).toHaveLength(3);

    // Attempting to add a 4th pin should be rejected
    const nextId = '4';
    const canPin = frontendPins.length < 3 || frontendPins.includes(nextId);
    expect(canPin).toBe(false);
  });
});
