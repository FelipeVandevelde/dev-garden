import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import remarkWikilinks from './src/plugins/remark-wikilinks.js';
import remarkCallouts from './src/plugins/remark-callouts.js';

export default defineConfig({
  site: 'https://felipevandevelde.github.io',
  output: 'static',
  integrations: [preact()],
  markdown: {
    remarkPlugins: [remarkWikilinks, remarkCallouts],
    shikiConfig: {
      theme: 'css-variables',
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-br'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});