import { z, defineCollection } from 'astro:content';
import { loadEnv } from 'vite';
import matter from 'gray-matter';

const profileCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    principles: z.array(z.string()),
  }),
});

const projectsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    liveUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    tags: z.array(z.string()),
    curatorNotes: z.object({
      context: z.string(),
      architecture: z.string(),
      tradeOffs: z.string(),
      lessonsLearned: z.string(),
    })
  })
});

const repositoriesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url(),
    language: z.string(),
    tags: z.array(z.string()),
    stars: z.number().default(0),
    forks: z.number().default(0),
  })
});

import type { LoaderContext } from 'astro/loaders';

function githubGardenLoader({ repo, basePath }: { repo: string, basePath: string }) {
  return {
    name: 'github-garden-loader',
    load: async (context: LoaderContext) => {
      const { store, logger, generateDigest, renderMarkdown } = context;
      
      const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
      const pat = env.GH_PAT;
      
      if (!pat) {
        throw new Error("GH_PAT is required for githubGardenLoader but was not found in the environment.");
      }
      
      const headers = {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Astro-Loader'
      };
      
      async function fetchContents(path: string) {
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers });
        if (res.status === 403) {
           throw new Error("GitHub API rate limit exceeded or access forbidden (403).");
        }
        if (!res.ok) {
           throw new Error(`Failed to fetch from GitHub: ${res.statusText}`);
        }
        
        let items = await res.json();
        if (!Array.isArray(items)) {
           items = [items];
        }
        
        for (const item of items) {
          if (item.type === 'dir') {
             await fetchContents(item.path);
          } else if (item.type === 'file' && item.name.toLowerCase().endsWith('.md')) {
             if (!item.download_url) continue;
             
             const fileRes = await fetch(item.download_url, { headers });
             if (!fileRes.ok) {
               logger.warn(`Failed to download file ${item.path}: ${fileRes.status}`);
               continue;
             }
             
             const rawMarkdown = await fileRes.text();
             
             let id = item.path;
             if (id.startsWith(basePath + '/')) {
               id = id.substring(basePath.length + 1);
             }
             id = id.replace(/\.md$/i, '');
             
             let parsed;
             try {
               parsed = matter(rawMarkdown);
             } catch (e) {
               logger.warn(`Failed to parse frontmatter for ${item.path}`);
               continue;
             }
             
             const data = {
               title: parsed.data.title || id.split('/').pop(),
               status: parsed.data.status || 'sprout',
               draft: parsed.data.draft || false,
               ...parsed.data
             };
             
             store.set({
               id,
               data,
               body: parsed.content,
               rendered: renderMarkdown ? await renderMarkdown(parsed.content) : undefined,
               digest: generateDigest ? generateDigest(rawMarkdown) : id
             });
          }
        }
      }
      
      try {
        await fetchContents(basePath);
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(`Error loading GitHub content: ${err.message}`);
          throw err;
        }
        throw new Error(String(err));
      }
    }
  };
}

const gardenCollection = defineCollection({
  loader: githubGardenLoader({ repo: 'FelipeVandevelde/vault-obsidian', basePath: 'notes' }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional().default(false),
    status: z.enum(['sprout', 'growing', 'evergreen']).default('sprout'),
  })
});

export const collections = {
  'profile': profileCollection,
  'projects': projectsCollection,
  'repositories': repositoriesCollection,
  'garden': gardenCollection,
};