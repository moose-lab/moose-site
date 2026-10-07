import { defineConfig, devices } from '@playwright/test';

// Never route the local E2E server through a developer's HTTP proxy.
for (const key of ['NO_PROXY', 'no_proxy']) {
  process.env[key] = ['127.0.0.1', 'localhost', process.env[key]].filter(Boolean).join(',');
}

// PW_CHROMIUM_PATH lets constrained environments (no Playwright CDN) point at a system Chromium.
// Locally / in CI just run `pnpm exec playwright install chromium` once.
const executablePath = process.env.PW_CHROMIUM_PATH;
const launchOptions = executablePath ? { executablePath, args: ['--no-sandbox', '--disable-gpu', '--no-zygote'] } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4321', launchOptions, trace: 'retain-on-failure' },
  // Astro auto-backgrounds preview servers when it detects an agent. Playwright
  // must own a foreground process so it can wait for and clean up the server.
  webServer: { command: 'ASTRO_PREVIEW_BACKGROUND=0 NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost pnpm preview --host 127.0.0.1 --port 4321', url: 'http://127.0.0.1:4321', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    // iPhone 13 viewport/touch, but on Chromium so only one browser needs installing.
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' }, testMatch: /mobile\.spec\.ts/ },
  ],
});
