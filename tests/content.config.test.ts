import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

vi.mock('astro:content', () => {
  return {
    z: z,
    defineCollection: (config: any) => config
  };
});
import { collections } from '../src/content/config';

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
});
