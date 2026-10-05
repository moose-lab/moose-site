import { test, expect } from '@playwright/test';

for (const path of ['/', '/posts/hyrox-8-stations/', '/feed/2/', '/category/train/']) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    expect(sw).toBeLessThanOrEqual(iw);
  });
}

test('the menu opens with the keyboard', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('summary.nav-mobile__toggle');
  await expect(toggle).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details.nav-mobile a', { hasText: '关于我' })).toBeVisible();
});
