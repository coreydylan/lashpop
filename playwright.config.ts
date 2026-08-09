import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const usesExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL)
// Chromium text rasterization differs slightly between macOS (where the
// client-approved baselines are reviewed) and Linux (where GitHub runs).
// Keep a separately reviewed Linux baseline instead of weakening the pixel
// threshold for both environments.
const snapshotPlatformSuffix = process.platform === 'linux' ? '-linux' : ''

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.003,
    },
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: `{testDir}/{testFilePath}-snapshots/{arg}-{projectName}${snapshotPlatformSuffix}{ext}`,
  use: {
    baseURL,
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  webServer: usesExternalServer ? undefined : {
    command: 'npm run start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'visual-desktop',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'visual-mobile',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
    {
      name: 'accessibility',
      testMatch: /accessibility\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
})
