import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';

// Slugify function mirroring Astro's default behavior
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Build a static registry of valid public slugs
function buildSlugRegistry() {
  const gardenDir = path.join(process.cwd(), 'src/content/garden');
  const validSlugs = new Set();
  
  if (fs.existsSync(gardenDir)) {
    const files = fs.readdirSync(gardenDir);
    for (const file of files) {
      if (file.endsWith('.md') && !file.startsWith('_')) {
        const content = fs.readFileSync(path.join(gardenDir, file), 'utf8');
        // Simple frontmatter check for draft: true
        if (!content.includes('draft: true')) {
          validSlugs.add(slugify(file.replace('.md', '')));
        }
      }
    }
  }
  return validSlugs;
}

const validSlugsCache = buildSlugRegistry();

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

        if (validSlugsCache.has(slug)) {
          newChildren.push({
            type: 'link',
            url: `/garden/${slug}`,
            children: [{ type: 'text', value: label }]
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