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

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
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

let cachedRegistries = null;

function buildRegistries() {
  if (cachedRegistries) return cachedRegistries;
  
  const gardenDir = path.resolve(process.cwd(), 'src/content/garden');
  const publicSlugs = new Map();
  const privateSlugs = new Set();
  
  if (fs.existsSync(gardenDir)) {
    const files = walk(gardenDir);
    for (const file of files) {
      if (file.match(/\.mdx?$/)) {
        const relativePath = path.relative(gardenDir, file);
        const normalizedPath = relativePath.replace(/\\/g, '/');
        const filename = path.basename(file);
        const langDir = normalizedPath.split('/')[0];
        const slugParts = normalizedPath.split('/').slice(1);
        
        const isPrivatePath = slugParts.join('/').includes('_private/') || normalizedPath.startsWith('_') || filename.startsWith('_');
        
        const rawContent = fs.readFileSync(file, 'utf8');
        let parsed;
        try {
          parsed = matter(rawContent);
        } catch (err) {
          continue;
        }
        
        const fullSlug = slugParts.join('/').replace(/\.mdx?$/, '');
        const flatSlug = slugify(filename.replace(/\.mdx?$/, ''));
        const publicSlugKey = `${langDir}/${flatSlug}`;
        
        if (isPrivatePath || parsed.data.draft === true) {
          privateSlugs.add(publicSlugKey);
        } else {
          let body = parsed.content
            .replace(/\[!.*?\]/g, '')
            .replace(/#+\s/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/[*_~`]/g, '')
            .replace(/\n/g, ' ')
            .trim();
          
          body = body.replace(/\[\[(.*?)\]\]/g, '$1'); 
          
          let excerpt = body;
          if (excerpt.length > 120) {
            const cut = excerpt.substring(0, 120);
            const lastSpace = cut.lastIndexOf(' ');
            excerpt = (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + '...';
          }

          publicSlugs.set(publicSlugKey, {
            title: parsed.data.title || filename.replace(/\.mdx?$/, ''),
            status: parsed.data.status || 'sprout',
            excerpt: excerpt,
            fullSlug: fullSlug
          });
        }
      }
    }
  }
  cachedRegistries = { publicSlugs, privateSlugs };
  return cachedRegistries;
}

export default function remarkWikilinks() {
  return (tree, file) => {
    const { publicSlugs, privateSlugs } = buildRegistries();
    const filePath = file.history[0] ? file.history[0].replace(/\\/g, '/') : '';
    const matchLang = filePath.match(/content\/garden\/([^\/]+)/);
    const currentLang = matchLang ? matchLang[1] : 'en';
    
    visit(tree, 'text', (node, index, parent) => {
      if (parent && (parent.type === 'code' || parent.type === 'inlineCode' || parent.type === 'link')) {
        return;
      }

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

        const baseSlug = slugify(target.split('/').pop());
        const slugKey = `${currentLang}/${baseSlug}`;
        
        const safeLabel = escapeHTML(label);

        if (publicSlugs.has(slugKey)) {
          const data = publicSlugs.get(slugKey);
          const safeTitle = escapeHTML(data.title);
          const safeExcerpt = escapeHTML(data.excerpt);
          const prefix = currentLang === 'en' ? '' : '/' + currentLang;

          newChildren.push({
            type: 'html',
            value: `<a href="${prefix}/garden/${data.fullSlug}" class="wikilink" data-preview-title="${safeTitle}" data-preview-status="${data.status}" data-preview-excerpt="${safeExcerpt}">${safeLabel}</a>`
          });
        } else if (privateSlugs.has(slugKey)) {
          newChildren.push({
            type: 'html',
            value: `<span class="wikilink-stub wikilink-private" title="Private or work-in-progress note">[? ${safeLabel} ?]</span>`
          });
        } else {
          newChildren.push({
            type: 'html',
            value: `<span class="wikilink-stub wikilink-missing" title="Note does not exist">[❓ ${safeLabel} ?]</span>`
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