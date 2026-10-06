import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4323', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    // Keep Astro in the foreground even when launched by a coding agent.
    command: 'npm run build && npm run preview -- --ignore-lock --port 4323',
    url: 'http://127.0.0.1:4323',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
