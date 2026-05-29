import { test, expect } from '@playwright/test'

/**
 * Inline admin — Edit history panel + one-click restore.
 *
 * Makes a hero heading edit (so the audit log has a fresh entry), opens the
 * chrome's "Edit history" panel, asserts it lists entries each with a "Restore"
 * button, clicks Restore on the top entry and asserts the POST /api/admin/history
 * request succeeds. Finally restores the original hero heading via a direct PUT so
 * the page is left non-destructive.
 *
 * Selectors are role/label-based; the panel is a dialog labelled "Edit history".
 */

test.describe('inline admin: edit history rollback', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test('lists history entries and restores the top one', async ({ page }) => {
    await page.goto('/?admin=1')
    await expect(page.getByText('Admin mode', { exact: true })).toBeVisible({ timeout: 20_000 })

    // Read the original heading up front so we can put it back at the end.
    const before = await page.request
      .get('/api/admin/website/hero-copy', { failOnStatusCode: false })
      .then(r => (r.ok() ? r.json() : null))
    const originalHeading: string | undefined = before?.content?.heading

    // Make an edit so there's a guaranteed-fresh hero-copy.update entry.
    const pencil = page
      .getByRole('button', { name: /Edit Hero — heading/i })
      .locator('visible=true')
      .first()
    await expect(pencil).toBeVisible({ timeout: 15_000 })
    await pencil.click()
    const field = page.locator('[data-admin-editing] input, [data-admin-editing] textarea').first()
    await expect(field).toBeVisible()
    const original = await field.inputValue()
    await field.fill(`${original} ✦history-test`)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(`${original} ✦history-test`).first()).toBeVisible({ timeout: 15_000 })

    // Open the Edit history panel from the chrome.
    await page.getByRole('button', { name: 'Edit history' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit history' })
    await expect(dialog).toBeVisible()

    // The panel lists entries, each with a "Restore" button.
    const restoreButtons = dialog.getByRole('button', { name: 'Restore' })
    await expect(restoreButtons.first()).toBeVisible({ timeout: 15_000 })
    expect(await restoreButtons.count()).toBeGreaterThan(0)

    // Clicking Restore on the top entry fires POST /api/admin/history and succeeds.
    const [restoreRes] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('/api/admin/history') && res.request().method() === 'POST'
      ),
      restoreButtons.first().click(),
    ])
    expect(restoreRes.ok()).toBeTruthy()

    // Clean up: put the hero heading back to its original via a direct PUT.
    if (typeof originalHeading === 'string') {
      const current = await page.request
        .get('/api/admin/website/hero-copy', { failOnStatusCode: false })
        .then(r => (r.ok() ? r.json() : null))
      if (current?.content && current.content.heading !== originalHeading) {
        const res = await page.request.put('/api/admin/website/hero-copy', {
          data: { heading: originalHeading, baseUpdatedAt: current.content.updatedAt },
          failOnStatusCode: false,
        })
        expect([200, 409]).toContain(res.status())
      }
    }
  })
})
