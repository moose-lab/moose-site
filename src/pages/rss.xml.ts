import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { loadFeed } from '../lib/load-feed';
import { rssItems } from '../lib/seo';
import { site } from '../lib/site';

export async function GET(context: APIContext) {
  const { pinned, items } = await loadFeed();
  return rss({
    title: `${site.name} 的草稿本`,
    description: '训练、AI、做产品、追番',
    site: context.site!,
    items: rssItems(pinned, items),
    customData: '<language>zh-CN</language>',
  });
}
