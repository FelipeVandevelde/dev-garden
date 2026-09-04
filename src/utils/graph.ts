import { getCollection } from 'astro:content';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function generateGraphData() {
  const gardenEntries = await getCollection('garden', ({ data, id }) => {
    return data.draft !== true && !id.includes('/_') && !id.split('/').pop()?.startsWith('_');
  });

  const publicSlugs = new Map();

  for (const entry of gardenEntries) {
    const parts = entry.id.split('/');
    const langDir = parts[0];
    
    publicSlugs.set(entry.id, {
      lang: langDir,
      id: entry.id,
      title: entry.data.title || entry.id,
      status: entry.data.status || 'sprout',
      content: entry.body || ''
    });
  }

  const nodes: any[] = [];
  const links: any[] = [];
  const edgeSet = new Set();

  for (const [id, data] of publicSlugs.entries()) {
    nodes.push({ id: data.id, title: data.title, status: data.status });
    
    const regex = /\[\[(.*?)\]\]/g;
    const langDir = data.lang;
    let match;
    
    while ((match = regex.exec(data.content)) !== null) {
      const fullMatch = match[1];
      const targetStr = fullMatch.includes('|') ? fullMatch.split('|')[0] : fullMatch;
      const targetBase = slugify(targetStr);
      const targetSlug = `${langDir}/${targetBase}`;
      
      if (publicSlugs.has(targetSlug)) {
        const edgeKey = `${id}->${targetSlug}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          links.push({ source: id, target: targetSlug });
        }
      }
    }
  }

  return { nodes, links };
}
