import { getCollection } from 'astro:content';
import { categoryByName } from './categories';
import { buildFeed, parseLogItem, type FeedItem } from './feed';

const includeDrafts = import.meta.env.DEV;

/** Read all four collections and map them to FeedItem. */
export async function loadFeedItems(): Promise<FeedItem[]> {
  const [posts, notes, logs, xhs] = await Promise.all([
    getCollection('posts'),
    getCollection('notes'),
    getCollection('logs'),
    getCollection('xhs'),
  ]);
  return [
    ...posts.map((p): FeedItem => ({
      type: 'post', id: p.id, date: p.data.date, category: p.data.category,
      href: `/posts/${p.id}/`, external: false, title: p.data.title,
      description: p.data.description, tags: p.data.tags, cover: p.data.cover, coverAlt: p.data.coverAlt,
      pinned: p.data.pinned, draft: p.data.draft,
    })),
    ...notes.map((n): FeedItem => ({
      type: 'note', id: n.id, date: n.data.date, category: n.data.category,
      href: `/notes/${n.id}/`, external: false, body: n.body ?? '', draft: n.data.draft,
    })),
    ...logs.map((l): FeedItem => ({
      type: 'log', id: l.id, date: l.data.date, category: categoryByName('训练').name,
      href: `/logs/${l.id}/`, external: false, title: l.data.title,
      rows: l.data.items.map(parseLogItem), body: l.body ?? '', draft: l.data.draft,
    })),
    ...xhs.map((x): FeedItem => ({
      type: 'xhs', id: x.id, date: x.data.date, category: categoryByName('小红书').name,
      href: x.data.url, external: true, title: x.data.title, cover: x.data.cover, coverAlt: x.data.coverAlt,
      draft: x.data.draft,
    })),
  ];
}

export async function loadFeed() {
  return buildFeed(await loadFeedItems(), { includeDrafts });
}
