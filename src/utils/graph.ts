import { getCollection } from 'astro:content';
import { siteConfig } from '../site.config';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function resolveCandidateKeys(langDir: string, targetStr: string): string[] {
  let cleanTarget = targetStr.trim().replace(/\\/g, '/').replace(/\.mdx?$/i, '').replace(/^\/+/, '');
  if (cleanTarget.toLowerCase().startsWith(langDir.toLowerCase() + '/')) {
    cleanTarget = cleanTarget.substring(langDir.length + 1);
  }
  const targetParts = cleanTarget.split('/').filter(Boolean);
  const baseTarget = targetParts[targetParts.length - 1] || cleanTarget;

  return [
    `${langDir}/${cleanTarget.toLowerCase()}`,
    `${langDir}/${targetParts.map(slugify).join('/')}`,
    `${langDir}/${baseTarget.toLowerCase()}`,
    `${langDir}/${slugify(baseTarget)}`
  ];
}

export async function generateGraphData() {
  const gardenEntries = await getCollection('garden', ({ data, id }) => {
    const normalizedId = id.replace(/\\/g, '/');
    const parts = normalizedId.split('/');
    if (!siteConfig.locale.supported.includes(parts[0]) || parts.length < 2) {
      return false;
    }
    return data.draft !== true && !normalizedId.includes('/_') && !parts.some(p => p.startsWith('_'));
  });

  const publicSlugs = new Map<string, { lang: string; id: string; title: string; status: string; content: string }>();
  const lookupMap = new Map<string, string>();

  for (const entry of gardenEntries) {
    const normalizedId = entry.id.replace(/\\/g, '/').replace(/\.mdx?$/i, '');
    const parts = normalizedId.split('/');
    const langDir = parts[0];
    const slugParts = parts.slice(1);
    const fullSlug = slugParts.join('/');
    const baseName = slugParts[slugParts.length - 1];
    
    publicSlugs.set(normalizedId, {
      lang: langDir,
      id: normalizedId,
      title: entry.data.title || baseName,
      status: entry.data.status || 'sprout',
      content: entry.body || ''
    });

    const fullRawKey = `${langDir}/${fullSlug.toLowerCase()}`;
    const fullSlugifiedKey = `${langDir}/${slugParts.map(slugify).join('/')}`;
    const baseRawKey = `${langDir}/${baseName.toLowerCase()}`;
    const baseSlugifiedKey = `${langDir}/${slugify(baseName)}`;

    lookupMap.set(fullRawKey, normalizedId);
    lookupMap.set(fullSlugifiedKey, normalizedId);
    if (!lookupMap.has(baseRawKey)) {
      lookupMap.set(baseRawKey, normalizedId);
    }
    if (!lookupMap.has(baseSlugifiedKey)) {
      lookupMap.set(baseSlugifiedKey, normalizedId);
    }
  }

  const nodes: any[] = [];
  const links: any[] = [];
  const edgeSet = new Set<string>();

  for (const [id, data] of publicSlugs.entries()) {
    nodes.push({ id: data.id, title: data.title, status: data.status });
    
    const regex = /\[\[(.*?)\]\]/g;
    const langDir = data.lang;
    let match;
    
    while ((match = regex.exec(data.content)) !== null) {
      const fullMatch = match[1];
      const targetStr = fullMatch.includes('|') ? fullMatch.split('|')[0] : fullMatch;
      const candidateKeys = resolveCandidateKeys(langDir, targetStr);
      const matchedKey = candidateKeys.find(k => lookupMap.has(k));
      
      if (matchedKey) {
        const targetId = lookupMap.get(matchedKey)!;
        const edgeKey = `${id}->${targetId}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          links.push({ source: id, target: targetId });
        }
      }
    }
  }

  return { nodes, links };
}
