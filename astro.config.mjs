import { defineConfig } from 'astro/config';
import remarkWikilinks from './src/plugins/remark-wikilinks.js';

export default defineConfig({
  output: 'static',
  markdown: {
    remarkPlugins: [remarkWikilinks],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-br'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});