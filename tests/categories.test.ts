import { describe, it, expect } from 'vitest';
import { CATEGORIES, categoryByName, categoryBySlug } from '../src/lib/categories';

describe('category name ↔ slug mapping', () => {
  it('maps every Chinese name to its URL slug', () => {
    expect(Object.fromEntries(CATEGORIES.map((c) => [c.name, categoryByName(c.name).slug]))).toEqual({
      训练: 'train', AI: 'ai', 产品: 'product', 二次元: 'acg', 小红书: 'xhs',
    });
  });
  it('round-trips slug → name and rejects unknown slugs', () => {
    for (const c of CATEGORIES) expect(categoryBySlug(c.slug)?.name).toBe(c.name);
    expect(categoryBySlug('nope')).toBeUndefined();
  });
  it('slugs are unique and URL-safe', () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
});
