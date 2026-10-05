import { describe, it, expect } from 'vitest';
import { rssItems, includeInSitemap } from '../src/lib/seo';
import type { FeedItem } from '../src/lib/feed';

const base = { external: false, category: '训练' as const };
const pinned: FeedItem = { ...base, type: 'post', id: 'p', date: new Date('2026-09-10'), href: '/posts/p/', title: '置顶', description: '摘要', pinned: true };
const items: FeedItem[] = [
  { ...base, type: 'note', id: 'n', date: new Date('2026-09-20'), href: '/notes/n/', body: '今天的 WOD\n把我练成一摊泥' },
  { ...base, type: 'xhs', id: 'x', date: new Date('2026-09-01'), href: 'https://www.xiaohongshu.com/explore/abc', external: true, title: '小红书' },
];

describe('rssItems', () => {
  it('includes the pinned post in date order', () => {
    expect(rssItems(pinned, items).map((i) => i.link)).toEqual(['/notes/n/', '/posts/p/', 'https://www.xiaohongshu.com/explore/abc']);
  });
  it('titles notes with their first 30 characters and keeps the body as description', () => {
    const note = rssItems(null, items)[0];
    expect(note.title).toBe('今天的 WOD 把我练成一摊泥');
    expect(note.description).toBe('今天的 WOD\n把我练成一摊泥');
  });
  it('uses description for posts', () => {
    expect(rssItems(pinned, [])[0]).toMatchObject({ title: '置顶', description: '摘要' });
  });
});

describe('includeInSitemap', () => {
  it('drops dev previews and the 404 page', () => {
    expect(includeInSitemap('https://moose.example/')).toBe(true);
    expect(includeInSitemap('https://moose.example/posts/x/')).toBe(true);
    expect(includeInSitemap('https://moose.example/dev/feed/')).toBe(false);
    expect(includeInSitemap('https://moose.example/404/')).toBe(false);
    expect(includeInSitemap('https://moose.example/404.html')).toBe(false);
    expect(includeInSitemap('https://moose.example/developer-notes/')).toBe(true);
  });
});
