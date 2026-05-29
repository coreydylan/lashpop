import { test, expect } from '@playwright/test'

/**
 * Inline admin — canonical site-sections drive the nav.
 *
 * site_sections is the single source of truth for each homepage section's
 * navLabel + anchor + order + visibility; the nav bar DERIVES its links from it.
 * This asserts the admin GET /api/admin/website/site-sections returns a well-formed
 * sections array (each entry carrying navLabel + anchor), then ground-truths that
 * the homepage nav renders those visible labels as in-page anchor links.
 *
 * Read-only: no writes, so it's inherently non-destructive.
 */

test.describe('inline admin: canonical nav sections', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test('GET site-sections returns navLabel + anchor entries', async ({ page }) => {
    const res = await page.request.get('/api/admin/website/site-sections', { failOnStatusCode: false })
    expect(res.ok()).toBeTruthy()
    const { content } = await res.json()

    expect(Array.isArray(content?.sections)).toBe(true)
    expect(content.sections.length).toBeGreaterThan(0)

    for (const s of content.sections) {
      expect(typeof s.navLabel).toBe('string')
      expect(s.navLabel.length).toBeGreaterThan(0)
      expect(typeof s.anchor).toBe('string')
      expect(s.anchor.startsWith('#')).toBe(true)
    }
  })

  test('homepage nav renders the canonical visible labels', async ({ page }) => {
    const res = await page.request.get('/api/admin/website/site-sections', { failOnStatusCode: false })
    expect(res.ok()).toBeTruthy()
    const { content } = await res.json()

    const visible: { navLabel: string; anchor: string }[] = (content?.sections ?? []).filter(
      (s: { visible?: boolean }) => s.visible !== false
    )
    expect(visible.length).toBeGreaterThan(0)

    await page.goto('/')

    const nav = page.getByRole('navigation').first()
    await expect(nav).toBeVisible({ timeout: 20_000 })

    // Each visible canonical label should surface somewhere in the nav. The nav
    // renders both desktop and mobile sets, so we only require at least one match.
    for (const s of visible) {
      await expect(
        nav.getByText(s.navLabel, { exact: true }).first()
      ).toBeAttached({ timeout: 15_000 })
    }
  })
})
