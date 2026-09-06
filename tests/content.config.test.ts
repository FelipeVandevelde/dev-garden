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
});
