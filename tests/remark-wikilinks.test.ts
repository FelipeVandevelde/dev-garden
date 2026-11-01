import { describe, it, expect, beforeEach } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkWikilinks, {
  clearGardenRegistry,
  registerGardenNote,
  setCurrentGardenLang
} from '../src/plugins/remark-wikilinks.js';

describe('remark-wikilinks AST Transformation', () => {
  beforeEach(() => {
    clearGardenRegistry();
  });

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

  it('should resolve nested vault notes by both shortest filename and full relative path', async () => {
    registerGardenNote({
      id: 'pt-br/pasta teste/nota da pasta',
      title: 'Nota da Pasta',
      status: 'growing',
      draft: false,
      content: 'Conteúdo da nota aninhada no cofre.'
    });
    setCurrentGardenLang('pt-br');

    const processor = unified()
      .use(remarkParse)
      .use(remarkWikilinks)
      .use(remarkStringify);

    const byBaseName = await processor.process('Veja [[nota da pasta]].');
    expect(String(byBaseName)).toContain('href="/pt-br/garden/pasta teste/nota da pasta"');
    expect(String(byBaseName)).toContain('data-preview-title="Nota da Pasta"');
    expect(String(byBaseName)).toContain('data-preview-status="growing"');

    const byFullPath = await processor.process('Veja [[pasta teste/nota da pasta|Nota Aninhada]].');
    expect(String(byFullPath)).toContain('href="/pt-br/garden/pasta teste/nota da pasta"');
    expect(String(byFullPath)).toContain('>Nota Aninhada</a>');
  });

  it('should render private or draft notes from the in-memory registry as private stubs', async () => {
    registerGardenNote({
      id: 'en/sub/secret-draft',
      title: 'Secret Draft',
      status: 'sprout',
      draft: true,
      content: 'Hidden draft content'
    });
    setCurrentGardenLang('en');

    const processor = unified()
      .use(remarkParse)
      .use(remarkWikilinks)
      .use(remarkStringify);

    const result = await processor.process('Link to [[secret-draft]].');
    expect(String(result)).toContain('<span class="wikilink-stub wikilink-private" title="Private or work-in-progress note">[? secret-draft ?]</span>');
  });
});
