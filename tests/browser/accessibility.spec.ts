import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { preparePublicHome } from './helpers'

test('public homepage has no serious or critical accessibility regressions', async ({ page }) => {
  await preparePublicHome(page)

  const results = await new AxeBuilder({ page })
    // Business-approved launch exception. See the signed launch acceptance.
    .disableRules(['color-contrast'])
    .analyze()

  const blocking = results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    }))

  expect(blocking).toEqual([])

  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(structuredData.join('\n')).not.toContain('Ava Zeutenhorst')
})

test('Classic Fill reaches the exact booking handoff', async ({ page }) => {
  await preparePublicHome(page)

  await page.getByRole('button', { name: /^LASH EXTENSIONS/ }).click()
  const browser = page.getByRole('dialog')
  await expect(browser).toBeVisible()
  await browser.getByRole('button', { name: /^Classic Fill/ }).click()

  await expect(browser.getByRole('heading', { name: 'Book Classic Fill' })).toBeVisible()
  await expect(browser.getByText('Preparing booking experience')).toBeVisible()
  await expect(page.locator('script[src*="vagaro"]')).toHaveCount(1)
})

test('service browser prioritizes and smoothly resolves visible card photos', async ({ page }) => {
  await preparePublicHome(page)

  await page.getByRole('button', { name: /^LASH EXTENSIONS/ }).click()
  const browser = page.getByRole('dialog')
  await expect(browser).toBeVisible()

  const photos = browser.locator('img[data-service-image]')
  await expect(photos.first()).toBeVisible()
  await expect.poll(() => photos.count()).toBeGreaterThan(1)

  const firstPhoto = photos.first()
  await expect(firstPhoto).toHaveAttribute('loading', 'eager')
  await expect(firstPhoto).toHaveAttribute('fetchpriority', 'high')
  await expect(firstPhoto).toHaveAttribute('sizes', '(max-width: 767px) calc(50vw - 22px), 274px')
  await expect(firstPhoto).toHaveAttribute('data-loaded', 'true')
  await expect.poll(
    () => firstPhoto.evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0)

  const currentSource = await firstPhoto.evaluate((image) => (image as HTMLImageElement).currentSrc)
  expect(currentSource).toMatch(/[?&]w=(320|600)(?:&|$)/)
})

test('quiz reaches one stable result image when every comparison is skipped', async ({ page }) => {
  await preparePublicHome(page)

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  // The dialog's accessible name follows the current quiz step, so keep a
  // stable role-based locator instead of pinning it to the intro title.
  const quiz = page.locator('[role="dialog"]').first()
  await expect(quiz).toBeVisible()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: /Sunscreen, lip balm/ }).click()
  await quiz.getByRole('button', { name: /Barely there/ }).click()

  for (let round = 0; round < 6; round += 1) {
    const resultHeading = quiz.getByText('Your Perfect Match')
    if (await resultHeading.isVisible().catch(() => false)) break
    const skip = quiz.getByRole('button', { name: 'Neither of these' })
    const comparison = quiz.locator('[data-photo-pair]')
    await expect(skip).toBeVisible()
    const previousPair = await comparison.getAttribute('data-photo-pair')
    await skip.click()
    await expect.poll(async () => {
      if (await resultHeading.isVisible().catch(() => false)) return 'result'
      if (await comparison.count() === 0) return 'waiting'
      const currentPair = await comparison.getAttribute('data-photo-pair')
      return currentPair !== previousPair ? 'next-pair' : 'waiting'
    }).not.toBe('waiting')
  }

  await expect(quiz.getByText('Your Perfect Match')).toBeVisible()
  const resultImage = quiz.locator('img[alt$="Lashes"]').first()
  await expect(resultImage).toBeVisible()
  await expect.poll(() => resultImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  const stableSource = await resultImage.getAttribute('src')

  await expect(quiz.getByText('Book your appointment:')).toBeVisible()
  await page.waitForTimeout(750)
  await expect(resultImage).toHaveAttribute('src', stableSource ?? '')
})

test('booth rental benefits include the approved maternity leave term', async ({ page }) => {
  await page.goto('/work-with-us', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Booth Rental - expand' }).click()

  await expect(page.locator('h4:visible').filter({ hasText: /^Maternity Leave$/ })).toBeVisible()
  await expect(
    page.locator('p:visible').filter({ hasText: /^8 weeks of complimentary booth rent for maternity leave\.$/ }),
  ).toBeVisible()
})
