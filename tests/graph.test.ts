import { describe, it, expect, vi } from 'vitest';

vi.mock('astro:content', () => {
  return {
    getCollection: async (_collectionName: string, filterFn?: any) => {
      const mockData = [
        { id: 'Bem-vindo', data: { title: 'Bem-vindo', status: 'sprout', draft: false }, body: 'Root level note without language should be ignored' },
        { id: 'en/note1', data: { title: 'Note 1', status: 'sprout', draft: false }, body: 'Link to [[Note 2]] and [[my second note]]' },
        { id: 'en/note-2', data: { title: 'Note 2', status: 'evergreen', draft: false }, body: 'No links here' },
        { id: 'en/my second note', data: { title: 'My Second Note', status: 'growing', draft: false }, body: 'Links to [[sub/deep note]]' },
        { id: 'en/sub/deep note', data: { title: 'Deep Note', status: 'evergreen', draft: false }, body: 'Back to [[note1]]' },
        { id: 'pt-br/minha-primeira-nota', data: { title: 'Minha Primeira Nota', status: 'sprout', draft: false }, body: 'Links to [[nota da pasta]] and [[pasta teste/nota da pasta]]' },
        { id: 'pt-br/pasta teste/nota da pasta', data: { title: 'Nota da Pasta', status: 'growing', draft: false }, body: 'Nested note content' },
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
  it('should extract valid nodes and links, support nested paths & spaces, and ignore root-level, draft, and private notes', async () => {
    const { nodes, links } = await generateGraphData();
    
    const nodeIds = nodes.map(n => n.id);
    // Root-level, draft, and private notes must be excluded
    expect(nodeIds).not.toContain('Bem-vindo');
    expect(nodeIds).not.toContain('en/_secret');
    expect(nodeIds).not.toContain('en/draft1');

    // Valid language-scoped flat and nested notes must be included
    expect(nodeIds).toContain('en/note1');
    expect(nodeIds).toContain('en/note-2');
    expect(nodeIds).toContain('en/my second note');
    expect(nodeIds).toContain('en/sub/deep note');
    expect(nodeIds).toContain('pt-br/minha-primeira-nota');
    expect(nodeIds).toContain('pt-br/pasta teste/nota da pasta');
    expect(nodes).toHaveLength(6);
    
    // Check links extraction across flat, spaced, and nested paths
    expect(links).toEqual(
      expect.arrayContaining([
        { source: 'en/note1', target: 'en/note-2' },
        { source: 'en/note1', target: 'en/my second note' },
        { source: 'en/my second note', target: 'en/sub/deep note' },
        { source: 'en/sub/deep note', target: 'en/note1' },
        { source: 'pt-br/minha-primeira-nota', target: 'pt-br/pasta teste/nota da pasta' },
      ])
    );
    // Duplicate links (both [[nota da pasta]] and [[pasta teste/nota da pasta]]) should deduplicate to a single edge
    const ptEdges = links.filter(l => l.source === 'pt-br/minha-primeira-nota');
    expect(ptEdges).toHaveLength(1);
  });
});
