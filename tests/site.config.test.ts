import { describe, it, expect } from 'vitest';
import { siteConfigSchema } from '../src/site.config';

describe('Site Config Schema', () => {
  it('should validate a correct config', () => {
    const validConfig = {
      author: { name: 'Test' },
      siteUrl: 'https://example.com/',
      social: [],
      nav: [],
      locale: { default: 'en', supported: ['en', 'pt'] },
      githubRepositories: [],
      theme: { default: 'Dark' }
    };
    const result = siteConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.siteUrl).toBe('https://example.com'); // Trailing slash stripped
    }
  });

  it('should reject config if default locale is not in supported list', () => {
    const invalidConfig = {
      author: { name: 'Test' },
      siteUrl: 'https://example.com',
      social: [],
      nav: [],
      locale: { default: 'fr', supported: ['en', 'pt'] },
      githubRepositories: [],
      theme: { default: 'Dark' }
    };
    const result = siteConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});
