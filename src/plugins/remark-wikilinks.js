import { visit } from 'unist-util-visit';
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

function buildSlugRegistry() {
  const gardenDir = path.join(process.cwd(), 'src/content/garden');
  const slugs = new Map();
  
  if (fs.existsSync(gardenDir)) {
    const files = fs.readdirSync(gardenDir);
    for (const file of files) {
      if (file.endsWith('.md') && !file.startsWith('_')) {
        const rawContent = fs.readFileSync(path.join(gardenDir, file), 'utf8');
        const parsed = matter(rawContent);
        
        if (parsed.data.draft !== true) {
          const slug = slugify(file.replace('.md', ''));
          
          let body = parsed.content.replace(/\[!.*?\]/g, '').replace(/#+\s/g, '').replace(/\n/g, ' ').trim();
          body = body.replace(/\[\[(.*?)\]\]/g, '$1'); // Strip wikilinks from excerpt
          const excerpt = body.length > 120 ? body.substring(0, 120) + '...' : body;

          slugs.set(slug, {
            title: parsed.data.title || slug,
            status: parsed.data.status || 'sprout',
            excerpt: excerpt
          });
        }
      }
    }
  }
  return slugs;
}

const registry = buildSlugRegistry();

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

        if (registry.has(slug)) {
          const data = registry.get(slug);
          
          // Escape HTML attributes just in case
          const safeTitle = data.title.replace(/"/g, '&quot;');
          const safeExcerpt = data.excerpt.replace(/"/g, '&quot;');

          newChildren.push({
            type: 'html',
            value: `<a href="/garden/${slug}" class="wikilink" data-preview-title="${safeTitle}" data-preview-status="${data.status}" data-preview-excerpt="${safeExcerpt}">${label}</a>`
          });
        } else {
          newChildren.push({
            type: 'html',
            value: `<span class="wikilink-stub" title="Private or work-in-progress note">[🔒 ${label} 🔒]</span>`
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