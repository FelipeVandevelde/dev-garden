import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\-]+/g, '')
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

function buildRegistries() {
  const gardenDir = path.join(process.cwd(), 'src/content/garden');
  const publicSlugs = new Map();
  const privateSlugs = new Set();
  
  if (fs.existsSync(gardenDir)) {
    const files = walk(gardenDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const relativePath = path.relative(gardenDir, file);
        const normalizedPath = relativePath.replace(/\\/g, '/');
        const filename = path.basename(file);
        
        const isPrivatePath = normalizedPath.includes('_private/') || normalizedPath.startsWith('_') || filename.startsWith('_');
        
        const rawContent = fs.readFileSync(file, 'utf8');
        const parsed = matter(rawContent);
        
        const slug = slugify(filename.replace('.md', ''));
        
        if (isPrivatePath || parsed.data.draft === true) {
          privateSlugs.add(slug);
        } else {
          let body = parsed.content.replace(/\[!.*?\]/g, '').replace(/#+\s/g, '').replace(/\n/g, ' ').trim();
          body = body.replace(/\[\[(.*?)\]\]/g, '$1'); 
          const excerpt = body.length > 120 ? body.substring(0, 120) + '...' : body;

          publicSlugs.set(slug, {
            title: parsed.data.title || slug,
            status: parsed.data.status || 'sprout',
            excerpt: excerpt
          });
        }
      }
    }
  }
  return { publicSlugs, privateSlugs };
}

const { publicSlugs, privateSlugs } = buildRegistries();

export default function remarkWikilinks() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /\[\[(.*?)\]\]/g;
      const text = node.value;
      if (!text.includes('[[')) return;

      const newChildren = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          newChildren.push({ type: 'text', value: text.substring(lastIndex, match.index) });
        }

        const fullMatch = match[1];
        let target, label;
        if (fullMatch.includes('|')) {
          const parts = fullMatch.split('|');
          target = parts[0];
          label = parts[1];
        } else {
          target = fullMatch;
          label = fullMatch;
        }

        const slug = slugify(target);

        if (publicSlugs.has(slug)) {
          const data = publicSlugs.get(slug);
          const safeTitle = data.title.replace(/"/g, '&quot;');
          const safeExcerpt = data.excerpt.replace(/"/g, '&quot;');

          newChildren.push({
            type: 'html',
            value: `<a href="/garden/${slug}" class="wikilink" data-preview-title="${safeTitle}" data-preview-status="${data.status}" data-preview-excerpt="${safeExcerpt}">${label}</a>`
          });
        } else if (privateSlugs.has(slug)) {
          newChildren.push({
            type: 'html',
            value: `<span class="wikilink-stub wikilink-private" title="Private or work-in-progress note">[? ${label} ?]</span>`
          });
        } else {
          newChildren.push({
            type: 'html',
            value: `<span class="wikilink-stub wikilink-missing" title="Note does not exist">[❓ ${label} ❓]</span>`
          });
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        newChildren.push({ type: 'text', value: text.substring(lastIndex) });
      }

      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}