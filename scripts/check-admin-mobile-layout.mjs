#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const root = new URL('../', import.meta.url)
const contract = JSON.parse(await readFile(new URL('docs/admin/capabilities.json', root), 'utf8'))
const baseUrl = process.env.ADMIN_ACCEPTANCE_BASE_URL?.replace(/\/$/, '')
const authToken = process.env.ADMIN_ACCEPTANCE_AUTH_TOKEN
const bypassToken = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

if (!baseUrl || !authToken) {
  console.error('ADMIN_ACCEPTANCE_BASE_URL and ADMIN_ACCEPTANCE_AUTH_TOKEN are required.')
  process.exit(2)
}

let target
try {
  target = new URL(baseUrl)
} catch {
  console.error('ADMIN_ACCEPTANCE_BASE_URL must be a valid absolute URL.')
  process.exit(2)
}

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])
if (target.protocol !== 'https:' && !loopbackHosts.has(target.hostname)) {
  console.error('Admin mobile acceptance requires HTTPS, except for a loopback address.')
  process.exit(2)
}

if (!loopbackHosts.has(target.hostname) && process.env.ADMIN_ACCEPTANCE_ALLOW_REMOTE_READS !== '1') {
  console.error('Refusing a remote host without ADMIN_ACCEPTANCE_ALLOW_REMOTE_READS=1. Prefer a local fixture server.')
  process.exit(2)
}

const productionHosts = new Set([
  'lashpop.vercel.app',
  'lashpop-experial.vercel.app',
  'lashpop-git-main-experial.vercel.app',
  'lashpopstudios.com',
  'www.lashpopstudios.com',
])
if (productionHosts.has(target.hostname) && process.env.ADMIN_ACCEPTANCE_ALLOW_PRODUCTION_READS !== '1') {
  console.error('Refusing production. Use a local fixture server or isolated branch preview for admin acceptance.')
  process.exit(2)
}

const protectedRoutes = [...new Set(
  contract.capabilities
    .filter((capability) => (
      capability.route.startsWith('/admin/')
      && capability.route !== '/admin/login'
      && capability.id !== 'founder-letter-redirect'
    ))
    .map((capability) => capability.route),
)].sort()

const viewports = [
  { label: '320x800', width: 320, height: 800 },
  { label: '390x844', width: 390, height: 844 },
]

const failures = []
const browser = await chromium.launch({ headless: true })

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: 'light',
      extraHTTPHeaders: bypassToken
        ? { 'x-vercel-protection-bypass': bypassToken }
        : undefined,
    })

    await context.addCookies([{
      name: 'auth_token',
      value: authToken,
      url: baseUrl,
    }])

    const page = await context.newPage()

    for (const route of protectedRoutes) {
      const requestedUrl = new URL(route, `${baseUrl}/`)

      try {
        const response = await page.goto(requestedUrl.href, {
          waitUntil: 'networkidle',
          timeout: 60_000,
        })

        const finalUrl = new URL(page.url())
        const redirected = response?.request().redirectedFrom() !== null
          || finalUrl.origin !== requestedUrl.origin
          || finalUrl.pathname !== requestedUrl.pathname
        const status = response?.status() ?? null
        const dimensions = await page.evaluate(() => {
          const viewportWidth = window.innerWidth
          const documentWidth = document.documentElement.scrollWidth
          const bodyWidth = document.body?.scrollWidth ?? 0
          const overflowLimit = viewportWidth + 1
          const overflowingElements = [...document.querySelectorAll('body *')]
            .map((element) => {
              const rect = element.getBoundingClientRect()
              return {
                tag: element.tagName.toLowerCase(),
                className: typeof element.className === 'string'
                  ? element.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
                  : '',
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                scrollWidth: element.scrollWidth,
                clientWidth: element.clientWidth,
              }
            })
            .filter((element) => (
              element.right > overflowLimit
              || element.left < -1
              || element.scrollWidth > element.clientWidth + 1
            ))
            .sort((a, b) => Math.max(b.right - viewportWidth, b.scrollWidth - b.clientWidth)
              - Math.max(a.right - viewportWidth, a.scrollWidth - a.clientWidth))
            .slice(0, 3)

          return {
            viewportWidth,
            documentWidth,
            bodyWidth,
            overflowingElements,
          }
        })

        const documentOverflow = Math.max(0, dimensions.documentWidth - dimensions.viewportWidth)
        const bodyOverflow = Math.max(0, dimensions.bodyWidth - dimensions.viewportWidth)
        const hasOverflow = documentOverflow > 1 || bodyOverflow > 1
        const badStatus = status === null || status < 200 || status >= 300
        const ok = !redirected && !hasOverflow && !badStatus
        const statusLabel = status ?? 'no-response'

        console.log(
          `${ok ? 'PASS' : 'FAIL'} ${viewport.label} ${statusLabel} ${route}`
          + ` final=${finalUrl.pathname}`
          + ` widths=${dimensions.viewportWidth}/${dimensions.documentWidth}/${dimensions.bodyWidth}`,
        )

        if (redirected) {
          failures.push(`${viewport.label} ${route} redirected to ${finalUrl.pathname}`)
        }
        if (badStatus) {
          failures.push(`${viewport.label} ${route} returned ${statusLabel}`)
        }
        if (hasOverflow) {
          const elementDiagnostics = dimensions.overflowingElements.length
            ? `; candidates=${dimensions.overflowingElements.map((element) => (
                `${element.tag}${element.className ? `.${element.className}` : ''}`
                + `[left=${element.left},right=${element.right},width=${element.width},scroll=${element.scrollWidth},client=${element.clientWidth}]`
              )).join(',')}`
            : ''
          failures.push(
            `${viewport.label} ${route} overflowed horizontally`
            + ` (viewport=${dimensions.viewportWidth}, document=${dimensions.documentWidth}, body=${dimensions.bodyWidth})`
            + elementDiagnostics,
          )
        }

        if (route === protectedRoutes[0]) {
          const openNavigation = page.getByRole('button', { name: 'Open admin navigation' })
          if (await openNavigation.isVisible()) {
            await openNavigation.click()
            const navigation = page.getByRole('dialog', { name: 'Navigation' })
            await navigation.waitFor({ state: 'visible' })
            const navigationWidths = await page.evaluate(() => ({
              viewport: window.innerWidth,
              document: document.documentElement.scrollWidth,
              body: document.body.scrollWidth,
            }))
            if (navigationWidths.document > navigationWidths.viewport + 1 || navigationWidths.body > navigationWidths.viewport + 1) {
              failures.push(
                `${viewport.label} mobile navigation overflowed horizontally`
                + ` (viewport=${navigationWidths.viewport}, document=${navigationWidths.document}, body=${navigationWidths.body})`,
              )
            }
            await page.getByRole('button', { name: 'Close admin navigation' }).click()
          } else {
            failures.push(`${viewport.label} mobile navigation trigger was not visible`)
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown navigation error'
        console.log(`FAIL ${viewport.label} navigation-error ${route}`)
        failures.push(`${viewport.label} ${route} could not be audited: ${message}`)
      }
    }

    await context.close()
  }
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(`\nAdmin mobile layout acceptance failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`\nAdmin mobile layout acceptance passed: ${protectedRoutes.length} routes at ${viewports.length} phone viewports.`)
