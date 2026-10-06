import type { AstroIntegration } from 'astro';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCmsConfig } from '../admin/cms-config';

/**
 * Generates the writing admin (ADR 0002) into public/admin/ before Astro copies public/:
 * both CMS configs (from src/admin/cms-config.ts), the pinned Sveltia bundle from node_modules,
 * and the editor components. The generated files are git-ignored.
 */
export function writeAdminAssets({ root, publicDir, siteUrl }: { root: string; publicDir: string; siteUrl?: string }): void {
  const admin = join(publicDir, 'admin');
  mkdirSync(join(admin, 'drafts'), { recursive: true });
  const options = siteUrl ? { siteUrl } : {};
  const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
  writeFileSync(join(admin, 'config.json'), json(buildCmsConfig('site', options)));
  writeFileSync(join(admin, 'drafts', 'config.json'), json(buildCmsConfig('drafts', options)));
  copyFileSync(join(root, 'node_modules/@sveltia/cms/dist/sveltia-cms.js'), join(admin, 'sveltia-cms.js'));
  copyFileSync(join(root, 'src/admin/cms-components.mjs'), join(admin, 'cms-components.mjs'));
}

export default function adminCms(): AstroIntegration {
  return {
    name: 'moose-admin-cms',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        writeAdminAssets({ root: fileURLToPath(config.root), publicDir: fileURLToPath(config.publicDir), siteUrl: process.env.SITE_URL });
        logger.info('writing admin generated in public/admin/');
      },
    },
  };
}
