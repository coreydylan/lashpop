import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const POSTHOG_HOST_RE = /^https:\/\/(?:us|eu)\.i\.posthog\.com\//
const CONSENT_KEY = 'lashpop_session_replay_consent_v1'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((consentKey) => {
    if (!window.sessionStorage.getItem('lashpop_replay_test_initialized')) {
      window.localStorage.removeItem(consentKey)
      window.localStorage.setItem('lashpop_lash_quiz_dismissed', 'true')
      window.localStorage.setItem('lashpop_team_swipe_tutorial_completed', 'true')
      window.sessionStorage.setItem('lashpop_replay_test_initialized', 'true')
    }
  }, CONSENT_KEY)
})

test('session replay waits for permission and preserves a refusal', async ({ page }) => {
  let posthogRequests = 0
  page.on('request', (request) => {
    if (POSTHOG_HOST_RE.test(request.url())) posthogRequests += 1
  })
  await page.route('https://*.i.posthog.com/**', (route) => route.abort())

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const choices = page.getByRole('region', { name: 'Experience analytics choices' })
  await expect(choices).toBeVisible()
  await expect(choices).toContainText('We don\'t record what you type')
  await page.waitForTimeout(750)
  expect(posthogRequests).toBe(0)

  const results = await new AxeBuilder({ page })
    .include('[aria-label="Experience analytics choices"]')
    .disableRules(['color-contrast'])
    .analyze()
  expect(results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical'
  )).toEqual([])

  await choices.getByRole('button', { name: 'No thanks' }).click()
  await expect(choices).toBeHidden()
  expect(JSON.parse(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY) ?? '{}')).toMatchObject({
    status: 'denied',
  })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(choices).toBeHidden()
  expect(posthogRequests).toBe(0)

  const footer = page.locator('footer[data-section-id="footer"]')
  await footer.scrollIntoViewIfNeeded()
  await footer.getByRole('button', { name: 'Privacy Choices' }).click()
  await expect(choices).toBeVisible()
})

test('explicit permission starts replay only on allowlisted public routes', async ({ page }) => {
  let posthogRequests = 0
  page.on('request', (request) => {
    if (POSTHOG_HOST_RE.test(request.url())) posthogRequests += 1
  })
  await page.route('https://*.i.posthog.com/**', (route) => route.abort())

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const choices = page.getByRole('region', { name: 'Experience analytics choices' })
  await choices.getByRole('button', { name: 'Allow experience analytics' }).click()

  await expect(choices).toBeHidden()
  expect(JSON.parse(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY) ?? '{}')).toMatchObject({
    status: 'granted',
  })
  await expect.poll(() => posthogRequests, { timeout: 10_000 }).toBeGreaterThan(0)

  const requestCountBeforeExcludedRoute = posthogRequests
  await page.getByRole('link', { name: 'Work With Us' }).first().click()
  await page.waitForURL('**/work-with-us')
  await page.waitForTimeout(1_000)
  expect(posthogRequests).toBe(requestCountBeforeExcludedRoute)
})

test('Global Privacy Control keeps replay disabled', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      value: true,
    })
  })

  let posthogRequests = 0
  page.on('request', (request) => {
    if (POSTHOG_HOST_RE.test(request.url())) posthogRequests += 1
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('region', { name: 'Experience analytics choices' })).toBeHidden()

  const footer = page.locator('footer[data-section-id="footer"]')
  await footer.scrollIntoViewIfNeeded()
  await footer.getByRole('button', { name: 'Privacy Choices' }).click()

  const choices = page.getByRole('region', { name: 'Experience analytics choices' })
  await expect(choices).toContainText('Global Privacy Control is on')
  await expect(choices.getByRole('button', { name: 'Allow experience analytics' })).toHaveCount(0)
  expect(posthogRequests).toBe(0)
})
