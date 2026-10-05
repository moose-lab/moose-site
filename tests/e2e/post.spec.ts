import { test, expect } from '@playwright/test';

test('post page renders title, cover, margin note, neighbours and JSON-LD', async ({ page }) => {
  await page.goto('/posts/hyrox-8-stations/');
  await expect(page.locator('h1')).toContainText('HYROX 八个功能站拆解');
  await expect(page.locator('.cover img')).toBeVisible();
  await expect(page.locator('.mdx-aside').first()).toBeVisible();
  // Newest post: an older neighbour, no newer one.
  await expect(page.locator('a.pager__card', { hasText: '上一篇' })).toHaveAttribute('href', '/posts/claude-training-log-agent/');
  await expect(page.locator('a.pager__card', { hasText: '下一篇' })).toHaveCount(0);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('BlogPosting');
  expect(ld.headline).toContain('HYROX');
});

test('a middle post links both ways', async ({ page }) => {
  await page.goto('/posts/claude-training-log-agent/');
  await expect(page.locator('a.pager__card', { hasText: '上一篇' })).toHaveAttribute('href', '/posts/sports-anime-training/');
  await expect(page.locator('a.pager__card', { hasText: '下一篇' })).toHaveAttribute('href', '/posts/hyrox-8-stations/');
});

test('h2 uses a hand-drawn underline; the marker is reserved for the title and pull quotes (rule 2)', async ({ page }) => {
  await page.goto('/posts/hyrox-8-stations/');
  const bg = await page.locator('.prose h2').first().evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('url(');
  expect(bg).not.toContain('linear-gradient');
  // Inside the article body only <PullQuote> may carry the marker highlight.
  await expect(page.locator('.prose .hl:not(.pullquote .hl)')).toHaveCount(0);
});
