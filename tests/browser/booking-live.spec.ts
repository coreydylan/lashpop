import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import manifest from '../../workers/vagaro-sync/src/vagaro-widget-manifest.json'
import snapshots from '../fixtures/vagaro-tattoo-mappings.json'
import { classifyBookingRuntime, loaderRequestMatches } from '../../scripts/lib/vagaro-booking-evidence'
import { preparePublicHome } from './helpers'

// Explicit opt-in only. No mocks, sign-in, appointments, or customer-data entry.
for (const mapping of snapshots.mappings) {
  test(`live public booker selects ${mapping.name}`, async ({ page, browser }, testInfo) => {
    test.skip(process.env.LASHPOP_LIVE_BOOKING !== '1', 'Run npm run test:vagaro-live against an explicit deployed URL')
    expect(process.env.PLAYWRIGHT_BASE_URL, 'An explicit deployed website URL is required').toBeTruthy()
    const loaders: string[] = []
    const providerErrors: string[] = []
    page.on('request', request => {
      if (request.url().includes('WidgetEmbeddedLoader')) loaders.push(request.url())
    })
    page.on('requestfailed', request => {
      if (request.url().includes('api.vagaro.com')) {
        providerErrors.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText}`)
      }
    })
    page.on('response', response => {
      if (response.url().includes('api.vagaro.com') && response.status() >= 400) {
        providerErrors.push(`${new URL(response.url()).pathname}: HTTP ${response.status()}`)
      }
    })
    await preparePublicHome(page)
    await page.getByRole('button', { name: /^LASH EXTENSIONS/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Tiny Tattoos', exact: true }).click()
    await dialog.getByRole('button', { name: new RegExp(`^${mapping.name}`) }).click()
    await expect(dialog.getByRole('heading', { name: `Book ${mapping.name}`, exact: true })).toBeVisible()
    await expect.poll(() => loaders.some(url => loaderRequestMatches(mapping.widgetUrl, url))).toBe(true)
    await expect(dialog.locator('iframe')).toBeVisible()
    let selectedServiceVisible = false
    let unrelatedServiceVisible = false
    // Give the provider time to finish its own service-selection handshake.
    await expect.poll(async () => {
      for (const frame of page.frames().filter(frame => new URL(frame.url()).hostname.endsWith('vagaro.com'))) {
        const alerts = await frame.locator('.bootbox').allTextContents()
        providerErrors.push(...alerts.filter(text => text.includes('An Error Has Occurred')))
        selectedServiceVisible = await frame.getByText(mapping.name, { exact: true }).isVisible().catch(() => false)
        unrelatedServiceVisible = await frame.getByText('Classic Full Set', { exact: true }).isVisible().catch(() => false)
      }
      return providerErrors.length > 0 || (selectedServiceVisible && !unrelatedServiceVisible)
    }, { timeout: 20_000 }).toBe(true).catch(() => {})
    const outcome = classifyBookingRuntime({ providerErrors, selectedServiceVisible, unrelatedServiceVisible })
    const evidence = { timestamp: new Date().toISOString(), url: page.url(), websiteDeploymentCommit: 'not established by this test', workerVersion: process.env.LASHPOP_SYNC_WORKER_VERSION ?? 'not recorded; verify separately before configuration changes', localManifestSha256: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'), browser: browser.version(), session: 'fresh anonymous test context', path: `Choose a Service → Lash Extensions → Tiny Tattoos tab → ${mapping.name}`, snapshotSource: snapshots.sourceCommit, viewport: page.viewportSize(), loaders, providerErrors, outcome }
    await mkdir(testInfo.outputDir, { recursive: true })
    const evidencePath = testInfo.outputPath('booking-evidence.json')
    const screenshotPath = testInfo.outputPath('booking-screen.png')
    await writeFile(evidencePath, JSON.stringify(evidence, null, 2))
    await page.screenshot({ path: screenshotPath })
    await testInfo.attach('booking-evidence', {
      path: evidencePath,
      contentType: 'application/json',
    })
    await testInfo.attach('booking-screen', { path: screenshotPath, contentType: 'image/png' })
    expect(outcome, 'Provider blockage or unconfirmed selection is inconclusive evidence; do not regenerate links from this test alone.').toBe('service-selection-confirmed')
  })
}
