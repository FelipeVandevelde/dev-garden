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
    // Note: Astro's defineCollection may wrap the schema, but we can usually test it
    // Wait, astro:content might not be mockable easily in vitest without setup.
    // Let's try parsing directly if possible.
    const result = collections.profile.schema.safeParse({ name: 'Test', title: 'Developer', bio: '...' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.principles).toEqual([]);
    }
  });

  it('projectsCollection schema should validate missing URLs as empty strings', () => {
    const result = collections.projects.schema.safeParse({
      title: 'Project',
      description: 'Desc',
      tags: [],
      liveUrl: '',
      githubUrl: ''
    });
    expect(result.success).toBe(true);
  });
  
  it('projectsCollection schema should accept valid URLs', () => {
    const result = collections.projects.schema.safeParse({
      title: 'Project',
      description: 'Desc',
      tags: [],
      liveUrl: 'https://example.com'
    });
    expect(result.success).toBe(true);
  });
});
