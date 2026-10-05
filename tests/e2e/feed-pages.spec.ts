import { test, expect } from '@playwright/test';

test('home links to /feed/2/, which links back to home and has cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /翻更早的几页/ })).toHaveAttribute('href', '/feed/2/');
  await page.goto('/feed/2/');
  await expect(page.getByRole('link', { name: /较新/ })).toHaveAttribute('href', '/');
  expect(await page.locator('[data-feed-item]').count()).toBeGreaterThan(0);
});

test('home and /feed/2/ share no cards', async ({ page }) => {
  const hrefs = async () => page.locator('[data-feed-item] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  await page.goto('/');
  const home = new Set(await hrefs());
  await page.goto('/feed/2/');
  for (const h of await hrefs()) expect(home.has(h)).toBe(false);
});
