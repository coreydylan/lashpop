import { test, expect } from '@playwright/test'

/**
 * Public visitor — secret admin entry via the footer copyright line.
 *
 * Tapping the footer copyright line 5× quickly (handler `secretTap` on the <p>)
 * opens the inline AdminLoginModal for an anonymous visitor instead of bouncing
 * to /dam/login. This runs with NO admin cookie (default anonymous context) and
 * asserts the "Admin sign in" modal — with its "Send code" button — appears.
 *
 * Selectors are role/label-based: the modal is a dialog labelled "Admin sign in".
 */

test.describe('public visitor: secret admin entry', () => {
  // Explicitly anonymous — no storageState, so no admin cookie.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('5 taps on the footer copyright opens the Admin sign in modal', async ({ page }) => {
    await page.goto('/')

    // The copyright line carries the Editable with id="footer-copyright"; its
    // parent <p> owns the secretTap onClick. Click the rendered copyright text.
    const copyright = page.locator('#footer-copyright')
    await copyright.scrollIntoViewIfNeeded()
    await expect(copyright).toBeVisible({ timeout: 20_000 })

    // 5 quick taps (under the 2s reset window) trips the secret entry.
    for (let i = 0; i < 5; i++) {
      await copyright.click({ force: true })
    }

    // The inline AdminLoginModal appears: dialog "Admin sign in" + "Send code".
    const modal = page.getByRole('dialog', { name: 'Admin sign in' })
    await expect(modal).toBeVisible({ timeout: 10_000 })
    await expect(modal.getByText('Admin sign in')).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Send code' })).toBeVisible()
  })
})
