import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { preparePublicHome } from './helpers'

const contract = JSON.parse(
  readFileSync(resolve(process.cwd(), 'docs/design/brand-contract.json'), 'utf8')
) as { tokens: Record<string, string>, computedTokenOverrides: Record<string, string> }

async function decodeImages(images: Locator) {
  await images.evaluateAll(async (elements) => {
    await Promise.all(elements.map(async (element) => {
      const image = element as HTMLImageElement
      image.loading = 'eager'
      if (!image.complete || image.naturalWidth === 0) {
        await image.decode()
      }
      if (image.naturalWidth === 0) {
        throw new Error(`Image failed to load: ${image.currentSrc || image.src}`)
      }
    }))
  })
}

test.beforeEach(async ({ page }) => {
  await preparePublicHome(page)
})

test('runtime styles resolve to the canonical contract', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'visual-desktop', 'One browser is sufficient for token wiring')
  const expectedTokens = { ...contract.tokens, ...contract.computedTokenOverrides }
  const actual = await page.evaluate((tokenNames) => {
    const root = getComputedStyle(document.documentElement)
    const body = getComputedStyle(document.body)
    const heading = getComputedStyle(document.querySelector('section[data-section-id="hero"]:not(.md\\:hidden) h1')!)
    return {
      tokens: Object.fromEntries(tokenNames.map((name) => [name, root.getPropertyValue(`--${name}`).trim()])),
      bodyFont: body.fontFamily,
      bodyBackground: body.backgroundColor,
      headingFont: heading.fontFamily,
      headingColor: heading.color,
      declaredFonts: Array.from(
        new Set(Array.from(document.fonts, (font) => font.family)),
      ).sort(),
      loadedFontResourceCount: performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => /\.(woff2?|ttf)(\?|$)/i.test(name)).length,
    }
  }, Object.keys(expectedTokens))

  expect(actual.tokens).toEqual(expectedTokens)
  expect(actual.bodyFont).toContain('Inter')
  expect(actual.bodyBackground).toBe('rgb(250, 246, 242)')
  expect(actual.headingFont).toContain('Playfair Display')
  expect(actual.headingColor).toBe('rgb(204, 148, 127)')
  expect(actual.declaredFonts).toEqual([
    'Inter',
    'Inter Fallback',
    'Playfair Display',
    'Playfair Display Fallback',
  ])
  expect(actual.loadedFontResourceCount).toBe(2)
})

for (const section of [
  { name: 'hero', selector: 'section[data-section-id="hero"]:visible' },
  { name: 'services', selector: 'section[data-section-id="services"]' },
  { name: 'team', selector: 'section[data-section-id="team"]' },
  { name: 'footer', selector: 'footer[data-section-id="footer"]' },
]) {
  test(`${section.name} matches the approved launch baseline`, async ({ page }) => {
    const target = page.locator(section.selector)
    await target.scrollIntoViewIfNeeded()
    const images = section.name === 'hero'
      ? page.locator('img[alt="LashPop Studio Interior"]:visible')
      : target.locator('img')
    await decodeImages(images)
    await page.waitForTimeout(300)
    await expect(target).toHaveScreenshot(`${section.name}.png`)
  })
}

test('mobile stylist chips remain contained by the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'visual-mobile', 'Mobile-only overflow contract')
  const team = page.locator('section[data-section-id="team"]')
  await team.scrollIntoViewIfNeeded()

  const bounds = await team.locator('[data-tags-scroll]').evaluateAll((rows) => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    rows: rows.map((row) => {
      const rect = row.getBoundingClientRect()
      return { left: rect.left, right: rect.right }
    }),
  }))

  expect(bounds.documentWidth).toBeLessThanOrEqual(bounds.viewportWidth + 1)
  for (const row of bounds.rows) {
    expect(row.left).toBeGreaterThanOrEqual(-1)
    expect(row.right).toBeLessThanOrEqual(bounds.viewportWidth + 1)
  }
})

test('the team scroll hint follows the first genuinely overflowing rail', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'visual-mobile', 'Mobile-only overflow cue')

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.evaluate(() => localStorage.removeItem('team-swipe-tutorial-completed'))
    await page.reload({ waitUntil: 'domcontentloaded' })
    const team = page.locator('section[data-section-id="team"]')
    await team.scrollIntoViewIfNeeded()

    await expect.poll(async () => team.locator('[data-team-tag-rail]').evaluateAll((rails) => {
      const firstOverflowing = rails.find((rail) => rail.scrollWidth > rail.clientWidth + 2)
      return {
        expected: firstOverflowing?.getAttribute('data-member-id') || null,
        owner: rails.find((rail) => rail.getAttribute('data-overflow-hint-owner') === 'true')
          ?.getAttribute('data-member-id') || null,
      }
    })).toEqual(expect.objectContaining({
      expected: expect.any(String),
      owner: expect.any(String),
    }))

    const ownership = await team.locator('[data-team-tag-rail]').evaluateAll((rails) => {
      const firstOverflowing = rails.find((rail) => rail.scrollWidth > rail.clientWidth + 2)
      const owner = rails.find((rail) => rail.getAttribute('data-overflow-hint-owner') === 'true')
      return {
        expected: firstOverflowing?.getAttribute('data-member-id') || null,
        owner: owner?.getAttribute('data-member-id') || null,
        ownerActuallyOverflows: owner ? owner.scrollWidth > owner.clientWidth + 2 : false,
      }
    })
    expect(ownership.owner).toBe(ownership.expected)
    expect(ownership.ownerActuallyOverflows).toBe(true)
  }
})

test('hero loading uses media-scoped preloads and no competing sheen', async ({ page }, testInfo) => {
  const preloads = await page.locator('link[data-lashpop-hero-preload]').evaluateAll((links) =>
    links.map((link) => ({
      media: link.getAttribute('media'),
      fetchPriority: link.getAttribute('fetchpriority'),
      imageSizes: link.getAttribute('imagesizes'),
    })),
  )

  expect(preloads).toEqual(expect.arrayContaining([
    expect.objectContaining({ media: '(max-width: 767px)', fetchPriority: 'high', imageSizes: '80vw' }),
    expect.objectContaining({ media: '(min-width: 768px)', fetchPriority: 'high' }),
  ]))
  await expect(page.locator('.hero-loading-sheen')).toHaveCount(0)

  const visibleHeroImage = page.locator('img[alt="LashPop Studio Interior"]:visible')
  await expect.poll(async () => visibleHeroImage.evaluate((image) => ({
    complete: (image as HTMLImageElement).complete,
    width: (image as HTMLImageElement).naturalWidth,
    opacity: getComputedStyle(image).opacity,
    transform: getComputedStyle(image).transform,
  }))).toEqual(expect.objectContaining({
    complete: true,
    width: expect.any(Number),
    opacity: '1',
  }))

  if (testInfo.project.name === 'visual-mobile') {
    await expect(page.locator('header.md\\:hidden')).toBeVisible()
    await expect(page.locator('main.mobile-scroll-container')).toBeVisible()
  }
})

test('core values enter as one reduced-motion-safe reveal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/work-with-us', { waitUntil: 'domcontentloaded' })
  const reveal = page.locator('[data-core-values-reveal]')
  const cards = reveal.locator('[data-core-value-card]')
  await expect(cards).toHaveCount(9)
  expect(await cards.evaluateAll((elements) => elements.every((element) =>
    !element.getAttribute('style')?.includes('opacity')
    && !element.getAttribute('style')?.includes('transform'),
  ))).toBe(true)

  await reveal.scrollIntoViewIfNeeded()
  await expect(reveal).toHaveCSS('opacity', '1')
  await expect.poll(async () => reveal.evaluate((element) => getComputedStyle(element).transform)).toBe('none')

  await page.evaluate(() => window.scrollTo(0, 0))
  await reveal.scrollIntoViewIfNeeded()
  await expect(reveal).toHaveCSS('opacity', '1')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  const reducedReveal = page.locator('[data-core-values-reveal]')
  await expect(reducedReveal).toHaveCSS('opacity', '1')
  await expect(reducedReveal).toHaveCSS('transform', 'none')
})

test('Mapbox CSS is active before the map is accepted as loaded', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'visual-desktop', 'One browser is sufficient for the load-order contract')
  const mapSection = page.locator('#find-us')
  await mapSection.scrollIntoViewIfNeeded()
  const map = mapSection.locator('.mapboxgl-map')
  await expect(map).toBeVisible({ timeout: 30_000 })
  await expect(map.locator('canvas.mapboxgl-canvas')).toBeVisible()
  await expect(map.locator('.mapboxgl-ctrl-top-right')).toBeVisible()
  await expect(map).toHaveCSS('position', 'relative')
})
