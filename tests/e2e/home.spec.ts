import { test, expect } from '@playwright/test';

test('home shows the hero, one pinned card and every content type', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Moose');
  await expect(page.locator('[data-pinned]')).toHaveCount(1);
  for (const type of ['post', 'note', 'log', 'xhs']) {
    await expect(page.locator(`[data-feed-item][data-type="${type}"]`).first()).toBeVisible();
  }
  await expect(page.getByText('做运动 AI 产品的第一个月')).toHaveCount(0); // draft
});
