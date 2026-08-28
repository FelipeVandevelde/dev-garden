import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

function generateGraph() {
  const gardenDir = path.join(process.cwd(), 'src/content/garden');
  const publicSlugs = new Map();
  
  // Pass 1: Build the registry of valid nodes
  if (fs.existsSync(gardenDir)) {
    const files = walk(gardenDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const relativePath = path.relative(gardenDir, file);
        const normalizedPath = relativePath.replace(/\\/g, '/');
        const filename = path.basename(file);
        const langDir = normalizedPath.split('/')[0];
        const slugParts = normalizedPath.split('/').slice(1);
        
        const isPrivatePath = slugParts.join('/').includes('_private/') || normalizedPath.startsWith('_') || filename.startsWith('_');
        
        const rawContent = fs.readFileSync(file, 'utf8');
        const parsed = matter(rawContent);
        
        const baseSlug = slugParts.join('/').replace(/\.md$/, '');
        const slug = `${langDir}/${baseSlug}`;
        
        if (!isPrivatePath && parsed.data.draft !== true) {
          publicSlugs.set(slug, {
            lang: langDir,
            baseSlug: baseSlug,
            id: slug,
            title: parsed.data.title || slug,
            status: parsed.data.status || 'sprout',
            content: parsed.content
          });
        }
      }
    }
  }

  const nodes = [];
  const links = [];
  const edgeSet = new Set();

  // Pass 2: Extract valid edges
  for (const [slug, data] of publicSlugs.entries()) {
    nodes.push({ id: data.id, title: data.title, status: data.status });
    
    const regex = /\[\[(.*?)\]\]/g;
    const langDir = data.lang;
    let match;
    while ((match = regex.exec(data.content)) !== null) {
      const fullMatch = match[1];
      const targetStr = fullMatch.includes('|') ? fullMatch.split('|')[0] : fullMatch;
      const targetBase = slugify(targetStr);
      const targetSlug = `${langDir}/${targetBase}`;
      
      // Only create edge if target is a valid public node
      if (publicSlugs.has(targetSlug)) {
        const edgeKey = `${slug}->${targetSlug}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          links.push({ source: slug, target: targetSlug });
        }
      }
    }
  }

  const outDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outData = { nodes, links };
  fs.writeFileSync(path.join(outDir, 'graph-data.json'), JSON.stringify(outData, null, 2));
  console.log(`[Graph Generator] Wrote ${nodes.length} nodes and ${links.length} links to public/graph-data.json`);
}

generateGraph();