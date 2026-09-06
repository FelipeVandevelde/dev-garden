import { z, defineCollection } from 'astro:content';
import { loadEnv } from 'vite';
import matter from 'gray-matter';
import { siteConfig } from '../site.config';

const profileCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    principles: z.array(z.string()).default([]),
  }),
});

const projectsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    liveUrl: z.union([z.string().url(), z.literal('')]).optional(),
    githubUrl: z.union([z.string().url(), z.literal('')]).optional(),
    tags: z.array(z.string()),
    draft: z.boolean().optional().default(false),
    curatorNotes: z.object({
      context: z.string().optional(),
      architecture: z.string().optional(),
      tradeOffs: z.string().optional(),
      lessonsLearned: z.string().optional(),
    }).optional()
  })
});

function githubReposLoader() {
  return {
    name: 'github-repos-loader',
    load: async (context: LoaderContext) => {
      const { store, logger } = context;
      
      const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
      const pat = env.GH_PAT;
      
      if (!pat) {
        logger.warn("GH_PAT is missing. Skipping githubReposLoader.");
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Astro-Loader'
      };

      
      for (const repoSlug of siteConfig.githubRepositories) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repoSlug}`, { headers });
          if (!res.ok) {
            logger.warn(`Failed to fetch repo metadata for ${repoSlug}: ${res.statusText}`);
            continue;
          }
          const data = await res.json();
          
          store.set({
            id: repoSlug,
            data: {
              title: data.name,
              description: data.description || '',
              url: data.html_url,
              language: data.language || 'Unknown',
              tags: data.topics || [],
              stars: data.stargazers_count || 0,
              forks: data.forks_count || 0,
              open_issues: data.open_issues_count || 0
            }
          });
        } catch (err: any) {
          logger.error(`Error loading repo ${repoSlug}: ${err.message}`);
        }
      }
    }
  };
}

const repositoriesCollection = defineCollection({
  loader: githubReposLoader(),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url(),
    language: z.string().nullable().default('Unknown'),
    tags: z.array(z.string()),
    stars: z.number().default(0),
    forks: z.number().default(0),
    open_issues: z.number().default(0)
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
        if (res.status === 404) {
           logger.warn(`GitHub path not found: ${path}. The repository or folder might be empty.`);
           return;
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
          } else if (item.type === 'file' && item.name.toLowerCase().match(/\.mdx?$/)) {
             if (!item.download_url) continue;
             
             const fileRes = await fetch(item.download_url, { headers });
             if (!fileRes.ok) {
               logger.warn(`Failed to download file ${item.path}: ${fileRes.status}`);
               continue;
             }
             
             const rawMarkdown = await fileRes.text();
             
             let id = item.path;
             if (basePath && id.startsWith(basePath + '/')) {
               id = id.substring(basePath.length + 1);
             }
             id = id.replace(/\.mdx?$/i, '');
             
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
  loader: githubGardenLoader({ repo: 'FelipeVandevelde/vault-obsidian', basePath: '' }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional().default(false),
    status: z.enum(['sprout', 'growing', 'evergreen']).default('sprout'),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
  })
});

export const collections = {
  'profile': profileCollection,
  'projects': projectsCollection,
  'repositories': repositoriesCollection,
  'garden': gardenCollection,
};