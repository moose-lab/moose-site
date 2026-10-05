import { describe, it, expect } from 'vitest';
import { NAV } from '../src/lib/nav';

const active = (path: string) => NAV.filter((n) => n.match(path)).map((n) => n.label);

describe('nav active state', () => {
  it('home and content permalinks belong to 博客', () => {
    for (const p of ['/', '/feed/2/', '/posts/x/', '/notes/y/', '/logs/z/']) expect(active(p)).toEqual(['博客']);
  });
  it('category pages activate their own item only', () => {
    expect(active('/category/train/')).toEqual(['训练']);
    expect(active('/category/ai/2/')).toEqual(['AI 实验']);
  });
  it('about activates 关于我', () => {
    expect(active('/about/')).toEqual(['关于我']);
  });
  it('unrelated pages activate nothing', () => {
    expect(active('/category/acg/')).toEqual([]);
  });
});
