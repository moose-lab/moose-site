#!/usr/bin/env node
// Moves one entry from the private drafts repo into the site repo (ADR 0002): copies the file with
// `draft: false` plus every relative image it references, validating everything before writing anything.
// Usage: node scripts/publish-draft.mjs --drafts <drafts repo> --site <site repo> --path src/content/posts/x.mdx
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENTRY = /^src\/content\/(posts|notes|logs|xhs)\/[^/]+\.mdx?$/;
const IMAGE_EXT = '(?:jpe?g|png|webp|gif|avif|svg)';
const REL = '\\.{1,2}\\/';

export function checkDraftPath(path) {
  if (posix.normalize(path) !== path || !ENTRY.test(path)) {
    throw new Error(`只能发布 src/content/{posts,notes,logs,xhs}/ 下的 .md / .mdx 文件：${path}`);
  }
  return path;
}

/** Relative image references: frontmatter values (cover: ./images/x.jpg), Markdown images and MDX imports. */
export function referencedImages(text) {
  const patterns = [
    new RegExp(`^[A-Za-z_]+:\\s*['"]?(${REL}[^'"\\s]+\\.${IMAGE_EXT})['"]?\\s*$`, 'gim'),
    new RegExp(`!\\[[^\\]]*\\]\\((${REL}[^)\\s]+)(?:\\s+"[^"]*")?\\)`, 'g'),
    new RegExp(`^import\\s+\\w+\\s+from\\s+['"](${REL}[^'"]+\\.${IMAGE_EXT})['"]`, 'gim'),
  ];
  const found = new Set();
  for (const re of patterns) for (const m of text.matchAll(re)) found.add(m[1]);
  return [...found];
}

export function markPublished(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return text;
  return text.replace(fm[0], fm[0].replace(/^draft:\s*true\s*$/m, 'draft: false'));
}

export function publishDraft({ draftsRoot, siteRoot, path }) {
  const rel = checkDraftPath(path);
  const source = join(draftsRoot, rel);
  if (!existsSync(source)) throw new Error(`草稿不存在：${rel}`);
  const text = readFileSync(source, 'utf8');
  const folder = `${rel.split('/').slice(0, 3).join('/')}/`;
  const images = referencedImages(text).map((ref) => {
    const p = posix.normalize(posix.join(posix.dirname(rel), ref));
    if (!p.startsWith(folder)) throw new Error(`图片必须放在 ${folder} 里：${ref}`);
    if (!existsSync(join(draftsRoot, p))) throw new Error(`引用的图片不存在：${p}`);
    return p;
  });
  // Everything validated — now write.
  mkdirSync(dirname(join(siteRoot, rel)), { recursive: true });
  writeFileSync(join(siteRoot, rel), markPublished(text));
  for (const p of images) {
    mkdirSync(dirname(join(siteRoot, p)), { recursive: true });
    copyFileSync(join(draftsRoot, p), join(siteRoot, p));
  }
  return [rel, ...images];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; };
  const [draftsRoot, siteRoot, path] = [arg('drafts'), arg('site'), arg('path')];
  if (!draftsRoot || !siteRoot || !path) {
    console.error('用法：node scripts/publish-draft.mjs --drafts <草稿仓库> --site <网站仓库> --path src/content/posts/x.mdx');
    process.exit(2);
  }
  try {
    for (const f of publishDraft({ draftsRoot, siteRoot, path })) console.log(`写入 ${f}`);
  } catch (e) {
    console.error(`发布失败：${e.message}`);
    process.exit(1);
  }
}
