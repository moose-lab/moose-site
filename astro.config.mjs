// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';
import { includeInSitemap } from './src/lib/seo.ts';
import adminCms from './src/integrations/admin-cms.ts';

// The subscribe form (shown only when PUBLIC_NEWSLETTER_URL is set) posts cross-origin; allow exactly that origin.
const newsletter = process.env.PUBLIC_NEWSLETTER_URL;
const formAction = ["'self'", ...(newsletter ? [new URL(newsletter).origin] : [])].join(' ');

// canonical, Open Graph, RSS and the sitemap are all built from SITE_URL. Missing it still builds, so say so loudly.
if (process.argv.includes('build') && !process.env.SITE_URL && !process.env.MOOSE_CONTENT_ROOT) {
  console.warn('\n⚠️  SITE_URL is not set — canonical/OG/RSS/sitemap URLs will point at http://localhost:4321.\n' +
    '   Set it in Cloudflare → Settings → Build → Variables (e.g. https://moose-site.<subdomain>.workers.dev) and redeploy.\n');
}

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'always',
  // Remaining CSS is small (~5 KB gzipped); inlining it removes render-blocking requests.
  build: { inlineStylesheets: 'always' },
  integrations: [mdx(), sitemap({ filter: includeInSitemap }), adminCms()],
  vite: {
    plugins: [yaml()],
    // Never inline font files as data: URIs — CSP keeps font-src 'self', and separate files cache across pages.
    build: { assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
  },
  markdown: { shikiConfig: { theme: 'github-light' } },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "base-uri 'self'",
        `form-action ${formAction}`,
      ],
      scriptDirective: { resources: ["'self'", 'https://static.cloudflareinsights.com'] },
      // Card tilt (--tilt) and Shiki token colours live in style attributes, so only attributes get unsafe-inline.
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
});
