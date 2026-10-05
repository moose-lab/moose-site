import { test, expect } from '@playwright/test';

for (const path of ['/', '/posts/hyrox-8-stations/', '/feed/2/']) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (m) => messages.push(m.text()));
    page.on('pageerror', (e) => messages.push(e.message));
    await page.goto(path, { waitUntil: 'networkidle' });
    expect(messages.filter((m) => m.includes('Content Security Policy'))).toEqual([]);
  });
}
