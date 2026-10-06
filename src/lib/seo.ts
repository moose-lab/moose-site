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

/** PUBLIC_SITE_ENV=preview marks a pre-launch deployment (e.g. the workers.dev URL before the real domain exists). */
export function isPreviewEnv(value: string | undefined): boolean {
  return value === 'preview';
}

/** Production lets crawlers in (except the writing admin) and points at the sitemap; a preview keeps every crawler out. */
export function robotsTxt(site: URL, preview: boolean): string {
  if (preview) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`;
}
