import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: process.env.E2E_URL || 'http://localhost:4200/' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env.CI,
      },
});
