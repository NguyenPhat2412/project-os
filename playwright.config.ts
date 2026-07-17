import { defineConfig } from '@playwright/test';

const port = process.env.E2E_PORT ?? '3000';
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    // Local Windows uses the installed Chrome when Playwright's browser cache is absent.
    // CI remains pinned to the Chromium revision installed by the workflow.
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_WEB_SERVER_COMMAND ?? 'npm run dev',
        url: `${baseURL}/login`,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
