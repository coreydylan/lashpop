import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { preparePublicHome } from './helpers'

const QUIZ_EVIDENCE_DIR = process.env.LASHPOP_QUIZ_EVIDENCE_DIR ?? '/tmp/registry'

type QuizPath = {
  name: string
  q1Button: RegExp
  q2Button: RegExp
  resultStyle: 'classic' | 'wetAngel' | 'hybrid' | 'volume'
  resultHeading: string
  configuredResultImage: string
  expectedPairKeys: string[]
}

function pairKey(styles: string[]) {
  return [...styles].sort().join('-')
}

async function walkQuizPath(page: Page, path: QuizPath) {
  await preparePublicHome(page)

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  const quiz = page.locator('[role="dialog"]').first()
  await expect(quiz).toBeVisible()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: path.q1Button }).click()
  await quiz.getByRole('button', { name: path.q2Button }).click()

  const roundHistory: string[] = []
  for (let round = 0; round < 6; round += 1) {
    const result = quiz.locator('[data-quiz-result-style]')
    if (await result.isVisible().catch(() => false)) break

    const comparison = quiz.locator('[data-photo-pair]')
    await expect(comparison).toBeVisible()
    roundHistory.push(pairKey(await comparison.locator('[data-lash-style]').evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('data-lash-style') ?? ''),
    )))
    const previousPair = await comparison.getAttribute('data-photo-pair')
    const targetPhoto = comparison.locator(`[data-lash-style="${path.resultStyle}"]`)

    if (await targetPhoto.isVisible().catch(() => false)) {
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
    }, {
      timeout: 25_000,
      intervals: [100, 200, 500],
    }).not.toBe('waiting')
  }

  expect(roundHistory).toEqual(path.expectedPairKeys)
  const result = quiz.locator(`[data-quiz-result-style="${path.resultStyle}"]`)
  await expect(result).toBeVisible()
  await expect(result.getByRole('heading', { name: path.resultHeading })).toBeVisible()
  const resultImageFrame = result.locator('[data-quiz-result-image-src]')
  await expect(resultImageFrame).toHaveAttribute(
    'data-quiz-result-image-src',
    path.configuredResultImage,
  )
  const resultImage = resultImageFrame.locator('img')
  await expect(resultImage).toBeVisible()
  await expect.poll(
    () => resultImage.evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0)

  if (process.env.LASHPOP_QUIZ_EVIDENCE === '1') {
    await quiz.screenshot({
      path: `${QUIZ_EVIDENCE_DIR}/lashquiz_result_${path.resultStyle}.png`,
    })
  }
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

test("Evie's team profile uses her client-approved Instagram handle", async ({ page }) => {
  await preparePublicHome(page)

  const instagram = page.locator('a[href="https://instagram.com/thedarlinspot"]')
  await expect(instagram.first()).toBeAttached()
  await expect(instagram.first()).toContainText('thedarlinspot')
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

  const roundHistory: string[] = []
  for (let round = 0; round < 6; round += 1) {
    const resultHeading = quiz.getByText('Your Perfect Match')
    if (await resultHeading.isVisible().catch(() => false)) break
    const skip = quiz.getByRole('button', { name: 'Neither of these' })
    const comparison = quiz.locator('[data-photo-pair]')
    await expect(skip).toBeVisible()
    roundHistory.push(pairKey(await comparison.locator('[data-lash-style]').evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('data-lash-style') ?? ''),
    )))
    const previousPair = await comparison.getAttribute('data-photo-pair')
    await skip.click()
    await expect.poll(async () => {
      if (await resultHeading.isVisible().catch(() => false)) return 'result'
      if (await comparison.count() === 0) return 'waiting'
      const currentPair = await comparison.getAttribute('data-photo-pair')
      return currentPair !== previousPair ? 'next-pair' : 'waiting'
    }).not.toBe('waiting')
  }

  expect(roundHistory).toEqual([
    'classic-volume',
    'classic-wetAngel',
    'classic-hybrid',
    'hybrid-wetAngel',
    'volume-wetAngel',
    'hybrid-volume',
  ])
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
    configuredResultImage: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/quiz/results/2026-08-27/classic-full-set-approved.jpg',
    expectedPairKeys: ['classic-volume', 'classic-wetAngel', 'classic-hybrid'],
  },
  {
    name: 'Volume choices',
    q1Button: /Full makeup and all the glam/,
    q2Button: /Bold and dramatic/,
    resultStyle: 'volume',
    resultHeading: 'Volume Lashes',
    configuredResultImage: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/quiz/results/2026-08-27/volume-full-set-approved.jpg',
    expectedPairKeys: ['classic-volume', 'volume-wetAngel', 'hybrid-volume'],
  },
  {
    name: 'Hybrid photo choices against a Classic questionnaire',
    q1Button: /Sunscreen, lip balm/,
    q2Button: /Barely there/,
    resultStyle: 'hybrid',
    resultHeading: 'Hybrid Lashes',
    configuredResultImage: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/quiz/results/2026-08-27/hybrid-full-set-approved.jpg',
    expectedPairKeys: [
      'classic-volume',
      'classic-wetAngel',
      'classic-hybrid',
      'hybrid-wetAngel',
    ],
  },
  {
    name: 'Wet Angel photo choices against a Classic questionnaire',
    q1Button: /Sunscreen, lip balm/,
    q2Button: /Barely there/,
    resultStyle: 'wetAngel',
    resultHeading: 'Wet / Angel Lashes',
    configuredResultImage: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/quiz/results/2026-08-27/wetAngel-full-set-approved.jpg',
    expectedPairKeys: [
      'classic-volume',
      'classic-wetAngel',
      'classic-hybrid',
      'hybrid-wetAngel',
    ],
  },
] satisfies QuizPath[]) {
  test(`quiz ${path.name} produces its matching result and admin-configured photo`, async ({ page }) => {
    await walkQuizPath(page, path)
  })
}

test('mobile quiz keeps Neither of these adjacent to its photo pair', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await preparePublicHome(page)
  if (process.env.LASHPOP_QUIZ_EVIDENCE === '1') {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
  const quiz = page.locator('[role="dialog"]').first()
  await quiz.getByRole('button', { name: 'Start Quiz' }).click()
  await quiz.getByRole('button', { name: /Sunscreen, lip balm/ }).click()
  await quiz.getByRole('button', { name: /Barely there/ }).click()

  const photoGrid = quiz.locator('[data-quiz-photo-grid]')
  const skip = quiz.getByRole('button', { name: 'Neither of these' })
  await expect(photoGrid).toBeVisible()
  await expect(skip).toBeVisible()
  await expect.poll(async () =>
    photoGrid.locator('img').evaluateAll((images) =>
      images.length === 2
      && images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
    ),
  ).toBe(true)

  const photoGridBox = await photoGrid.boundingBox()
  const skipBox = await skip.boundingBox()
  expect(photoGridBox).not.toBeNull()
  expect(skipBox).not.toBeNull()
  expect(skipBox!.y - (photoGridBox!.y + photoGridBox!.height)).toBeGreaterThanOrEqual(0)
  expect(skipBox!.y - (photoGridBox!.y + photoGridBox!.height)).toBeLessThanOrEqual(20)

  if (process.env.LASHPOP_QUIZ_EVIDENCE === '1') {
    await page.waitForTimeout(750)
    await page.screenshot({ path: `${QUIZ_EVIDENCE_DIR}/lashquiz_mobile_390.png` })
  }
})

test('quiz comparison cards stay filled without reusing legacy square crop masters', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport)
    await preparePublicHome(page)
    if (process.env.LASHPOP_QUIZ_EVIDENCE === '1') {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
    }

    await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
    const quiz = page.locator('[role="dialog"]').first()
    await quiz.getByRole('button', { name: 'Start Quiz' }).click()
    await quiz.getByRole('button', { name: /Sunscreen, lip balm/ }).click()
    await quiz.getByRole('button', { name: /Barely there/ }).click()

    const photoGrid = quiz.locator('[data-quiz-photo-grid]')
    const cards = photoGrid.locator('button[data-lash-style]')
    const images = photoGrid.locator('img')
    await expect(cards).toHaveCount(2)
    await expect(images).toHaveCount(2)
    await expect.poll(async () =>
      images.evaluateAll((elements) =>
        elements.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
    ).toBe(true)

    for (const card of await cards.all()) {
      const box = await card.boundingBox()
      expect(box).not.toBeNull()
      expect(Math.abs((box!.width / box!.height) - 0.75)).toBeLessThanOrEqual(0.01)
      await expect(card).toHaveAttribute('data-quiz-photo-src', /\/uploads\//)
      await expect(card).not.toHaveAttribute('data-quiz-photo-src', /-square-/)
    }

    expect(
      await images.evaluateAll((elements) =>
        elements.map((image) => window.getComputedStyle(image).objectFit),
      ),
    ).toEqual(['cover', 'cover'])

    if (process.env.LASHPOP_QUIZ_EVIDENCE === '1' && viewport.width === 1440) {
      await page.waitForTimeout(750)
      await page.screenshot({ path: `${QUIZ_EVIDENCE_DIR}/lashquiz_desktop_1440.png` })
    }
  }
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
