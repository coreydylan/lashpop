import type { Page } from '@playwright/test'

export async function preparePublicHome(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem('lashpop_lash_quiz_dismissed', 'true')
    localStorage.setItem('lashpop_team_swipe_tutorial_completed', 'true')
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('section[data-section-id="hero"]:visible').waitFor({ state: 'visible' })
  await page.waitForTimeout(750)
}
