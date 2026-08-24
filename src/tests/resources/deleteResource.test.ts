import { describe, it, expect } from 'vitest';

describe('Delete Resource Logic', () => {
  it('removes the deleted resource from list and clears state selections', () => {
    let resources = [
      { id: '1', title: 'React Docs' },
      { id: '2', title: 'Vite Guide' }
    ];
    let selectedIds = ['1'];

    // Delete resource '1'
    resources = resources.filter(res => res.id !== '1');
    selectedIds = selectedIds.filter(id => id !== '1');

    expect(resources).toHaveLength(1);
    expect(resources[0].id).toBe('2');
    expect(selectedIds).toHaveLength(0);
  });
});
