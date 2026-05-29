import { test, expect } from '@playwright/test'

/**
 * Inline admin — session "Undo last edit".
 *
 * Edits the hero heading via its Editable pencil (aria-label "Edit Hero — heading"),
 * saves, then clicks the chrome's "Undo last edit" control and asserts the heading
 * reverts to its original. The undo button only renders once there's an undo on the
 * stack (undoCount > 0), so a save must happen first.
 *
 * Non-destructive: the marker is appended to the live value, and the undo (or an
 * explicit restore at the end) puts the original text back.
 *
 * Selectors are role/label-based; the open editor is scoped via [data-admin-editing].
 */

test.describe('inline admin: undo last edit', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test('reverts a hero heading edit via "Undo last edit"', async ({ page }) => {
    await page.goto('/?admin=1')
    await expect(page.getByText('Admin mode', { exact: true })).toBeVisible({ timeout: 20_000 })

    // The hero heading carries an Editable pencil labelled "Edit Hero — heading".
    // There are mobile (-m) and desktop (-d) instances; target whichever is
    // actually visible at the current viewport.
    const pencil = page
      .getByRole('button', { name: /Edit Hero — heading/i })
      .locator('visible=true')
      .first()
    await expect(pencil).toBeVisible({ timeout: 15_000 })
    await pencil.click()

    // Scope to the open editor (its wrapper carries data-admin-editing).
    const field = page.locator('[data-admin-editing] input, [data-admin-editing] textarea').first()
    await expect(field).toBeVisible()
    const original = await field.inputValue()
    const marker = `${original} ✦undo-test`

    await field.fill(marker)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 })

    // The chrome surfaces "Undo last edit" only after a save pushes an undo entry.
    const undo = page.getByRole('button', { name: /Undo last edit/i })
    await expect(undo).toBeVisible({ timeout: 10_000 })
    await undo.click()

    // After undo the original heading is back and the marker is gone.
    await expect(page.getByText(original, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(marker)).toHaveCount(0)

    // Belt-and-suspenders: explicitly restore the original so the page is pristine
    // regardless of how undo settled the optimistic display.
    const value = await page.request
      .get('/api/admin/website/hero-copy', { failOnStatusCode: false })
      .then(r => (r.ok() ? r.json() : null))
    if (value?.content && value.content.heading !== original) {
      await page.request.put('/api/admin/website/hero-copy', {
        data: { heading: original, baseUpdatedAt: value.content.updatedAt },
        failOnStatusCode: false,
      })
    }
  })
})
