import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PLAYWRIGHT_PORT || '3004'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`

/**
 * E2E config for inline admin mode.
 *
 * `global-setup` mints an admin storageState by reading a live damAccess session
 * token from the DB (DATABASE_URL) and writing it as the `auth_token` cookie —
 * no UI login needed. The `admin` project uses that state; `public` runs anon.
 *
 * Run: `npm run test:e2e` (reuses a dev server on :3004 or starts one).
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        // Bind the port explicitly (not `npm run dev`, which uses detect-port and
        // can drift to a different port than Playwright waits on).
        command: `npx next dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
