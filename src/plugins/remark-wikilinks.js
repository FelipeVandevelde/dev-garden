import { visit } from 'unist-util-visit';

export function slugify(text) {
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

function getGlobalState() {
  if (!globalThis.__DEV_GARDEN_WIKILINKS__) {
    globalThis.__DEV_GARDEN_WIKILINKS__ = {
      publicSlugs: new Map(),
      privateSlugs: new Set(),
      currentLang: null
    };
  }
  return globalThis.__DEV_GARDEN_WIKILINKS__;
}

export function clearGardenRegistry() {
  const state = getGlobalState();
  state.publicSlugs.clear();
  state.privateSlugs.clear();
  state.currentLang = null;
}

export function setCurrentGardenLang(lang) {
  const state = getGlobalState();
  state.currentLang = lang;
}

export function createExcerpt(rawMarkdownBody = '') {
  let body = rawMarkdownBody
    .replace(/\[!.*?\]/g, '')
    .replace(/#+\s/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\n/g, ' ')
    .trim();

  body = body.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1');

  let excerpt = body;
  if (excerpt.length > 120) {
    const cut = excerpt.substring(0, 120);
    const lastSpace = cut.lastIndexOf(' ');
    excerpt = (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + '...';
  }
  return excerpt;
}

export function registerGardenNote({ id, title, status = 'sprout', draft = false, content = '' }) {
  if (!id || typeof id !== 'string') return;
  const state = getGlobalState();
  const normalizedId = id.replace(/\\/g, '/').replace(/\.mdx?$/i, '');
  const parts = normalizedId.split('/');
  if (parts.length < 2) return;

  const langDir = parts[0];
  const slugParts = parts.slice(1);
  const fullSlug = slugParts.join('/');
  const baseName = slugParts[slugParts.length - 1];

  const isPrivatePath = parts.some(p => p.startsWith('_'));
  const isPrivate = isPrivatePath || draft === true;

  const fullRawKey = `${langDir}/${fullSlug.toLowerCase()}`;
  const fullSlugifiedKey = `${langDir}/${slugParts.map(slugify).join('/')}`;
  const baseRawKey = `${langDir}/${baseName.toLowerCase()}`;
  const baseSlugifiedKey = `${langDir}/${slugify(baseName)}`;

  if (isPrivate) {
    state.privateSlugs.add(fullRawKey);
    state.privateSlugs.add(fullSlugifiedKey);
    state.privateSlugs.add(baseRawKey);
    state.privateSlugs.add(baseSlugifiedKey);
  } else {
    const noteRecord = {
      title: title || baseName,
      status: status || 'sprout',
      excerpt: createExcerpt(content),
      fullSlug
    };

    state.publicSlugs.set(fullRawKey, noteRecord);
    state.publicSlugs.set(fullSlugifiedKey, noteRecord);
    if (!state.publicSlugs.has(baseRawKey)) {
      state.publicSlugs.set(baseRawKey, noteRecord);
    }
    if (!state.publicSlugs.has(baseSlugifiedKey)) {
      state.publicSlugs.set(baseSlugifiedKey, noteRecord);
    }
  }
}

function resolveCandidateKeys(currentLang, target) {
  let cleanTarget = target.trim().replace(/\\/g, '/').replace(/\.mdx?$/i, '').replace(/^\/+/, '');
  if (cleanTarget.toLowerCase().startsWith(currentLang.toLowerCase() + '/')) {
    cleanTarget = cleanTarget.substring(currentLang.length + 1);
  }
  const targetParts = cleanTarget.split('/').filter(Boolean);
  const baseTarget = targetParts[targetParts.length - 1] || cleanTarget;

  return [
    `${currentLang}/${cleanTarget.toLowerCase()}`,
    `${currentLang}/${targetParts.map(slugify).join('/')}`,
    `${currentLang}/${baseTarget.toLowerCase()}`,
    `${currentLang}/${slugify(baseTarget)}`
  ];
}

export default function remarkWikilinks() {
  return (tree, file) => {
    const { publicSlugs, privateSlugs, currentLang: activeLang } = getGlobalState();
    const filePath = file?.history?.[0] ? file.history[0].replace(/\\/g, '/') : (file?.path ? String(file.path).replace(/\\/g, '/') : '');
    const matchLang = filePath.match(/(?:^|\/)(en|pt-br)\//);
    const currentLang = activeLang || (matchLang ? matchLang[1] : 'en');
    
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

        const candidateKeys = resolveCandidateKeys(currentLang, target);
        const safeLabel = escapeHTML(label);

        const matchedPublicKey = candidateKeys.find(k => publicSlugs.has(k));
        const matchedPrivateKey = candidateKeys.find(k => privateSlugs.has(k));

        if (matchedPublicKey) {
          const data = publicSlugs.get(matchedPublicKey);
          const safeTitle = escapeHTML(data.title);
          const safeExcerpt = escapeHTML(data.excerpt);
          const prefix = currentLang === 'en' ? '' : '/' + currentLang;

          newChildren.push({
            type: 'html',
            value: `<a href="${prefix}/garden/${data.fullSlug}" class="wikilink" data-preview-title="${safeTitle}" data-preview-status="${data.status}" data-preview-excerpt="${safeExcerpt}">${safeLabel}</a>`
          });
        } else if (matchedPrivateKey) {
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
