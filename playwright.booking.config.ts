import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests/browser',
  outputDir: process.env.LASHPOP_LIVE_BOOKING === '1' ? 'test-results/booking-live' : 'test-results/booking-launcher',
  timeout: 60_000,
  workers: 1,
  retries: 0,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run start', url: baseURL, reuseExistingServer: true,
  },
  projects: [
    { name: 'launcher-desktop', testMatch: /booking-launcher\.spec\.ts/, use: { viewport: { width: 1280, height: 900 } } },
    { name: 'launcher-mobile', testMatch: /booking-launcher\.spec\.ts/, use: { viewport: { width: 390, height: 844 } } },
    { name: 'live-desktop', testMatch: /booking-live\.spec\.ts/, use: { viewport: { width: 1280, height: 900 }, trace: 'off' } },
    { name: 'live-mobile', testMatch: /booking-live\.spec\.ts/, use: { viewport: { width: 390, height: 844 }, trace: 'off' } },
  ],
})
