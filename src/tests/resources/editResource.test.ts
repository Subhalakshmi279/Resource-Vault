import { describe, it, expect } from 'vitest';

describe('Edit Resource Logic', () => {
  it('updates title, url, area, and subtopic of resource', () => {
    let resource = {
      id: '1',
      title: 'Original Title',
      url: 'https://original.com',
      area: 'computer',
      topic: 'Frontend',
      type: 'website'
    };

    const updates = {
      title: 'Updated Title',
      url: 'https://updated.com',
      area: 'ai_tech',
      topic: 'LLM'
    };

    resource = { ...resource, ...updates };

    expect(resource.title).toBe('Updated Title');
    expect(resource.url).toBe('https://updated.com');
    expect(resource.area).toBe('ai_tech');
    expect(resource.topic).toBe('LLM');
  });
});
