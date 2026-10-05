import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { postSchema, noteSchema, logSchema, xhsSchema } from '../src/content/schemas';

const imageStub = () => z.string();

describe('postSchema', () => {
  const base = { title: 't', description: 'd', date: '2026-09-28', category: '训练' };
  it('accepts a minimal post and applies defaults', () => {
    const r = postSchema(imageStub).parse(base);
    expect(r.draft).toBe(false);
    expect(r.pinned).toBe(false);
    expect(r.tags).toEqual([]);
    expect(r.date).toBeInstanceOf(Date);
  });
  it('rejects unknown category', () => {
    expect(postSchema(imageStub).safeParse({ ...base, category: '美食' }).success).toBe(false);
  });
  it('rejects description over 120 chars', () => {
    expect(postSchema(imageStub).safeParse({ ...base, description: '字'.repeat(121) }).success).toBe(false);
  });
  it('requires coverAlt when cover is set', () => {
    expect(postSchema(imageStub).safeParse({ ...base, cover: './c.jpg' }).success).toBe(false);
    expect(postSchema(imageStub).safeParse({ ...base, cover: './c.jpg', coverAlt: '封面' }).success).toBe(true);
  });
});

describe('noteSchema', () => {
  it('needs a date and category', () => {
    expect(noteSchema.safeParse({ category: 'AI' }).success).toBe(false);
    expect(noteSchema.safeParse({ date: '2026-09-17T21:30:00+08:00', category: 'AI' }).success).toBe(true);
  });
});

describe('logSchema', () => {
  it('needs at least one item and a known kind', () => {
    const base = { title: 'HYROX 模拟日', date: '2026-09-19', kind: 'HYROX', items: ['1km 跑 ×4 | [用时]'] };
    expect(logSchema.safeParse(base).success).toBe(true);
    expect(logSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(logSchema.safeParse({ ...base, kind: '游泳' }).success).toBe(false);
  });
});

describe('xhsSchema', () => {
  it('requires a valid url', () => {
    const base = { title: 't', date: '2026-09-25' };
    expect(xhsSchema(imageStub).safeParse({ ...base, url: 'not a url' }).success).toBe(false);
    expect(xhsSchema(imageStub).safeParse({ ...base, url: 'https://www.xiaohongshu.com/explore/abc' }).success).toBe(true);
  });
});

describe('postSchema titleHighlight', () => {
  it('accepts an optional titleHighlight', () => {
    const r = postSchema(imageStub).parse({ title: 't', description: 'd', date: '2026-09-28', category: '训练', titleHighlight: '配速' });
    expect(r.titleHighlight).toBe('配速');
  });
});
