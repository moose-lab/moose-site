import { test, expect } from '@playwright/test';

test('unknown paths get the 404 page', async ({ page }) => {
  const res = await page.goto('/nope/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('这一页被撕掉了');
  await expect(page.getByRole('link', { name: '回到首页' })).toHaveAttribute('href', '/');
});
