import { expect, test } from '@playwright/test'
import services from '../../src/test-fixtures/homepage-services.json'
import { preparePublicHome } from './helpers'

// Uses the real ServiceBrowser → BookingView. The provider is deliberately stubbed:
// this checks URL/DOM/selection wiring and must not be cited as live Vagaro success.
for (const name of ['Classic Full Set', 'Classic Fill']) {
  test(`actual launcher preserves the complete loader and selected ${name}`, async ({ page }) => {
    const service = services.services.find(service => service.name === name)!
    let injectedUrl = ''
    await page.route('https://www.vagaro.com/lashpop-launcher-test', route => route.fulfill({
      contentType: 'text/html',
      body: `<h1>${name}</h1><p>Provider stub: no booking submission</p><script>parent.postMessage(JSON.stringify({eventName:'WidgetLoaded'}),'*')</script>`,
    }))
    await page.route('**/resources/WidgetEmbeddedLoader/**', async route => {
      injectedUrl = route.request().url()
      await route.fulfill({
        contentType: 'application/javascript',
        body: `(() => {
          const script = document.currentScript;
          if (!script.parentElement.classList.contains('vagaro')) throw new Error('Missing Vagaro launcher context');
          const frame = document.createElement('iframe');
          frame.src = 'https://www.vagaro.com/lashpop-launcher-test';
          script.parentElement.appendChild(frame);
        })()`,
      })
    })
    await preparePublicHome(page)
    await page.getByRole('button', { name: /^LASH EXTENSIONS/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: new RegExp(`^${name}`) }).click()
    await expect(dialog.getByRole('heading', { name: `Book ${name}`, exact: true })).toBeVisible()
    const expected = new URL(service.vagaroWidgetUrl!)
    expected.hash = ''
    await expect.poll(() => injectedUrl).toBe(expected.href)
    const iframe = dialog.locator('iframe')
    await expect(iframe).toHaveCount(1)
    expect(await iframe.getAttribute('sandbox')).toBeNull()
    await expect(iframe).toHaveAttribute('src', 'https://www.vagaro.com/lashpop-launcher-test')
    await expect(dialog.frameLocator('iframe').getByRole('heading', { name, exact: true })).toBeVisible()
    await expect.poll(() => dialog.locator('.booking-view-widget').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
    await expect(page).toHaveURL('/')
  })
}
