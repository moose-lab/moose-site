import { test, expect } from '@playwright/test';

// The zh-CN locale is fetched from unpkg; where that is blocked the UI falls back to English, so accept both.
const signIn = /使用访问令牌登录|Sign In Using Access Token/;

for (const [path, title] of [['/admin/', 'Moose 写作后台'], ['/admin/drafts/', 'Moose 草稿箱']]) {
  test(`${path} boots Sveltia with our config and shows token sign-in`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.getByRole('button', { name: signIn })).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveTitle(new RegExp(title));
    // Sveltia adds its own robots meta; every one of them must keep the admin out of search engines.
    const robots = await page.locator('meta[name="robots"]').evaluateAll((ms) => ms.map((m) => m.getAttribute('content') ?? ''));
    expect(robots.length).toBeGreaterThan(0);
    for (const content of robots) expect(content).toContain('noindex');
    expect(errors).toEqual([]);
  });
}

test('public pages load no admin code', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (r) => requested.push(new URL(r.url()).pathname));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(requested.filter((p) => p.startsWith('/admin/'))).toEqual([]);
});
