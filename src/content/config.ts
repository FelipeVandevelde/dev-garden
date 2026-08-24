import { z, defineCollection } from 'astro:content';

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

const gardenCollection = defineCollection({
  type: 'content',
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