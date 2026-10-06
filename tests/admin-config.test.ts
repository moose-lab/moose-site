import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { parse as parseYaml } from 'yaml';
import { buildCmsConfig } from '../src/admin/cms-config';
import { CATEGORY_NAMES } from '../src/lib/categories';
import { LOG_KINDS } from '../src/content/schemas';

const schema = JSON.parse(readFileSync('node_modules/@sveltia/cms/schema/sveltia-cms.json', 'utf8'));
const validate = new Ajv({ strict: false, allErrors: true }).compile(schema);
const site = buildCmsConfig('site');
const drafts = buildCmsConfig('drafts');
type Field = { name: string; widget?: string; [k: string]: unknown };
const coll = (cfg: typeof site, name: string) => cfg.collections.find((c) => c.name === name)!;
const field = (cfg: typeof site, c: string, f: string) => (coll(cfg, c).fields as Field[]).find((x) => x.name === f)!;

describe('Sveltia CMS config', () => {
  it.each([['site', site], ['drafts', drafts]])('%s config passes the Sveltia JSON schema', (_n, cfg) => {
    const ok = validate(cfg);
    expect(validate.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
  });

  it('site edits the public repo; drafts edits the private drafts repo', () => {
    expect(site.backend).toMatchObject({ name: 'github', repo: 'moose-lab/moose-site', branch: 'main', auth_methods: ['token'] });
    expect(drafts.backend).toMatchObject({ name: 'github', repo: 'moose-lab/moose-drafts', branch: 'main', auth_methods: ['token'] });
  });

  it('never uses the editorial workflow (it would create public branches/PRs)', () => {
    for (const cfg of [site, drafts]) {
      expect(cfg.publish_mode).toBe('simple');
      for (const c of cfg.collections) expect((c as { publish_mode?: string }).publish_mode ?? 'simple').toBe('simple');
    }
  });

  it('loads config from our JSON, not a config.yml lookup', () => {
    expect(site.load_config_file).toBe(false);
    expect(drafts.load_config_file).toBe(false);
  });

  it('has the same content collections in both, and site.yaml only in the public admin', () => {
    const names = (cfg: typeof site) => cfg.collections.map((c) => c.name);
    expect(names(site)).toEqual(['posts', 'posts_mdx', 'notes', 'logs', 'xhs', 'settings']);
    expect(names(drafts)).toEqual(['posts', 'posts_mdx', 'notes', 'logs', 'xhs']);
  });

  it('points every folder collection at the directories the Astro loaders read', () => {
    const folders = Object.fromEntries(site.collections.filter((c) => 'folder' in c).map((c) => [c.name, (c as unknown as { folder: string }).folder]));
    expect(folders).toEqual({
      posts: 'src/content/posts', posts_mdx: 'src/content/posts', notes: 'src/content/notes', logs: 'src/content/logs', xhs: 'src/content/xhs',
    });
    expect(coll(site, 'posts')).toMatchObject({ extension: 'md' });
    expect(coll(site, 'posts_mdx')).toMatchObject({ extension: 'mdx' });
  });

  it('category and log-kind options mirror the site constants (no drift from the Zod schemas)', () => {
    for (const c of ['posts', 'posts_mdx', 'notes']) expect(field(site, c, 'category').options).toEqual([...CATEGORY_NAMES]);
    expect(field(site, 'logs', 'kind').options).toEqual([...LOG_KINDS]);
  });

  it('notes are written in Beijing time and capped at 280 characters; descriptions at 120', () => {
    expect(field(site, 'notes', 'date')).toMatchObject({ widget: 'datetime', input_timezone: 'Asia/Shanghai' });
    expect(field(site, 'notes', 'body')).toMatchObject({ maxlength: 280 });
    expect(field(site, 'posts', 'description')).toMatchObject({ maxlength: 120 });
  });

  it('log items must look like "动作 | 结果"', () => {
    const list = field(site, 'logs', 'items') as Field & { field: { pattern: [string, string] } };
    const re = new RegExp(list.field.pattern[0]);
    expect(re.test('1km 跑 ×4 | 4:58')).toBe(true);
    expect(re.test('雪橇推 / 拉 | 152 kg')).toBe(true);
    expect(re.test('没有分隔符')).toBe(false);
    expect(re.test(' | 只有结果')).toBe(false);
  });

  it('post slugs are URL-safe (Chinese titles cannot produce one automatically)', () => {
    const re = new RegExp((field(site, 'posts', 'slug').pattern as [string, string])[0]);
    expect(re.test('hyrox-8-stations')).toBe(true);
    expect(re.test('HYROX 八站')).toBe(false);
  });

  it('images are stored next to the entry so Astro image() can resolve ./images/…', () => {
    for (const c of ['posts', 'posts_mdx', 'xhs']) expect(coll(site, c)).toMatchObject({ media_folder: 'images', public_folder: './images' });
  });

  it('the site.yaml editor covers every top-level key in src/data/site.yaml', () => {
    const keys = Object.keys(parseYaml(readFileSync('src/data/site.yaml', 'utf8')));
    const settings = coll(site, 'settings') as unknown as { files: { file: string; fields: Field[] }[] };
    const file = settings.files.find((f) => f.file === 'src/data/site.yaml')!;
    const names = file.fields.map((f) => f.name);
    for (const k of keys) expect(names).toContain(k);
    expect(names).toContain('about');
  });
});

describe('editor components per format', () => {
  it('.md posts get only built-ins; .mdx posts also get every registered MDX component', async () => {
    const { components } = await import('../src/admin/cms-components.mjs');
    const ids = (components as { id: string }[]).map((c) => c.id);
    const md = field(site, 'posts', 'body').editor_components as string[];
    const mdx = field(site, 'posts_mdx', 'body').editor_components as string[];
    for (const id of ids) {
      expect(md).not.toContain(id);
      expect(mdx).toContain(id);
    }
    expect(md).toEqual(['image', 'code-block']);
  });
});
