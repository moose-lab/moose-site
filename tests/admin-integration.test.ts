import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeAdminAssets } from '../src/integrations/admin-cms';
import { buildCmsConfig } from '../src/admin/cms-config';

describe('writeAdminAssets', () => {
  const publicDir = mkdtempSync(join(tmpdir(), 'admin-'));
  writeAdminAssets({ root: process.cwd(), publicDir, siteUrl: 'https://moose.example/' });
  const read = (p: string) => readFileSync(join(publicDir, p), 'utf8');

  it('writes both configs as JSON equal to the generator output', () => {
    expect(JSON.parse(read('admin/config.json'))).toEqual(buildCmsConfig('site', { siteUrl: 'https://moose.example/' }));
    expect(JSON.parse(read('admin/drafts/config.json'))).toEqual(buildCmsConfig('drafts', { siteUrl: 'https://moose.example/' }));
  });

  it('self-hosts the pinned Sveltia bundle and the editor components', () => {
    const bundle = join(publicDir, 'admin/sveltia-cms.js');
    expect(statSync(bundle).size).toBe(statSync('node_modules/@sveltia/cms/dist/sveltia-cms.js').size);
    expect(read('admin/cms-components.mjs')).toBe(readFileSync('src/admin/cms-components.mjs', 'utf8'));
  });

  it('omits site_url when SITE_URL is unknown', () => {
    const dir = mkdtempSync(join(tmpdir(), 'admin-'));
    writeAdminAssets({ root: process.cwd(), publicDir: dir });
    expect(JSON.parse(readFileSync(join(dir, 'admin/config.json'), 'utf8')).site_url).toBeUndefined();
    expect(existsSync(join(dir, 'admin/drafts/config.json'))).toBe(true);
  });
});
