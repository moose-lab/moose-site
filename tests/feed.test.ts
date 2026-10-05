import { describe, it, expect } from 'vitest';
import { buildFeed, groupByMonth, filterByCategory, tiltFor, parseLogItem, NOTE_MAX_CHARS, type FeedItem } from '../src/lib/feed';

const item = (over: Partial<FeedItem> & Pick<FeedItem, 'id' | 'date'>): FeedItem => ({
  type: 'post',
  category: '训练',
  href: `/posts/${over.id}/`,
  external: false,
  ...over,
});

describe('buildFeed', () => {
  const a = item({ id: 'a', date: new Date('2026-09-28') });
  const b = item({ id: 'b', date: new Date('2026-09-21'), type: 'note', body: 'hi' });
  const c = item({ id: 'c', date: new Date('2026-08-24') });

  it('sorts newest first', () => {
    const { items } = buildFeed([c, a, b], { includeDrafts: false });
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('drops drafts unless includeDrafts', () => {
    const d = item({ id: 'd', date: new Date('2026-10-01'), draft: true });
    expect(buildFeed([a, d], { includeDrafts: false }).items.map((i) => i.id)).toEqual(['a']);
    expect(buildFeed([a, d], { includeDrafts: true }).items.map((i) => i.id)).toEqual(['d', 'a']);
  });

  it('lifts only the newest pinned post and removes it from the list', () => {
    const p1 = item({ id: 'p1', date: new Date('2026-07-01'), pinned: true });
    const p2 = item({ id: 'p2', date: new Date('2026-08-01'), pinned: true });
    const { pinned, items } = buildFeed([a, p1, p2], { includeDrafts: false });
    expect(pinned?.id).toBe('p2');
    expect(items.map((i) => i.id)).toEqual(['a', 'p1']);
  });

  it('ignores pinned on non-post types', () => {
    const n = item({ id: 'n', date: new Date('2026-09-01'), type: 'note', body: 'x', pinned: true });
    expect(buildFeed([n], { includeDrafts: false }).pinned).toBeNull();
  });

  it('a draft pinned post is not pinned in production', () => {
    const p = item({ id: 'p', date: new Date('2026-09-01'), pinned: true, draft: true });
    expect(buildFeed([p, a], { includeDrafts: false }).pinned).toBeNull();
  });

  it('throws when a note is too long', () => {
    const long = item({ id: 'long', date: new Date('2026-09-01'), type: 'note', body: '字'.repeat(NOTE_MAX_CHARS + 1) });
    expect(() => buildFeed([long], { includeDrafts: false })).toThrow(/longer than/);
  });

  it('breaks date ties by id for stable output', () => {
    const x = item({ id: 'x', date: new Date('2026-09-01') });
    const y = item({ id: 'y', date: new Date('2026-09-01') });
    expect(buildFeed([y, x], { includeDrafts: false }).items.map((i) => i.id)).toEqual(['x', 'y']);
  });
});

describe('groupByMonth', () => {
  it('groups by month with English label and Chinese sub-label', () => {
    const groups = groupByMonth([
      item({ id: '1', date: new Date('2026-09-28') }),
      item({ id: '2', date: new Date('2026-09-02') }),
      item({ id: '3', date: new Date('2026-08-24') }),
    ]);
    expect(groups.map((g) => [g.key, g.label, g.sub, g.items.length])).toEqual([
      ['2026-09', 'September', '2026 · 九月', 2],
      ['2026-08', 'August', '2026 · 八月', 1],
    ]);
  });
  it('groups by the Shanghai month, not UTC', () => {
    // displayed as 10.01 in Shanghai, but 2026-09-30 in UTC
    const groups = groupByMonth([item({ id: 'early', date: new Date('2026-10-01T06:00:00+08:00') })]);
    expect(groups[0].key).toBe('2026-10');
    expect(groups[0].sub).toBe('2026 · 十月');
  });
  it('returns [] for no items', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('filterByCategory', () => {
  const t = item({ id: 't', date: new Date('2026-09-01'), category: '训练' });
  const ai = item({ id: 'ai', date: new Date('2026-09-01'), category: 'AI' });
  it('filters by slug', () => {
    expect(filterByCategory([t, ai], 'ai').map((i) => i.id)).toEqual(['ai']);
  });
  it('unknown slug gives []', () => {
    expect(filterByCategory([t, ai], 'nope')).toEqual([]);
  });
});

describe('tiltFor', () => {
  it('is deterministic', () => {
    expect(tiltFor('hyrox-8-stations')).toBe(tiltFor('hyrox-8-stations'));
  });
  it('stays within ±max', () => {
    for (const id of ['a', 'b', 'hello', '训练日志', 'x'.repeat(200)]) {
      const t = tiltFor(id, 0.8);
      expect(Math.abs(t)).toBeLessThanOrEqual(0.8);
    }
  });
  it('varies across ids', () => {
    const set = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => tiltFor(id)));
    expect(set.size).toBeGreaterThan(1);
  });
});

describe('parseLogItem', () => {
  it('splits on the first pipe and trims', () => {
    expect(parseLogItem(' 1km 跑 ×4 |  [用时] ')).toEqual({ name: '1km 跑 ×4', result: '[用时]' });
  });
  it('keeps later pipes in the result', () => {
    expect(parseLogItem('墙球 | 100 | 次')).toEqual({ name: '墙球', result: '100 | 次' });
  });
  it('no pipe → empty result', () => {
    expect(parseLogItem('拉伸')).toEqual({ name: '拉伸', result: '' });
  });
});

describe('countByCategory', () => {
  it('counts per category slug and in total', async () => {
    const { countByCategory } = await import('../src/lib/feed');
    const items = [
      item({ id: 'a', date: new Date('2026-09-01'), category: '训练' }),
      item({ id: 'b', date: new Date('2026-09-02'), category: '训练' }),
      item({ id: 'c', date: new Date('2026-09-03'), category: 'AI' }),
    ];
    expect(countByCategory(items)).toEqual({ all: 3, train: 2, ai: 1, product: 0, acg: 0, xhs: 0 });
  });
});

describe('noteTitle', () => {
  it('collapses whitespace and keeps short notes whole', async () => {
    const { noteTitle } = await import('../src/lib/feed');
    expect(noteTitle('  今天的 WOD\n把我练成一摊泥  ')).toBe('今天的 WOD 把我练成一摊泥');
  });
  it('truncates to 30 characters with an ellipsis', async () => {
    const { noteTitle } = await import('../src/lib/feed');
    const t = noteTitle('一'.repeat(40));
    expect(t).toBe('一'.repeat(30) + '…');
  });
});

describe('categoryItems', () => {
  it('merges the pinned post back by date and filters by category', async () => {
    const { categoryItems } = await import('../src/lib/feed');
    const pinned = item({ id: 'p', date: new Date('2026-09-10'), category: '训练', pinned: true });
    const items = [
      item({ id: 'n', date: new Date('2026-09-20'), category: '训练' }),
      item({ id: 'x', date: new Date('2026-09-15'), category: 'AI' }),
      item({ id: 'o', date: new Date('2026-09-01'), category: '训练' }),
    ];
    expect(categoryItems(pinned, items, 'train').map((i) => i.id)).toEqual(['n', 'p', 'o']);
    expect(categoryItems(null, items, 'ai').map((i) => i.id)).toEqual(['x']);
    expect(categoryItems(null, items, 'product')).toEqual([]);
  });
});
