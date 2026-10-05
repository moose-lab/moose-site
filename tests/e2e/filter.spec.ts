import { test, expect } from '@playwright/test';

const filter = (page: import('@playwright/test').Page, cat: string) => page.locator(`[data-feed-filter] [data-cat="${cat}"]`);

test('filtering by AI leaves only AI cards and marks the button pressed', async ({ page }) => {
  await page.goto('/');
  await filter(page, 'ai').click();
  await expect(filter(page, 'ai')).toHaveAttribute('aria-pressed', 'true');
  await expect(filter(page, 'all')).toHaveAttribute('aria-pressed', 'false');
  const visible = page.locator('[data-feed-item]:visible');
  await expect(visible.first()).toBeVisible();
  for (const cat of await visible.evaluateAll((els) => els.map((e) => e.getAttribute('data-cat')))) expect(cat).toBe('ai');
  await expect(page).toHaveURL('/'); // no navigation with JS on
});

test('filtering by 产品 shows the empty state', async ({ page }) => {
  await page.goto('/');
  await filter(page, 'product').click();
  await expect(page.locator('[data-feed-item]:visible')).toHaveCount(0);
  await expect(page.locator('[data-feed-empty]')).toBeVisible();
});

test('the empty category page shows the empty state', async ({ page }) => {
  await page.goto('/category/product/');
  await expect(page.locator('[data-feed-empty]')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all cards are visible and categories are plain links', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('[data-feed-item]');
    expect(await cards.count()).toBeGreaterThan(10);
    expect(await page.locator('[data-feed-item]:visible').count()).toBe(await cards.count());
    await filter(page, 'ai').click();
    await expect(page).toHaveURL('/category/ai/');
  });
});
