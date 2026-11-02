import { defineConfig, devices } from '@playwright/test';

// PW_PORT lets two checkouts run the browser tests at the same time.
const port = process.env.PW_PORT ?? '4323';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: 0,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    // Keep Astro in the foreground even when launched by a coding agent.
    command: 'npm run build && npm run preview -- --ignore-lock --port ' + port,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
