import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { z, defineCollection } from 'astro:content';
import { loadEnv } from 'vite';
import matter from 'gray-matter';
import { siteConfig } from '../site.config';
import { clearGardenRegistry, registerGardenNote, setCurrentGardenLang } from '../plugins/remark-wikilinks.js';
import type { LoaderContext } from 'astro/loaders';

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
      const pat = process.env.GH_PAT || env.GH_PAT;
      
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

interface RawVaultEntry {
  id: string;
  lang: string;
  data: Record<string, any>;
  content: string;
  rawMarkdown: string;
}

export const DEFAULT_VAULT_SYNC_INTERVAL_MS = 60_000;
const VAULT_HEAD_SHA_FILE = path.resolve(process.cwd(), '.astro', 'vault-head.sha');

let remotePollTimer: ReturnType<typeof setInterval> | null = null;

export function clearRemotePollTimer() {
  if (remotePollTimer) {
    clearInterval(remotePollTimer);
    remotePollTimer = null;
  }
}

async function persistVaultHeadSha(sha: string) {
  if (!sha) return;
  try {
    await fs.mkdir(path.dirname(VAULT_HEAD_SHA_FILE), { recursive: true });
    await fs.writeFile(VAULT_HEAD_SHA_FILE, `${sha.trim()}\n`, 'utf-8');
  } catch {
    // Ignore write failures in read-only or virtual environments
  }
}

export function githubGardenLoader({ repo, basePath }: { repo: string, basePath: string }) {
  return {
    name: 'github-garden-loader',
    load: async (context: LoaderContext) => {
      const { store, logger, generateDigest, renderMarkdown, parseData, watcher } = context;
      
      const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
      const pat = process.env.GH_PAT || env.GH_PAT;
      const rawLocalVaultPath = process.env.LOCAL_VAULT_PATH || env.LOCAL_VAULT_PATH;
      const configuredLocalVault = rawLocalVaultPath
        ? path.resolve(process.cwd(), rawLocalVaultPath)
        : path.resolve(process.cwd(), '../vault-obsidian');
      const useRemoteVault = (process.env.USE_REMOTE_VAULT || env.USE_REMOTE_VAULT) === 'true';
      const useLocalVault = !useRemoteVault && existsSync(configuredLocalVault);

      const rawSyncInterval = Number(process.env.VAULT_SYNC_INTERVAL_MS || env.VAULT_SYNC_INTERVAL_MS);
      const pollIntervalMs = Number.isFinite(rawSyncInterval) && rawSyncInterval > 0
        ? rawSyncInterval
        : DEFAULT_VAULT_SYNC_INTERVAL_MS;

      function parseVaultEntry(relPath: string, rootSegment: string, rawMarkdown: string): RawVaultEntry | null {
        const normalizedRelPath = relPath.replace(/\\/g, '/');
        const id = normalizedRelPath.replace(/\.mdx?$/i, '');

        let parsed;
        try {
          parsed = matter(rawMarkdown);
        } catch (e) {
          logger.warn(`Failed to parse frontmatter for ${normalizedRelPath}`);
          return null;
        }

        const fallbackTitle = id.split('/').pop() || id;
        const rawStatus = parsed.data?.status;
        const validStatus = ['sprout', 'growing', 'evergreen'].includes(rawStatus) ? rawStatus : 'sprout';

        const data = {
          ...parsed.data,
          title: parsed.data?.title ? String(parsed.data.title) : fallbackTitle,
          status: validStatus,
          draft: Boolean(parsed.data?.draft),
        };

        return {
          id,
          lang: rootSegment,
          data,
          content: parsed.content,
          rawMarkdown
        };
      }

      async function applyEntriesToStore(rawEntries: RawVaultEntry[]) {
        try {
          const untouchedEntries = new Set<string>(store.keys());
          clearGardenRegistry();

          for (const entry of rawEntries) {
            registerGardenNote({
              id: entry.id,
              title: entry.data.title,
              status: entry.data.status,
              draft: entry.data.draft,
              content: entry.content
            });
          }

          const registrySignature = rawEntries
            .map(e => `${e.id}:${e.data.title}:${e.data.status}:${e.data.draft}`)
            .sort()
            .join('|');

          for (const entry of rawEntries) {
            untouchedEntries.delete(entry.id);
            setCurrentGardenLang(entry.lang);
            const rendered = renderMarkdown ? await renderMarkdown(entry.content) : undefined;
            const validatedData = parseData
              ? await parseData({ id: entry.id, data: entry.data })
              : entry.data;
            const digestInput = `${entry.rawMarkdown}::${registrySignature}`;
            store.set({
              id: entry.id,
              data: validatedData,
              body: entry.content,
              rendered,
              digest: generateDigest ? generateDigest(digestInput) : digestInput
            });
          }

          for (const oldId of untouchedEntries) {
            store.delete(oldId);
          }
        } finally {
          setCurrentGardenLang(null);
        }
      }

      async function collectLocalVaultEntries(vaultRoot: string): Promise<RawVaultEntry[]> {
        const entries: RawVaultEntry[] = [];
        const baseDir = basePath ? path.join(vaultRoot, basePath) : vaultRoot;

        async function walkDir(currentDir: string) {
          let dirItems;
          try {
            dirItems = await fs.readdir(currentDir, { withFileTypes: true });
          } catch {
            return;
          }

          for (const item of dirItems) {
            if (item.name === '.git' || item.name === '.obsidian' || item.name === 'node_modules') {
              continue;
            }
            const fullPath = path.join(currentDir, item.name);
            const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            const parts = relPath.split('/');
            const rootSegment = parts[0];

            if (item.isDirectory()) {
              if (!siteConfig.locale.supported.includes(rootSegment)) {
                continue;
              }
              await walkDir(fullPath);
            } else if (item.isFile() && /\.mdx?$/i.test(item.name)) {
              if (!siteConfig.locale.supported.includes(rootSegment) || parts.length < 2) {
                continue;
              }
              const rawMarkdown = await fs.readFile(fullPath, 'utf-8');
              const parsedEntry = parseVaultEntry(relPath, rootSegment, rawMarkdown);
              if (parsedEntry) {
                entries.push(parsedEntry);
              }
            }
          }
        }

        await walkDir(baseDir);
        return entries;
      }

      async function collectRemoteGitHubEntries(): Promise<RawVaultEntry[]> {
        if (!pat) {
          throw new Error("GH_PAT is required for githubGardenLoader but was not found in the environment.");
        }

        const headers = {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Astro-Loader'
        };

        const rawHeaders = {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.raw+json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Astro-Loader'
        };

        const rawEntries: RawVaultEntry[] = [];

        async function fetchContents(currentPath: string) {
          const encodedPath = currentPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
          const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodedPath}`, { headers });
          if (res.status === 403) {
            throw new Error("GitHub API rate limit exceeded or access forbidden (403).");
          }
          if (res.status === 404) {
            logger.warn(`GitHub path not found: ${currentPath}. The repository or folder might be empty.`);
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
            let relPath = item.path;
            if (basePath && relPath.startsWith(basePath + '/')) {
              relPath = relPath.substring(basePath.length + 1);
            }
            const parts = relPath.split('/');
            const rootSegment = parts[0];

            if (item.type === 'dir') {
              if (!siteConfig.locale.supported.includes(rootSegment)) {
                continue;
              }
              await fetchContents(item.path);
            } else if (item.type === 'file' && item.name.toLowerCase().match(/\.mdx?$/)) {
              if (!siteConfig.locale.supported.includes(rootSegment) || parts.length < 2) {
                continue;
              }
              const rawApiUrl = item.url || `https://api.github.com/repos/${repo}/contents/${item.path.split('/').map(encodeURIComponent).join('/')}`;
              const fileRes = await fetch(rawApiUrl, { headers: rawHeaders });
              if (!fileRes.ok) {
                logger.warn(`Failed to download file ${item.path}: ${fileRes.status}`);
                continue;
              }

              const rawMarkdown = await fileRes.text();
              const parsedEntry = parseVaultEntry(relPath, rootSegment, rawMarkdown);
              if (parsedEntry) {
                rawEntries.push(parsedEntry);
              }
            }
          }
        }

        await fetchContents(basePath);
        return rawEntries;
      }

      try {
        if (useLocalVault) {
          const localEntries = await collectLocalVaultEntries(configuredLocalVault);
          await applyEntriesToStore(localEntries);
          logger.info(`Synced ${localEntries.length} garden notes from local vault (${configuredLocalVault})`);

          if (watcher) {
            watcher.add(configuredLocalVault);
            let syncTimeout: ReturnType<typeof setTimeout> | null = null;
            const normalizedVaultRoot = configuredLocalVault.replace(/\\/g, '/').toLowerCase();

            const handleVaultFsEvent = (changedPath: string) => {
              const normalizedChanged = changedPath.replace(/\\/g, '/');
              if (!normalizedChanged.toLowerCase().startsWith(normalizedVaultRoot)) {
                return;
              }
              if (normalizedChanged.includes('/.obsidian/') || normalizedChanged.includes('/.git/')) {
                return;
              }
              if (!/\.mdx?$/i.test(normalizedChanged)) {
                return;
              }
              if (syncTimeout) clearTimeout(syncTimeout);
              syncTimeout = setTimeout(async () => {
                try {
                  const updatedEntries = await collectLocalVaultEntries(configuredLocalVault);
                  await applyEntriesToStore(updatedEntries);
                  logger.info(`Reloaded garden notes after vault change: ${path.relative(configuredLocalVault, changedPath)}`);
                } catch (err: any) {
                  logger.error(`Failed to reload local vault notes: ${err.message}`);
                }
              }, 150);
            };

            watcher.on('change', handleVaultFsEvent);
            watcher.on('add', handleVaultFsEvent);
            watcher.on('unlink', handleVaultFsEvent);
          }
        } else {
          const remoteEntries = await collectRemoteGitHubEntries();
          await applyEntriesToStore(remoteEntries);

          let lastCommitSha: string | null = null;
          let lastEtag: string | null = null;

          async function fetchVaultHeadCommit(etag: string | null) {
            const shaHeaders: Record<string, string> = {
              'Authorization': `Bearer ${pat}`,
              'Accept': 'application/vnd.github.sha',
              'Cache-Control': 'no-cache',
              'User-Agent': 'Astro-Loader'
            };
            if (etag) {
              shaHeaders['If-None-Match'] = etag;
            }
            const shaRes = await fetch(`https://api.github.com/repos/${repo}/commits/HEAD`, { headers: shaHeaders });
            if (shaRes.status === 304) {
              return { sha: null, etag: shaRes.headers?.get?.('etag') || etag, notModified: true };
            }
            if (!shaRes.ok) {
              return { sha: null, etag, notModified: false };
            }
            const sha = (await shaRes.text()).trim();
            const nextEtag = shaRes.headers?.get?.('etag') || etag;
            return { sha: sha || null, etag: nextEtag, notModified: false };
          }

          if (pat) {
            try {
              const initialHead = await fetchVaultHeadCommit(null);
              if (initialHead.sha) {
                lastCommitSha = initialHead.sha;
                await persistVaultHeadSha(lastCommitSha);
              }
              if (initialHead.etag) {
                lastEtag = initialHead.etag;
              }
            } catch {
              // Ignore initial SHA fetch failure
            }
          }

          if (watcher && pat) {
            clearRemotePollTimer();
            let isPolling = false;

            remotePollTimer = setInterval(async () => {
              if (isPolling) return;
              isPolling = true;
              try {
                const head = await fetchVaultHeadCommit(lastEtag);
                lastEtag = head.etag;
                if (head.notModified) return;

                if (lastCommitSha && head.sha && head.sha !== lastCommitSha) {
                  lastCommitSha = head.sha;
                  await persistVaultHeadSha(lastCommitSha);
                  const updatedEntries = await collectRemoteGitHubEntries();
                  await applyEntriesToStore(updatedEntries);
                  logger.info(`Reloaded garden notes from remote commit ${head.sha.slice(0, 7)}`);
                } else if (!lastCommitSha && head.sha) {
                  lastCommitSha = head.sha;
                  await persistVaultHeadSha(lastCommitSha);
                }
              } catch {
                // Ignore transient network errors during polling
              } finally {
                isPolling = false;
              }
            }, pollIntervalMs);

            remotePollTimer.unref?.();
          }
        }
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
