import { z } from 'zod';

export const siteConfigSchema = z.object({
  author: z.object({
    name: z.string().min(1),
    bio: z.string().optional(),
    githubUsername: z.string().optional(),
  }),
  // Terminal-style label shown at the top left of the header
  brand: z.string().min(1).default('~/dev-garden'),
  siteUrl: z.string().url().transform(val => val.replace(/\/+$/, '')),
  social: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
  })),
  nav: z.array(z.object({
    label: z.string().min(1),
    href: z.string().min(1),
    isExternal: z.boolean().default(false),
  })),
  locale: z.object({
    default: z.string().min(1),
    supported: z.array(z.string().min(1)).min(1),
  }),
  githubRepositories: z.array(z.string()).default([]),
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
    name: 'Jane Doe',
    bio: 'A passionate developer.',
    // Set your GitHub username to show your latest public commits on the home page.
    // Left unset, the activity section shows the sample commits in src/data/github-mock.json.
    // githubUsername: 'your-username',
  },
  brand: '~/jane-dev',
  siteUrl: 'https://dev-garden.vercel.app',
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
    supported: ['en', 'pt-br'],
  },
  githubRepositories: [
    'withastro/astro',
    'preactjs/preact'
  ],
  theme: {
    default: 'Dark',
  },
};

export const siteConfig = siteConfigSchema.parse(unvalidatedConfig);
