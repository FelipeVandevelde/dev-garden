import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../site.config';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const garden = await getCollection('garden', (entry) => entry.data.draft !== true);
  const projects = await getCollection('projects', (entry) => entry.data.draft !== true);
  
  const gardenItems = garden.map((post) => ({
    title: post.id,
    pubDate: post.data.lastUpdatedAt || new Date(),
    description: post.data.status || 'Garden Note',
    link: `/en/garden/${post.id.replace(/\.mdx?$/, '')}/`,
  }));

  const projectItems = projects.map((post) => ({
    title: post.data.title,
    pubDate: post.data.date || new Date(),
    description: post.data.description,
    link: `/en/projects/${post.id.split('/').slice(1).join('/').replace(/\.json$/, '')}/`,
  }));

  return rss({
    title: 'DevGarden RSS Feed',
    description: 'Updates from the digital garden and showcase.',
    site: context.site || siteConfig.siteUrl,
    items: [...projectItems, ...gardenItems],
    customData: `<language>${siteConfig.locale.default}</language>`,
  });
};
