import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { preparePublicHome } from './helpers'

type QuizPath = {
  name: string
  q1Button: RegExp
  q2Button: RegExp
  resultStyle: 'classic' | 'volume'
  resultHeading: string
}

async function walkQuizPath(page: Page, path: QuizPath) {
  await preparePublicHome(page)

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  const quiz = page.locator('[role="dialog"]').first()
  await expect(quiz).toBeVisible()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: path.q1Button }).click()
  await quiz.getByRole('button', { name: path.q2Button }).click()

  let lastSelectedPhoto: string | null = null
  for (let round = 0; round < 6; round += 1) {
    const result = quiz.locator('[data-quiz-result-style]')
    if (await result.isVisible().catch(() => false)) break

    const comparison = quiz.locator('[data-photo-pair]')
    await expect(comparison).toBeVisible()
    const previousPair = await comparison.getAttribute('data-photo-pair')
    const targetPhoto = comparison.locator(`[data-lash-style="${path.resultStyle}"]`)

    if (await targetPhoto.isVisible().catch(() => false)) {
      lastSelectedPhoto = await targetPhoto.getAttribute('data-quiz-photo-src')
      await targetPhoto.click()
    } else {
      await quiz.getByRole('button', { name: 'Neither of these' }).click()
    }

    await expect.poll(async () => {
      if (await result.isVisible().catch(() => false)) return 'result'
      if (await comparison.count() === 0) return 'waiting'
      return (await comparison.getAttribute('data-photo-pair')) !== previousPair
        ? 'next-pair'
        : 'waiting'
    }).not.toBe('waiting')
  }

  expect(lastSelectedPhoto).not.toBeNull()
  const result = quiz.locator(`[data-quiz-result-style="${path.resultStyle}"]`)
  await expect(result).toBeVisible()
  await expect(result.getByRole('heading', { name: path.resultHeading })).toBeVisible()
  const resultImageFrame = result.locator('[data-quiz-result-image-src]')
  await expect(resultImageFrame).toHaveAttribute('data-quiz-result-image-src', lastSelectedPhoto ?? '')
  const resultImage = resultImageFrame.locator('img')
  await expect(resultImage).toBeVisible()
  await expect.poll(
    () => resultImage.evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0)
}

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

test('quiz keeps its selection confirmation inside the chosen photo', async ({ page }) => {
  await preparePublicHome(page)

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  const quiz = page.locator('[role="dialog"]').first()
  await expect(quiz).toBeVisible()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: /Sunscreen, lip balm/ }).click()
  await quiz.getByRole('button', { name: /Barely there/ }).click()

  const selectedPhoto = quiz.getByRole('button', { name: 'Left option' })
  await expect(selectedPhoto).toBeVisible()
  await selectedPhoto.click()
  await expect(selectedPhoto).toHaveAttribute('aria-pressed', 'true')

  const indicator = selectedPhoto.locator('[data-quiz-selection-indicator]')
  await expect(indicator).toBeVisible()

  const photoBox = await selectedPhoto.boundingBox()
  const indicatorBox = await indicator.boundingBox()
  expect(photoBox).not.toBeNull()
  expect(indicatorBox).not.toBeNull()
  expect(indicatorBox!.x).toBeGreaterThanOrEqual(photoBox!.x)
  expect(indicatorBox!.y).toBeGreaterThanOrEqual(photoBox!.y)
  expect(indicatorBox!.x + indicatorBox!.width).toBeLessThanOrEqual(photoBox!.x + photoBox!.width)
  expect(indicatorBox!.y + indicatorBox!.height).toBeLessThanOrEqual(photoBox!.y + photoBox!.height)
})

for (const path of [
  {
    name: 'Classic choices',
    q1Button: /Sunscreen, lip balm/,
    q2Button: /Barely there/,
    resultStyle: 'classic',
    resultHeading: 'Classic Lashes',
  },
  {
    name: 'Volume choices',
    q1Button: /Full makeup and all the glam/,
    q2Button: /Bold and dramatic/,
    resultStyle: 'volume',
    resultHeading: 'Volume Lashes',
  },
] satisfies QuizPath[]) {
  test(`quiz ${path.name} produce a matching result and exact chosen photo`, async ({ page }) => {
    await walkQuizPath(page, path)
  })
}

test('mobile quiz keeps Neither of these adjacent to its photo pair', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await preparePublicHome(page)

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  const quiz = page.locator('[role="dialog"]').first()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: /Sunscreen, lip balm/ }).click()
  await quiz.getByRole('button', { name: /Barely there/ }).click()

  const photoGrid = quiz.locator('[data-quiz-photo-grid]')
  const skip = quiz.getByRole('button', { name: 'Neither of these' })
  await expect(photoGrid).toBeVisible()
  await expect(skip).toBeVisible()

  const photoGridBox = await photoGrid.boundingBox()
  const skipBox = await skip.boundingBox()
  expect(photoGridBox).not.toBeNull()
  expect(skipBox).not.toBeNull()
  expect(skipBox!.y - (photoGridBox!.y + photoGridBox!.height)).toBeGreaterThanOrEqual(0)
  expect(skipBox!.y - (photoGridBox!.y + photoGridBox!.height)).toBeLessThanOrEqual(20)
})

test('quiz back navigation replaces the edited answer without losing the first answer', async ({ page }) => {
  await preparePublicHome(page)

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  const quiz = page.locator('[role="dialog"]').first()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: /It depends/ }).click()
  await quiz.getByRole('button', { name: /Barely there/ }).click()
  await expect(quiz.locator('[data-photo-pair]')).toBeVisible()

  await quiz.getByRole('button', { name: 'Go back' }).click()
  await quiz.getByRole('button', { name: /Soft and natural/ }).click()

  for (let round = 0; round < 6; round += 1) {
    const result = quiz.locator('[data-quiz-result-style]')
    if (await result.isVisible().catch(() => false)) break
    const comparison = quiz.locator('[data-photo-pair]')
    const previousPair = await comparison.getAttribute('data-photo-pair')
    await quiz.getByRole('button', { name: 'Neither of these' }).click()
    await expect.poll(async () => {
      if (await result.isVisible().catch(() => false)) return 'result'
      if (await comparison.count() === 0) return 'waiting'
      return (await comparison.getAttribute('data-photo-pair')) !== previousPair
        ? 'next-pair'
        : 'waiting'
    }).not.toBe('waiting')
  }

  await expect(quiz.locator('[data-quiz-result-style="wetAngel"]')).toBeVisible()
  await expect(quiz.getByRole('heading', { name: 'Wet / Angel Lashes' })).toBeVisible()
})

test('booth rental benefits include the approved maternity leave term', async ({ page }) => {
  await page.goto('/work-with-us', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Booth Rental - expand' }).click()

  await expect(page.locator('h4:visible').filter({ hasText: /^Maternity Leave$/ })).toBeVisible()
  await expect(
    page.locator('p:visible').filter({ hasText: /^8 weeks of complimentary booth rent for maternity leave\.$/ }),
  ).toBeVisible()
})
