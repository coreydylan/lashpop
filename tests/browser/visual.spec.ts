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
    // Roster content is masked in the team section: who is on the team is a
    // content decision, and pixel-diffing it made every hire and departure a
    // red build, which trains people to rubber-stamp red. The roster itself is
    // asserted in roster.spec.ts.
    //
    // The masks are deliberately narrow - the photo itself, the two lines of
    // text, the chip labels, the handle link - so the card chrome stays under
    // the diff: rounded frame and border, the arched photo well and its
    // padding, the reserved two-line role height, the divider above the handle
    // row and that row's background, plus grid geometry and page chrome.
    if (section.name === 'team') {
      // The fixed header floats over whatever is under it, so where it lands in
      // a section screenshot depends on scroll position at capture time. It sits
      // right across the first row of cards, which is the region this test is
      // for. Hide it here; the header has its own coverage in the hero shot.
      await page.addStyleTag({ content: '[data-site-header] { display: none !important; }' })
      await page.waitForTimeout(100)
    }

    const mask = section.name === 'team'
      ? [
          target.locator('[data-roster-photo] img'),
          target.locator('[data-roster-identity] h3'),
          target.locator('[data-roster-identity] p'),
          target.locator('[data-roster-chips] span'),
          target.locator('[data-roster-social] a'),
        ]
      : []
    await expect(target).toHaveScreenshot(`${section.name}.png`, { mask })
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
