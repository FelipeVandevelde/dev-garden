import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkWikilinks from '../src/plugins/remark-wikilinks.js';

describe('remark-wikilinks AST Transformation', () => {
  it('should transform missing wikilinks into missing stubs', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkWikilinks)
      .use(remarkStringify);

    const input = 'This is a [[Missing Link]] test.';
    const result = await processor.process(input);
    
    expect(String(result)).toContain('<span class="wikilink-stub wikilink-missing" title="Note does not exist">[❓ Missing Link ?]</span>');
  });

  it('should handle custom labels in wikilinks', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkWikilinks)
      .use(remarkStringify);

    const input = 'Check out [[Missing Link|custom label]].';
    const result = await processor.process(input);
    
    expect(String(result)).toContain('<span class="wikilink-stub wikilink-missing" title="Note does not exist">[❓ custom label ?]</span>');
  });

  it('should escape HTML to prevent XSS', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkWikilinks)
      .use(remarkStringify);

    const input = 'Malicious [[Evil|" onmouseover="alert(1)]]';
    const result = await processor.process(input);
    
    expect(String(result)).toContain('&quot; onmouseover=&quot;alert(1)');
  });
});
