import { expect, test } from '@playwright/test'

const FIXTURE_TOKEN = 'phc_fixture_aggregate_token_12345'

async function mockPostHogProjectConfig(page: import('@playwright/test').Page) {
  const config = {
    supportedCompression: [],
    autocapture_opt_out: true,
    sessionRecording: {
      sampleRate: '1',
      minimumDurationMilliseconds: 0,
      networkPayloadCapture: { recordBody: false, recordHeaders: false },
      masking: {
        maskAllInputs: true,
        blockSelector: '[data-session-replay-block]',
      },
    },
    toolbarParams: {},
    isAuthenticated: false,
    siteApps: [],
    hasFeatureFlags: false,
  }

  await page.route('https://us-assets.i.posthog.com/**', async (route) => {
    const url = route.request().url()
    if (url.endsWith('/config.js')) {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `window._POSTHOG_REMOTE_CONFIG=window._POSTHOG_REMOTE_CONFIG||{};window._POSTHOG_REMOTE_CONFIG[${JSON.stringify(FIXTURE_TOKEN)}]={config:${JSON.stringify(config)}};`,
      })
      return
    }
    if (url.endsWith('/config')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(config) })
      return
    }
    await route.continue()
  })
}

test('records masked public sessions and aggregate gestures without analytics UI', async ({ page, context }) => {
  let posthogConfigRequests = 0
  let replayRecorderRequests = 0
  page.on('request', (request) => {
    if (request.url().startsWith('https://us-assets.i.posthog.com/')) posthogConfigRequests += 1
    if (request.url().endsWith('/lazy-recorder.js')) replayRecorderRequests += 1
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('lashpop_lash_quiz_dismissed', 'true')
    window.localStorage.setItem('lashpop_team_swipe_tutorial_completed', 'true')
    const captured: string[] = []
    Object.defineProperty(window, '__lashpopInteractionEvents', { value: captured })
    window.addEventListener('lashpop:interaction-stat-captured', (event) => {
      captured.push((event as CustomEvent<{ event: string }>).detail.event)
    })
  })
  await page.route('https://*.i.posthog.com/**', (route) => route.abort())
  await mockPostHogProjectConfig(page)

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-interaction-analytics', 'active')
  await expect(page.locator('html')).toHaveAttribute('data-session-replay', 'active', { timeout: 10_000 })

  await expect(page.getByRole('region', { name: /analytics|privacy choices/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /privacy choices/i })).toHaveCount(0)

  const hero = page.locator('section[data-section-id="hero"]:visible')
  const box = await hero.boundingBox()
  expect(box).not.toBeNull()
  if (!box) return

  await page.evaluate(({ x, y }) => {
    const target = document.elementFromPoint(x, y) ?? document.body
    target.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: x,
      clientY: y,
      isPrimary: true,
      pointerId: 41,
      pointerType: 'touch',
    }))
    target.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      clientX: x + 4,
      clientY: y + 5,
      isPrimary: true,
      pointerId: 41,
      pointerType: 'touch',
    }))
    target.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: x,
      clientY: y + 220,
      isPrimary: true,
      pointerId: 42,
      pointerType: 'touch',
    }))
    target.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      clientX: x,
      clientY: y,
      isPrimary: true,
      pointerId: 42,
      pointerType: 'touch',
    }))
  }, {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + Math.min(300, box.height / 2)),
  })
  const footer = page.locator('footer[data-section-id="footer"]')
  await footer.scrollIntoViewIfNeeded()
  await expect(footer.locator('form[data-session-replay-block]')).toHaveCount(1)

  await page.getByRole('button', { name: /^LASH EXTENSIONS/ }).click()
  const serviceBrowser = page.getByRole('dialog')
  await serviceBrowser.getByRole('button', { name: /^Classic Fill/ }).click()
  await expect(serviceBrowser.locator('.booking-view-widget[data-session-replay-block]')).toHaveCount(1)

  await expect.poll(
    () => page.evaluate(() => (
      window as unknown as Window & { __lashpopInteractionEvents: string[] }
    ).__lashpopInteractionEvents),
    { timeout: 10_000 }
  ).toEqual(expect.arrayContaining(['ux_page_view', 'ux_tap', 'ux_swipe']))
  expect(posthogConfigRequests).toBeGreaterThan(0)
  expect(replayRecorderRequests).toBeGreaterThan(0)

  await page.goto('/privacy', { waitUntil: 'domcontentloaded' })

  const browserStorage = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
  }))
  expect(browserStorage.local.filter((key) => /posthog/i.test(key))).toEqual([])
  expect(browserStorage.session.filter((key) => /posthog/i.test(key))).toEqual([])
  expect((await context.cookies()).filter((cookie) => /posthog/i.test(cookie.name))).toEqual([])
})

test('does not initialize analytics on sensitive routes', async ({ page }) => {
  const posthogRequests: string[] = []
  page.on('request', (request) => {
    if (/posthog\.com/.test(request.url())) posthogRequests.push(request.url())
  })

  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(750)

  await expect(page.locator('html')).not.toHaveAttribute('data-interaction-analytics', 'active')
  expect(posthogRequests).toEqual([])
})
