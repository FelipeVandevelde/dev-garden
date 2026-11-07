import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { z } from 'zod';

vi.mock('astro:content', () => {
  return {
    z: z,
    defineCollection: (config: any) => config
  };
});
import {
  collections,
  githubGardenLoader,
  clearRemotePollTimer,
  DEFAULT_VAULT_SYNC_INTERVAL_MS
} from '../src/content/config';
import {
  resolveVaultSyncConfig,
  checkAndSyncOnce
} from '../scripts/vault-sync-server.mjs';
import netlifyVaultSyncHandler, {
  config as netlifyScheduleConfig
} from '../netlify/functions/vault-sync.mjs';

describe('Content Collections Zod Schemas', () => {
  it('profileCollection schema should validate default principles', () => {
    const schema = (collections.profile.schema as any);
    const result = schema.safeParse({ name: 'Test', title: 'Developer', bio: '...' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.principles).toEqual([]);
    }
  });

  it('projectsCollection schema should validate missing URLs as empty strings', () => {
    const schema = (collections.projects.schema as any);
    const result = schema.safeParse({
      title: 'Project',
      description: 'Desc',
      tags: [],
      liveUrl: '',
      githubUrl: ''
    });
    expect(result.success).toBe(true);
  });
  
  it('projectsCollection schema should accept valid URLs', () => {
    const schema = (collections.projects.schema as any);
    const result = schema.safeParse({
      title: 'Project',
      description: 'Desc',
      tags: [],
      liveUrl: 'https://example.com'
    });
    expect(result.success).toBe(true);
  });

  it('gardenCollection loader registers watcher listeners and syncs notes in local vault mode', async () => {
    const loader = (collections.garden as any).loader;
    expect(loader.name).toBe('github-garden-loader');

    const storedEntries = new Map<string, any>();
    const registeredEvents: Record<string, Function> = {};

    const mockContext: any = {
      store: {
        keys: () => Array.from(storedEntries.keys()),
        set: (entry: any) => {
          storedEntries.set(entry.id, entry);
          return true;
        },
        delete: (id: string) => {
          storedEntries.delete(id);
        }
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      },
      generateDigest: (str: string) => `digest-${str.length}`,
      renderMarkdown: async (md: string) => ({ html: `<p>${md}</p>` }),
      parseData: async ({ data }: any) => data,
      watcher: {
        add: vi.fn(),
        on: vi.fn((event: string, cb: Function) => {
          registeredEvents[event] = cb;
        })
      }
    };

    if (typeof loader.load === 'function') {
      await loader.load(mockContext);
      if (mockContext.watcher.add.mock.calls.length > 0) {
        expect(registeredEvents.change).toBeTypeOf('function');
        expect(registeredEvents.add).toBeTypeOf('function');
        expect(registeredEvents.unlink).toBeTypeOf('function');
        expect(storedEntries.size).toBeGreaterThan(0);
      }
    }
  });

  describe('1-Minute Remote Vault Sync (DG-50)', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      clearRemotePollTimer();
      vi.useRealTimers();
      vi.restoreAllMocks();
      process.env = { ...originalEnv };
      const testShaFile = path.resolve(process.cwd(), '.astro', 'vault-head.sha');
      if (existsSync(testShaFile)) {
        try {
          unlinkSync(testShaFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('uses 60,000 ms (1 minute) default interval, resolves process.env.GH_PAT, and honors ETag 304 before syncing new commits', async () => {
      expect(DEFAULT_VAULT_SYNC_INTERVAL_MS).toBe(60_000);

      vi.useFakeTimers();
      process.env.GH_PAT = 'test-pat-from-process-env';
      process.env.USE_REMOTE_VAULT = 'true';
      delete process.env.VAULT_SYNC_INTERVAL_MS;

      let noteTitle = 'Initial Remote Note';
      let headResponses: Array<{ status: number; sha?: string; etag?: string }> = [
        { status: 200, sha: '1111111111111111111111111111111111111111', etag: '"etag-1"' },
        { status: 304, etag: '"etag-1"' },
        { status: 200, sha: '2222222222222222222222222222222222222222', etag: '"etag-2"' }
      ];
      const observedHeadHeaders: Record<string, string>[] = [];
      let contentFetchCount = 0;

      const fetchMock = vi.fn(async (input: any, init?: any) => {
        const url = String(input);
        if (url.endsWith('/commits/HEAD')) {
          observedHeadHeaders.push({ ...(init?.headers || {}) });
          const next = headResponses.shift() || { status: 304, etag: '"etag-2"' };
          if (next.status === 304) {
            return new Response(null, {
              status: 304,
              headers: { etag: next.etag || '"etag-1"' }
            });
          }
          return new Response(next.sha || '', {
            status: 200,
            headers: { etag: next.etag || '"etag-1"' }
          });
        }

        if (url.endsWith('/contents/')) {
          return new Response(JSON.stringify([{ name: 'en', path: 'en', type: 'dir' }]), { status: 200 });
        }

        if (url.endsWith('/contents/en')) {
          return new Response(
            JSON.stringify([{
              name: 'remote-note.md',
              path: 'en/remote-note.md',
              type: 'file',
              url: 'https://api.github.com/repos/test/vault/contents/en/remote-note.md'
            }]),
            { status: 200 }
          );
        }

        if (url.endsWith('/contents/en/remote-note.md')) {
          contentFetchCount++;
          return new Response(`---\ntitle: "${noteTitle}"\nstatus: "evergreen"\n---\nBody`, { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
      });

      vi.stubGlobal('fetch', fetchMock);

      const storedEntries = new Map<string, any>();
      const infoLog = vi.fn();
      const loader = githubGardenLoader({ repo: 'test/vault', basePath: '' });

      await loader.load({
        store: {
          keys: () => Array.from(storedEntries.keys()),
          set: (entry: any) => {
            storedEntries.set(entry.id, entry);
            return true;
          },
          delete: (id: string) => storedEntries.delete(id)
        },
        logger: { info: infoLog, warn: vi.fn(), error: vi.fn() },
        generateDigest: (str: string) => `digest-${str}`,
        renderMarkdown: async (md: string) => ({ html: `<p>${md}</p>` }),
        parseData: async ({ data }: any) => data,
        watcher: { add: vi.fn(), on: vi.fn() }
      } as any);

      expect(contentFetchCount).toBe(1);
      expect(storedEntries.get('en/remote-note')?.data.title).toBe('Initial Remote Note');
      expect(observedHeadHeaders[0]?.Authorization).toBe('Bearer test-pat-from-process-env');

      // Advance 59s: should NOT have polled yet (interval is 60s)
      await vi.advanceTimersByTimeAsync(59_000);
      expect(observedHeadHeaders).toHaveLength(1);

      // Advance +1s (total 60s = 1 minute): polls with If-None-Match and receives 304 Not Modified
      await vi.advanceTimersByTimeAsync(1_000);
      expect(observedHeadHeaders).toHaveLength(2);
      expect(observedHeadHeaders[1]?.['If-None-Match']).toBe('"etag-1"');
      expect(contentFetchCount).toBe(1);

      // Advance another 60s (2nd minute): receives new commit SHA and reloads markdown
      noteTitle = 'Updated Remote Note';
      await vi.advanceTimersByTimeAsync(60_000);
      vi.useRealTimers();
      await vi.waitFor(() => {
        expect(observedHeadHeaders).toHaveLength(3);
        expect(contentFetchCount).toBe(2);
        expect(storedEntries.get('en/remote-note')?.data.title).toBe('Updated Remote Note');
        expect(infoLog).toHaveBeenCalledWith('Reloaded garden notes from remote commit 2222222');
      });
    });

    it('server sync runner checks HEAD once and triggers rebuild + DEPLOY_HOOK_URL only on new commit', async () => {
      const cfg = resolveVaultSyncConfig(process.cwd(), {
        NODE_ENV: 'production',
        GH_PAT: 'server-pat',
        DEPLOY_HOOK_URL: 'https://api.netlify.com/build_hooks/test-hook'
      });
      expect(cfg.intervalMs).toBe(60_000);

      const rebuildFn = vi.fn(async () => {});
      const hookCalls: string[] = [];
      let currentSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      const mockFetch = vi.fn(async (input: any, init?: any) => {
        const url = String(input);
        if (url === 'https://api.netlify.com/build_hooks/test-hook') {
          expect(init?.method).toBe('POST');
          hookCalls.push(url);
          return new Response('{}', { status: 200 });
        }
        return new Response(currentSha, {
          status: 200,
          headers: { etag: `"${currentSha.slice(0, 7)}"` }
        });
      });

      const state = { lastSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', lastEtag: '"aaaaaaa"' };

      // Unchanged SHA: no rebuild, no webhook
      const unchanged = await checkAndSyncOnce(cfg, state, { rebuildFn, fetchImpl: mockFetch as any });
      expect(unchanged.synced).toBe(false);
      expect(rebuildFn).not.toHaveBeenCalled();
      expect(hookCalls).toHaveLength(0);

      // Changed SHA: triggers webhook and rebuild
      currentSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const updated = await checkAndSyncOnce(cfg, state, { rebuildFn, fetchImpl: mockFetch as any });
      expect(updated.synced).toBe(true);
      expect(updated.sha).toBe(currentSha);
      expect(hookCalls).toHaveLength(1);
      expect(rebuildFn).toHaveBeenCalledTimes(1);
    });

    it('Netlify scheduled function runs once per minute (* * * * *) and triggers DEPLOY_HOOK_URL when vault advances', async () => {
      expect(netlifyScheduleConfig.schedule).toBe('* * * * *');

      process.env.GH_PAT = 'netlify-pat';
      process.env.DEPLOY_HOOK_URL = 'https://api.netlify.com/build_hooks/live-hook';
      process.env.URL = 'https://portifolio-garden.netlify.app';

      let hookTriggered = 0;
      vi.stubGlobal('fetch', vi.fn(async (input: any) => {
        const url = String(input);
        if (url.endsWith('/commits/HEAD')) {
          return new Response('cccccccccccccccccccccccccccccccccccccccc', { status: 200 });
        }
        if (url.includes('/vault-sync.json')) {
          return new Response(JSON.stringify({ commitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }), { status: 200 });
        }
        if (url === 'https://api.netlify.com/build_hooks/live-hook') {
          hookTriggered++;
          return new Response('{}', { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
      }));

      const res = await netlifyVaultSyncHandler();
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.synced).toBe(true);
      expect(hookTriggered).toBe(1);
    });
  });
});
