import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { preparePublicHome } from './helpers'
import {
  INTERACTION_VISUAL_SURFACES,
  ROUTE_VISUAL_SURFACES,
} from './visual-coverage'

async function waitForVisualReady(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(750)
}

async function assertRenderedState(page: Page) {
  const state = await page.evaluate(() => {
    const brokenImages = Array.from(document.images)
      .filter((image) => image.getClientRects().length > 0)
      .filter((image) => !image.closest('[data-session-replay-block]'))
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src)
    const criticalControls = Array.from(
      document.querySelectorAll('header button, nav a, [role="dialog"] button'),
    )
      .filter((element) => element.getClientRects().length > 0)
      .filter((element) => {
        let parent = element.parentElement
        while (parent && parent !== document.body) {
          const style = getComputedStyle(parent)
          if (
            (style.overflowX === 'auto' || style.overflowX === 'scroll')
            && parent.scrollWidth > parent.clientWidth + 1
          ) {
            return false
          }
          parent = parent.parentElement
        }
        return true
      })
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return { left: rect.left, right: rect.right }
      })
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      brokenImages,
      criticalControls,
    }
  })

  expect(state.documentWidth).toBeLessThanOrEqual(state.viewportWidth + 1)
  expect(state.brokenImages).toEqual([])
  for (const control of state.criticalControls) {
    expect(control.left).toBeGreaterThanOrEqual(-1)
    expect(control.right).toBeLessThanOrEqual(state.viewportWidth + 1)
  }
}

async function screenshotState(page: Page, name: string, mask: Locator[] = []) {
  await waitForVisualReady(page)
  await assertRenderedState(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    mask,
  })
}

for (const surface of ROUTE_VISUAL_SURFACES) {
  test(`${surface.id} route is visually protected`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const response = await page.goto(surface.path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await screenshotState(page, surface.id)
  })
}

for (const surface of INTERACTION_VISUAL_SURFACES) {
  test(`${surface.id} state is visually protected`, async ({ page }, testInfo) => {
    await preparePublicHome(page)
    let mask: Locator[] = []

    if (surface.id === 'scrolled-navigation') {
      await page.locator('#faq').scrollIntoViewIfNeeded()
      if (testInfo.project.name !== 'visual-desktop') {
        await expect(page.locator('[data-mobile-site-header]')).toHaveCSS(
          'background-color',
          'rgb(250, 246, 242)',
        )
      }
    }

    if (surface.id === 'faq-expanded') {
      const faq = page.locator('#faq')
      await faq.scrollIntoViewIfNeeded()
      const firstQuestion = faq.locator('button[aria-expanded]').first()
      await firstQuestion.click()
      await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    }

    if (surface.id === 'service-browser' || surface.id === 'booking-classic-fill') {
      await page.getByRole('button', { name: /^LASH EXTENSIONS/ }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      if (surface.id === 'booking-classic-fill') {
        await dialog.getByRole('button', { name: /^Classic Fill/ }).click()
        await expect(dialog.getByRole('heading', { name: 'Book Classic Fill' })).toBeVisible()
        await expect(page.locator('.booking-view-widget[data-session-replay-block]')).toBeVisible()
        // The provider can still be on LashPop's branded loading state or may
        // already have injected its iframe. Mask that privacy boundary so the
        // public shell, modal geometry, title, and controls are deterministic.
        mask = [page.locator('[data-booking-visual-boundary]')]
      }
    }

    if (surface.id === 'quiz-welcome') {
      await page.getByRole('button', { name: 'Take Our Lash Quiz' }).first().click()
      const quiz = page.locator('[role="dialog"]').first()
      await expect(quiz).toBeVisible()
      await expect(quiz.getByRole('heading', { name: 'Find Your Perfect Lash Look' })).toBeVisible()
    }

    await screenshotState(page, surface.id, mask)
  })
}
