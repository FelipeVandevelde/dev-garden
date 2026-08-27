import { z } from 'zod';

export const siteConfigSchema = z.object({
  author: z.object({
    name: z.string().min(1),
    bio: z.string().optional(),
    githubUsername: z.string().optional(),
  }),
  siteUrl: z.string().url(),
  social: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
  })),
  nav: z.array(z.object({
    label: z.string().min(1),
    href: z.string().min(1),
  })),
  locale: z.object({
    default: z.string().min(1),
    supported: z.array(z.string().min(1)).min(1),
  }),
  theme: z.object({
    default: z.enum(['Dark', 'Light', 'HC-Dark', 'HC-Light']),
  }),
}).refine(data => data.locale.supported.includes(data.locale.default), {
  message: "Default locale must be included in supported locales",
  path: ["locale", "default"],
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

const unvalidatedConfig = {
  author: {
    name: 'Your Name',
    bio: 'A passionate developer.',
    githubUsername: 'octocat',
  },
  siteUrl: 'https://example.com',
  social: [
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Twitter', url: 'https://twitter.com' }
  ],
  nav: [
    { label: 'About', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Digital Garden', href: '/garden' },
    { label: 'Repos', href: '/repositories' }
  ],
  locale: {
    default: 'en',
    supported: ['en', 'pt-BR'],
  },
  theme: {
    default: 'Dark',
  },
};

export const siteConfig = siteConfigSchema.parse(unvalidatedConfig);
