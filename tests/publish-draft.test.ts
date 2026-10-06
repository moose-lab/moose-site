import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
// @ts-ignore plain Node ES module (also run directly by the drafts repo's GitHub Action)
import { referencedImages, markPublished, checkDraftPath, publishDraft } from '../scripts/publish-draft.mjs';

const post = `---
title: 草稿本开张了
cover: ./images/cover.jpg
coverAlt: 封面
draft: true
---
import shot from './images/box.png';

正文 ![训练](./images/wod.jpg "标题") 和 ![远程](https://example.com/x.jpg)
<Figure src={shot} alt="Box" />
再引用一次 ![训练](./images/wod.jpg)
`;

describe('publish-draft helpers', () => {
  it('finds every relative image: cover, Markdown images and MDX imports (deduplicated, no remote URLs)', () => {
    expect(referencedImages(post).sort()).toEqual(['./images/box.png', './images/cover.jpg', './images/wod.jpg']);
  });

  it('flips draft: true to false and leaves everything else untouched', () => {
    const out = markPublished(post);
    expect(out).toContain('draft: false');
    expect(out).not.toContain('draft: true');
    expect(out.replace('draft: false', 'draft: true')).toBe(post);
    expect(markPublished('---\ntitle: x\n---\nbody')).toBe('---\ntitle: x\n---\nbody');
  });

  it('only accepts files inside the four content folders', () => {
    expect(() => checkDraftPath('src/content/posts/hello.mdx')).not.toThrow();
    expect(() => checkDraftPath('src/content/notes/2026-10-06-0930.md')).not.toThrow();
    for (const bad of ['src/content/posts/../../../package.json', '/etc/passwd', 'src/data/site.yaml', 'src/content/posts/images/a.jpg', 'README.md']) {
      expect(() => checkDraftPath(bad), bad).toThrow();
    }
  });
});

describe('publishDraft', () => {
  const setup = () => {
    const drafts = mkdtempSync(join(tmpdir(), 'drafts-'));
    const site = mkdtempSync(join(tmpdir(), 'site-'));
    const put = (root: string, rel: string, body: string) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), body); };
    put(drafts, 'src/content/posts/hello.mdx', post);
    for (const img of ['cover.jpg', 'box.png', 'wod.jpg']) put(drafts, `src/content/posts/images/${img}`, img);
    return { drafts, site, put };
  };

  it('copies the entry with draft:false plus its images to the same paths in the site repo', () => {
    const { drafts, site } = setup();
    const written = publishDraft({ draftsRoot: drafts, siteRoot: site, path: 'src/content/posts/hello.mdx' });
    expect(written.sort()).toEqual([
      'src/content/posts/hello.mdx', 'src/content/posts/images/box.png', 'src/content/posts/images/cover.jpg', 'src/content/posts/images/wod.jpg',
    ]);
    expect(readFileSync(join(site, 'src/content/posts/hello.mdx'), 'utf8')).toContain('draft: false');
    expect(readFileSync(join(site, 'src/content/posts/images/box.png'), 'utf8')).toBe('box.png');
  });

  it('fails (and writes nothing) when a referenced image is missing', () => {
    const { drafts, site, put } = setup();
    put(drafts, 'src/content/posts/broken.md', '---\ntitle: x\ncover: ./images/nope.jpg\n---\n');
    expect(() => publishDraft({ draftsRoot: drafts, siteRoot: site, path: 'src/content/posts/broken.md' })).toThrow(/nope\.jpg/);
    expect(existsSync(join(site, 'src/content/posts/broken.md'))).toBe(false);
  });

  it('fails when the draft does not exist', () => {
    const { drafts, site } = setup();
    expect(() => publishDraft({ draftsRoot: drafts, siteRoot: site, path: 'src/content/posts/ghost.md' })).toThrow(/ghost\.md/);
  });
});
