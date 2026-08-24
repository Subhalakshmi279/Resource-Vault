import { describe, it, expect } from 'vitest';

describe('Pagination Boundaries & Ranges', () => {
  const mockItems = Array.from({ length: 25 }, (_, i) => ({ id: `${i + 1}`, title: `Item ${i + 1}` }));
  const ITEMS_PER_PAGE = 10;

  it('calculates the correct page count', () => {
    const totalPages = Math.ceil(mockItems.length / ITEMS_PER_PAGE);
    expect(totalPages).toBe(3);
  });

  it('correctly slices items for page 1', () => {
    const currentPage = 1;
    const paginated = mockItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    expect(paginated).toHaveLength(10);
    expect(paginated[0].id).toBe('1');
    expect(paginated[9].id).toBe('10');
  });

  it('correctly slices items for final page', () => {
    const currentPage = 3;
    const paginated = mockItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    expect(paginated).toHaveLength(5);
    expect(paginated[0].id).toBe('21');
    expect(paginated[4].id).toBe('25');
  });
});
