import type { FeedItem } from './feed';
import { noteTitle } from './feed';

export interface RssItem { title: string; pubDate: Date; link: string; description: string }

/** Everything in the feed (pinned post included, by date). Site-relative links are completed by @astrojs/rss. */
export function rssItems(pinned: FeedItem | null, items: FeedItem[]): RssItem[] {
  const all = pinned ? [...items, pinned] : [...items];
  all.sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id));
  return all.map((i) => ({
    title: i.title ?? noteTitle(i.body ?? ''),
    pubDate: i.date,
    link: i.href,
    description: i.description ?? i.body ?? '',
  }));
}

/** Sitemap filter: no dev previews, no 404. */
export function includeInSitemap(url: string): boolean {
  const path = new URL(url).pathname;
  return !path.startsWith('/dev/') && !/^\/404(\/|\.html)?$/.test(path);
}
