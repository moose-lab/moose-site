import type { ImageMetadata } from 'astro';
import type { CategoryName } from './categories';
import { CATEGORIES, categoryBySlug, categoryByName } from './categories';
import { zonedYMD } from './time';

export type FeedType = 'post' | 'note' | 'log' | 'xhs';

export interface LogRow {
  name: string;
  result: string;
}

export interface FeedItem {
  type: FeedType;
  id: string;
  date: Date;
  category: CategoryName;
  href: string;
  external: boolean;
  title?: string;
  description?: string;
  body?: string;
  rows?: LogRow[];
  tags?: string[];
  cover?: ImageMetadata;
  coverAlt?: string;
  pinned?: boolean;
  draft?: boolean;
}

export interface MonthGroup {
  key: string; // '2026-09'
  label: string; // 'September'
  sub: string; // '2026 · 九月'
  items: FeedItem[];
}

export const NOTE_MAX_CHARS = 280;
/** Items per feed page; the home page shows the first page. */
export const FEED_PAGE_SIZE = 20;

const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ZH_MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

/** Sort newest first, drop drafts (unless asked), lift the newest pinned post out. */
export function buildFeed(
  all: FeedItem[],
  opts: { includeDrafts: boolean },
): { pinned: FeedItem | null; items: FeedItem[] } {
  for (const item of all) {
    if (item.type === 'note' && (item.body ?? '').trim().length > NOTE_MAX_CHARS) {
      throw new Error(`Note "${item.id}" is longer than ${NOTE_MAX_CHARS} characters`);
    }
  }
  const visible = all
    .filter((i) => opts.includeDrafts || !i.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id));
  const pinned = visible.find((i) => i.type === 'post' && i.pinned) ?? null;
  return { pinned, items: pinned ? visible.filter((i) => i !== pinned) : visible };
}

/** Group by calendar month in SITE_TZ (Asia/Shanghai), keeping the input order. */
export function groupByMonth(items: FeedItem[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const item of items) {
    const { y, m: month } = zonedYMD(item.date);
    const m = month - 1;
    const key = `${y}-${String(month).padStart(2, '0')}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, label: EN_MONTHS[m], sub: `${y} · ${ZH_MONTHS[m]}`, items: [] };
      groups.set(key, g);
    }
    g.items.push(item);
  }
  return [...groups.values()];
}

/** Items in one category, by URL slug ('train', 'ai', ...). Unknown slug → []. */
export function filterByCategory(items: FeedItem[], slug: string): FeedItem[] {
  const cat = categoryBySlug(slug);
  return cat ? items.filter((i) => i.category === cat.name) : [];
}

/** Deterministic card tilt in [-max, max] degrees (FNV-1a hash of the id). */
export function tiltFor(id: string, max = 0.8): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const unit = h / 0xffffffff; // 0..1
  return Math.round((unit * 2 - 1) * max * 100) / 100;
}

/** "1km 跑 ×4 | [用时]" → { name: '1km 跑 ×4', result: '[用时]' }. Splits on the first "|". */
export function parseLogItem(raw: string): LogRow {
  const idx = raw.indexOf('|');
  if (idx === -1) return { name: raw.trim(), result: '' };
  return { name: raw.slice(0, idx).trim(), result: raw.slice(idx + 1).trim() };
}

/** Item counts per category slug, plus 'all'. Used for the filter badges. */
export function countByCategory(items: FeedItem[]): Record<string, number> {
  const counts: Record<string, number> = { all: items.length };
  for (const c of CATEGORIES) counts[c.slug] = 0;
  for (const i of items) counts[categoryByName(i.category).slug] += 1;
  return counts;
}

/** Page title for a note permalink: the first 30 characters of its text. */
export function noteTitle(body: string, max = 30): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  return chars.length > max ? chars.slice(0, max).join('') + '…' : flat;
}

/** Items for a category page: the pinned post goes back to its date position (no pinning inside a category). */
export function categoryItems(pinned: FeedItem | null, items: FeedItem[], slug: string): FeedItem[] {
  const all = pinned ? [...items, pinned] : [...items];
  all.sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id));
  return filterByCategory(all, slug);
}
