import { test, expect } from '@playwright/test'

/**
 * Phase 0a regression: every admin write route must reject an unauthenticated
 * request. Before hardening these returned 2xx with any/no auth_token cookie.
 * We accept 401/403 (route guard) or 302/307 (edge middleware redirect to login).
 */
test.describe('admin write routes are guarded', () => {
  const ROUTES: { method: 'patch' | 'put' | 'post'; url: string; body: unknown }[] = [
    { method: 'patch', url: '/api/admin/website/team', body: { memberId: '00000000-0000-0000-0000-000000000000', bio: 'x' } },
    { method: 'put', url: '/api/admin/website/seo', body: {} },
    { method: 'put', url: '/api/admin/website/instagram', body: {} },
    { method: 'post', url: '/api/admin/dam-users', body: {} },
    { method: 'put', url: '/api/admin/website/faqs', body: {} },
  ]

  for (const r of ROUTES) {
    test(`${r.method.toUpperCase()} ${r.url} is not open to the public`, async ({ playwright, baseURL }) => {
      const ctx = await playwright.request.newContext({ baseURL })
      const res = await ctx[r.method](r.url, { data: r.body, maxRedirects: 0, failOnStatusCode: false })
      expect([401, 403, 302, 307]).toContain(res.status())
      await ctx.dispose()
    })
  }
})

test.describe('public visitor', () => {
  test('gets no admin chrome and an unauthorized /api/admin/me', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext() // anonymous — no storageState
    const page = await ctx.newPage()

    const res = await page.request.get(`${baseURL}/api/admin/me`, { maxRedirects: 0, failOnStatusCode: false })
    expect([401, 302, 307]).toContain(res.status())

    await page.goto('/?admin=1')
    await expect(page.getByText('Admin mode', { exact: true })).toHaveCount(0)
    await ctx.dispose()
  })
})

test.describe('authenticated admin', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test('activates the inline admin chrome via ?admin=1', async ({ page }) => {
    await page.goto('/?admin=1')
    await expect(page.getByText('Admin mode', { exact: true })).toBeVisible({ timeout: 20_000 })
  })

  test('founder letter heading is inline-editable and persists (with revert)', async ({ page }) => {
    // Read current heading via the admin API so we can restore it afterwards.
    const before = await page.request.get(`${page.url() || ''}/api/admin/website/founder-letter`).catch(() => null)

    await page.goto('/?admin=1')
    await expect(page.getByText('Admin mode', { exact: true })).toBeVisible({ timeout: 20_000 })

    // The founder heading carries an Editable pencil labelled "Edit Founder letter — heading".
    const pencil = page.getByRole('button', { name: /Edit Founder letter — heading/i }).first()
    await expect(pencil).toBeVisible()

    // Capture original, edit, save, assert, then restore.
    const original = (await page.locator('h2').filter({ hasText: /.+/ }).first().innerText()).trim()
    const marker = `${original} ✦`

    await pencil.click()
    const field = page.locator('textarea, input[type="text"]').first()
    await field.fill(marker)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 })

    // Restore original so the test is non-destructive.
    const pencil2 = page.getByRole('button', { name: /Edit Founder letter — heading/i }).first()
    await pencil2.click()
    const field2 = page.locator('textarea, input[type="text"]').first()
    await field2.fill(original)
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    void before
  })
})
