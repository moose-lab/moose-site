import { defineConfig, devices } from '@playwright/test';

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
  use: { baseURL: 'http://localhost:4321', launchOptions, trace: 'retain-on-failure' },
  webServer: { command: 'pnpm preview --port 4321', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    // iPhone 13 viewport/touch, but on Chromium so only one browser needs installing.
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' }, testMatch: /mobile\.spec\.ts/ },
  ],
});
