import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => {
  return {
    getCollection: async (collectionName: string, filterFn?: any) => {
      const mockData = [
        { id: 'en/note1', data: { title: 'Note 1', status: 'sprout', draft: false }, body: 'Link to [[Note 2]]' },
        { id: 'en/note-2', data: { title: 'Note 2', status: 'evergreen', draft: false }, body: 'No links here' },
        { id: 'en/_secret', data: { title: 'Secret', status: 'sprout', draft: false }, body: 'Should be ignored' },
        { id: 'en/draft1', data: { title: 'Draft', status: 'sprout', draft: true }, body: 'Draft' },
      ];
      
      if (filterFn) {
        return mockData.filter(entry => filterFn(entry));
      }
      return mockData;
    }
  };
});

import { generateGraphData } from '../src/utils/graph';

describe('generateGraphData', () => {
  it('should extract valid nodes and links while ignoring drafts and private notes', async () => {
    const { nodes, links } = await generateGraphData();
    
    // Only en/note1 and en/note2 should be included
    expect(nodes).toHaveLength(2);
    expect(nodes.map(n => n.id)).toContain('en/note1');
    expect(nodes.map(n => n.id)).toContain('en/note-2');
    
    // Check links extraction
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe('en/note1');
    expect(links[0].target).toBe('en/note-2');
  });
});
