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

export const collections = {
  'profile': profileCollection,
  'projects': projectsCollection,
};