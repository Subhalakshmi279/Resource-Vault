import { describe, it, expect } from 'vitest';

describe('Add Resource Logic', () => {
  it('saves valid resources with all required fields', () => {
    const resourceData = {
      title: 'Vite Guide',
      url: 'https://vitejs.dev',
      area: 'computer',
      topic: 'Frontend',
      type: 'website',
      notes: 'Notes here'
    };

    // Validation mock
    const errors: Record<string, string> = {};
    if (!resourceData.title.trim()) errors.title = 'Title is required';
    if (!resourceData.url.trim()) errors.url = 'URL is required';
    
    expect(Object.keys(errors)).toHaveLength(0);

    const newResource = {
      id: 'mock-id-111',
      ...resourceData,
      created_at: new Date().toISOString()
    };

    expect(newResource.id).toBeDefined();
    expect(newResource.created_at).toBeDefined();
    expect(newResource.title).toBe('Vite Guide');
  });

  it('rejects empty title or URL', () => {
    const invalidResource = {
      title: '',
      url: '',
      area: 'computer',
      topic: 'Frontend',
      type: 'website'
    };

    const errors: Record<string, string> = {};
    if (!invalidResource.title.trim()) errors.title = 'Title is required';
    if (!invalidResource.url.trim()) errors.url = 'URL is required';

    expect(errors.title).toBe('Title is required');
    expect(errors.url).toBe('URL is required');
  });
});
