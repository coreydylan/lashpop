#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const root = new URL('../', import.meta.url)
const contract = JSON.parse(await readFile(new URL('docs/admin/capabilities.json', root), 'utf8'))

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
  { label: '1440x1000', width: 1440, height: 1000 },
]

/**
 * Runs inside the browser. A candidate is visible text whose rendered box clips
 * its content. Intentional controls, horizontal scrollers, explicitly marked
 * regions, and authored one-line shell titles with an accessible full label are
 * excluded.
 *
 * To mark another intentional exception, add
 * data-admin-layout-overflow="allow" to the smallest owning element.
 */
export function collectVisibleClippedText() {
  const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
  const isRendered = (element) => {
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false

    for (let current = element; current; current = current.parentElement) {
      const style = window.getComputedStyle(current)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      if (current.hidden || current.inert || current.getAttribute('aria-hidden') === 'true') return false
    }
    return true
  }
  const isWithinHorizontalScroller = (element) => {
    for (let current = element; current; current = current.parentElement) {
      const style = window.getComputedStyle(current)
      if ((style.overflowX === 'auto' || style.overflowX === 'scroll')
        && current.scrollWidth > current.clientWidth + 1) return true
    }
    return false
  }
  const isWithinComputedScreenReaderOnly = (element) => {
    for (let current = element; current; current = current.parentElement) {
      const hasScreenReaderOnlyClass = [...current.classList]
        .some((name) => name === 'sr-only' || name.endsWith(':sr-only'))
      if (!hasScreenReaderOnlyClass) continue

      const style = window.getComputedStyle(current)
      const rect = current.getBoundingClientRect()
      const clipsContent = style.overflowX === 'hidden' || style.overflowX === 'clip'
      if (style.position === 'absolute' && rect.width <= 1.5 && rect.height <= 1.5 && clipsContent) return true
    }
    return false
  }
  const fullLabel = (element, text) => {
    const authoredLabel = normalize(element.getAttribute('aria-label') || element.getAttribute('title'))
    if (authoredLabel && authoredLabel.includes(text)) return true

    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const label = normalize(labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent)
        .join(' '))
      if (label.includes(text)) return true
    }

    const interactive = element.closest('a[href], button, [role="link"], [role="button"]')
    const interactiveLabel = normalize(interactive?.getAttribute('aria-label') || interactive?.textContent)
    return Boolean(interactiveLabel && interactiveLabel.includes(text))
  }
  const selectorFor = (element) => {
    const id = element.id ? `#${element.id}` : ''
    const classes = typeof element.className === 'string'
      ? element.className.split(/\s+/).filter(Boolean).slice(0, 3).map((name) => `.${name}`).join('')
      : ''
    return `${element.tagName.toLowerCase()}${id}${classes}`
  }

  return [...document.querySelectorAll('body *')].flatMap((element) => {
    if (!(element instanceof HTMLElement) || !isRendered(element)) return []
    if (element.closest([
      'input',
      'textarea',
      'select',
      'option',
      '[contenteditable="true"]',
      '[data-admin-layout-overflow="allow"]',
      'pre',
      'code',
      'canvas',
      'svg',
    ].join(','))) return []
    if (isWithinComputedScreenReaderOnly(element)) return []
    if (isWithinHorizontalScroller(element)) return []

    const text = normalize(element.textContent)
    if (!text) return []

    const hasOwnText = [...element.childNodes]
      .some((node) => node.nodeType === Node.TEXT_NODE && normalize(node.textContent))
    const isTextContainer = /^(A|BUTTON|DT|DD|H[1-6]|LABEL|LI|P|SPAN|TD|TH)$/.test(element.tagName)
    const hasBlockChild = [...element.children].some((child) => {
      const display = window.getComputedStyle(child).display
      return display === 'block' || display === 'flex' || display === 'grid' || display.startsWith('table')
    })
    if (!hasOwnText && (!isTextContainer || hasBlockChild)) return []

    const style = window.getComputedStyle(element)
    const clipsX = element.scrollWidth > element.clientWidth + 1
      && (style.overflowX === 'hidden' || style.overflowX === 'clip')
    const clipsY = element.scrollHeight > element.clientHeight + 1
      && (style.overflowY === 'hidden' || style.overflowY === 'clip')
    if (!clipsX && !clipsY) return []

    const authoredTruncationClass = element.classList.contains('truncate')
      || [...element.classList].some((name) => name.startsWith('line-clamp-'))
    const authoredTruncation = style.textOverflow === 'ellipsis'
      || Number.parseInt(style.webkitLineClamp || '0', 10) > 0
      || authoredTruncationClass

    if (authoredTruncation && fullLabel(element, text)) return []
    return [{
      selector: selectorFor(element),
      excerpt: text.slice(0, 120),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      axis: clipsX && clipsY ? 'xy' : clipsX ? 'x' : 'y',
      authoredTruncation,
    }]
  }).slice(0, 8)
}

export function inspectAdminPageReadiness() {
  const visible = (element) => {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }
  const busyCount = [...document.querySelectorAll('[aria-busy="true"]')].filter(visible).length
  const loadingLabels = [...document.querySelectorAll('body *')]
    .filter((element) => element.children.length === 0 && visible(element))
    .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter((text) => /^Loading(?:\s+[\w -]+)?(?:…|\.\.\.)?$/i.test(text))
    .slice(0, 5)

  return {
    ready: busyCount === 0 && loadingLabels.length === 0,
    busyCount,
    loadingLabels,
  }
}

export function classifyAdminFixtureState(route) {
  const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim()
  if (route === '/admin/website/reviews') {
    if (document.querySelector('button[id^="review-actions-trigger-"]')) return 'populated'
    if (bodyText.includes('No reviews match') || bodyText.includes('No homepage reviews selected')) return 'empty'
    return 'unknown'
  }
  if (route === '/admin/website/services') {
    if (document.querySelector('a[href^="/admin/website/services/"]')) return 'populated'
    if (/\b0 services across 0 categories\b/i.test(bodyText)) return 'empty'
    return 'unknown'
  }
  if (route === '/admin/workflows/service-launch') {
    if (document.querySelector('ol[aria-label="Service launch checklist"]')) return 'populated'
    if (bodyText.includes('No service categories are available yet')) return 'empty'
    return 'unknown'
  }
  return 'not-applicable'
}

/**
 * Inspects an interaction surface without changing it. Controls can be matched
 * by selector alone or by exact, normalized text from one of `textOptions`.
 * A rendered control may sit below the fold inside a scrollable drawer; the
 * drawer itself must still fit inside the viewport.
 */
export function inspectAdminInteractionSurface({ surfaceSelector, expectedControls = [] }) {
  const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
  const isRendered = (element) => {
    if (!(element instanceof HTMLElement)) return false
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false

    for (let current = element; current; current = current.parentElement) {
      const style = window.getComputedStyle(current)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
      if (current.hidden || current.inert || current.getAttribute('aria-hidden') === 'true') return false
    }
    return true
  }

  const surface = document.querySelector(surfaceSelector)
  if (!(surface instanceof HTMLElement)) {
    return {
      present: false,
      visible: false,
      offViewport: true,
      rect: null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      controls: expectedControls.map((control) => ({
        label: control.label,
        present: false,
        visible: false,
      })),
    }
  }

  const controls = expectedControls.map((control) => {
    const candidates = [...surface.querySelectorAll(control.selector)]
    const textOptions = (control.textOptions ?? []).map(normalize)
    const element = textOptions.length
      ? candidates.find((candidate) => textOptions.includes(normalize(candidate.textContent)))
      : candidates[0]

    return {
      label: control.label,
      present: Boolean(element),
      visible: isRendered(element),
    }
  })
  const rect = surface.getBoundingClientRect()
  const tolerance = 1

  return {
    present: true,
    visible: isRendered(surface),
    offViewport: rect.left < -tolerance
      || rect.top < -tolerance
      || rect.right > window.innerWidth + tolerance
      || rect.bottom > window.innerHeight + tolerance,
    rect: {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    controls,
  }
}

export function inspectAdminDocumentWidths() {
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
}

async function waitForAdminPageReady(page, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  await page.waitForLoadState('networkidle', { timeout: Math.min(timeoutMs, 5_000) }).catch(() => {})
  await page.waitForTimeout(250)

  let previousFingerprint = null
  let stableReadySamples = 0
  let readiness = await page.evaluate(inspectAdminPageReadiness)

  while (Date.now() < deadline) {
    const fingerprint = await page.evaluate(() => (
      `${document.body.innerText.replace(/\s+/g, ' ').trim()}::${document.body.querySelectorAll('*').length}`
    ))
    stableReadySamples = readiness.ready && fingerprint === previousFingerprint
      ? stableReadySamples + 1
      : 0
    if (stableReadySamples >= 1) return readiness

    previousFingerprint = fingerprint
    await page.waitForTimeout(250)
    readiness = await page.evaluate(inspectAdminPageReadiness)
  }

  return readiness
}

function horizontalOverflowed(dimensions) {
  return Math.max(0, dimensions.documentWidth - dimensions.viewportWidth) > 1
    || Math.max(0, dimensions.bodyWidth - dimensions.viewportWidth) > 1
}

function clippedTextDiagnostic(items) {
  return items.map((item) => (
    `${item.selector}[axis=${item.axis},client=${item.clientWidth}x${item.clientHeight},scroll=${item.scrollWidth}x${item.scrollHeight}]`
    + ` "${item.excerpt}"`
  )).join('; ')
}

async function auditPopulatedReviewInteractions(page, viewport) {
  const results = []
  const trigger = page.locator('button[id^="review-actions-trigger-"]').first()
  const triggerVisible = await trigger.isVisible().catch(() => false)
  const triggerId = triggerVisible ? await trigger.getAttribute('id') : null
  const actionGroupId = triggerVisible ? await trigger.getAttribute('aria-controls') : null

  if (!triggerVisible || !triggerId || !actionGroupId) {
    results.push({
      state: 'action-menu',
      ok: false,
      failures: ['the first review action trigger was missing, hidden, or not connected to an action group'],
    })
    results.push({
      state: 'edit-drawer',
      ok: false,
      failures: ['the review editor could not be opened because its action trigger was unavailable'],
    })
    return results
  }

  try {
    await trigger.click()
    const actionGroupSelector = `[id=${JSON.stringify(actionGroupId)}]`
    await page.locator(actionGroupSelector).waitFor({ state: 'visible', timeout: 5_000 })
    await page.waitForTimeout(100)

    const actionSurface = await page.evaluate(inspectAdminInteractionSurface, {
      surfaceSelector: actionGroupSelector,
      expectedControls: [
        { label: 'Edit details', selector: 'button', textOptions: ['Edit details'] },
        { label: 'Read full review', selector: 'button', textOptions: ['Read full review', 'Show less'] },
        { label: 'Homepage placement', selector: 'button', textOptions: ['Add to homepage', 'Remove from homepage'] },
      ],
    })
    const actionDimensions = await page.evaluate(inspectAdminDocumentWidths)
    const actionClippedText = await page.evaluate(collectVisibleClippedText)
    const actionFailures = []
    const triggerExpanded = await trigger.getAttribute('aria-expanded')

    if (!actionSurface.present || !actionSurface.visible) actionFailures.push('the action group was missing or hidden')
    if (triggerExpanded !== 'true') actionFailures.push('the action trigger did not expose its expanded state')
    for (const control of actionSurface.controls.filter((item) => !item.present || !item.visible)) {
      actionFailures.push(`${control.label} was missing or hidden`)
    }
    if (horizontalOverflowed(actionDimensions)) {
      actionFailures.push(
        `the document overflowed horizontally (${actionDimensions.viewportWidth}/${actionDimensions.documentWidth}/${actionDimensions.bodyWidth})`,
      )
    }
    if (actionClippedText.length) actionFailures.push(`visible text was clipped: ${clippedTextDiagnostic(actionClippedText)}`)

    results.push({ state: 'action-menu', ok: actionFailures.length === 0, failures: actionFailures })

    const editDetails = page.locator(actionGroupSelector).getByRole('button', { name: 'Edit details', exact: true })
    if (!await editDetails.isVisible().catch(() => false)) {
      results.push({
        state: 'edit-drawer',
        ok: false,
        failures: ['Edit details was unavailable, so the review editor could not be opened'],
      })
      return results
    }

    await editDetails.click()
    const drawer = page.getByRole('dialog', { name: 'Edit review details', exact: true })
    await drawer.waitFor({ state: 'visible', timeout: 5_000 })
    await page.waitForTimeout(100)

    const drawerSurface = await page.evaluate(inspectAdminInteractionSurface, {
      surfaceSelector: '[role="dialog"][aria-modal="true"]',
      expectedControls: [
        { label: 'Close review editor', selector: 'button[aria-label="Close review editor"]' },
        { label: 'Homepage quality score', selector: 'input[name="review-quality-score"]' },
        { label: 'Stylist mentioned', selector: 'select[name="review-tagged-stylist"]' },
        { label: 'Allow on website', selector: 'input[name="review-website-visibility"]' },
        { label: 'Review notes', selector: 'textarea[name="review-editor-notes"]' },
        { label: 'Cancel', selector: 'button', textOptions: ['Cancel'] },
        { label: 'Save changes', selector: 'button', textOptions: ['Save changes'] },
      ],
    })
    const drawerDimensions = await page.evaluate(inspectAdminDocumentWidths)
    const drawerClippedText = await page.evaluate(collectVisibleClippedText)
    const drawerFailures = []

    if (!drawerSurface.present || !drawerSurface.visible) drawerFailures.push('the Edit review details drawer was missing or hidden')
    if (drawerSurface.offViewport) {
      const rect = drawerSurface.rect
        ? `${drawerSurface.rect.left},${drawerSurface.rect.top},${drawerSurface.rect.right},${drawerSurface.rect.bottom}`
        : 'missing'
      drawerFailures.push(
        `the drawer extended outside the viewport (rect=${rect}; viewport=${drawerSurface.viewport.width}x${drawerSurface.viewport.height})`,
      )
    }
    for (const control of drawerSurface.controls.filter((item) => !item.present || !item.visible)) {
      drawerFailures.push(`${control.label} was missing or hidden`)
    }
    if (horizontalOverflowed(drawerDimensions)) {
      drawerFailures.push(
        `the document overflowed horizontally (${drawerDimensions.viewportWidth}/${drawerDimensions.documentWidth}/${drawerDimensions.bodyWidth})`,
      )
    }
    if (drawerClippedText.length) drawerFailures.push(`visible text was clipped: ${clippedTextDiagnostic(drawerClippedText)}`)

    results.push({ state: 'edit-drawer', ok: drawerFailures.length === 0, failures: drawerFailures })
    await page.getByRole('button', { name: 'Close review editor', exact: true }).click()
    await drawer.waitFor({ state: 'hidden', timeout: 5_000 })
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown interaction error'
    const auditedStates = new Set(results.map((result) => result.state))
    for (const state of ['action-menu', 'edit-drawer']) {
      if (!auditedStates.has(state)) {
        results.push({ state, ok: false, failures: [`the interaction could not be audited: ${message}`] })
      }
    }
  }

  return results.map((result) => ({ ...result, viewport: viewport.label }))
}

async function main() {
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

  const failures = []
  const reviewInteractionFailures = []
  const reviewInteractionResults = []
  const fixtureStates = new Map()
  const browser = await chromium.launch({ headless: true })
  const contextOptions = (viewport) => ({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'light',
    extraHTTPHeaders: bypassToken
      ? { 'x-vercel-protection-bypass': bypassToken }
      : undefined,
  })
  const addAuthCookie = (context) => context.addCookies([{
    name: 'auth_token',
    value: authToken,
    url: baseUrl,
  }])

  let dynamicServiceRoute = null
  const explicitServiceId = process.env.ADMIN_ACCEPTANCE_SERVICE_ID?.trim()
  const allowMissingDynamicService = process.env.ADMIN_ACCEPTANCE_ALLOW_MISSING_DYNAMIC_SERVICE === '1'

  try {
    if (explicitServiceId) {
      dynamicServiceRoute = `/admin/website/services/${encodeURIComponent(explicitServiceId)}`
    } else {
      const discoveryContext = await browser.newContext(contextOptions(viewports[1]))
      await addAuthCookie(discoveryContext)
      const discoveryPage = await discoveryContext.newPage()
      await discoveryPage.goto(new URL('/admin/website/services', `${baseUrl}/`).href, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
      await waitForAdminPageReady(discoveryPage)
      const href = await discoveryPage.locator('a[href^="/admin/website/services/"]')
        .evaluateAll((links) => links[0]?.getAttribute('href') ?? null)
      if (href) dynamicServiceRoute = new URL(href, `${baseUrl}/`).pathname
      await discoveryContext.close()
    }

    for (const viewport of viewports) {
      const context = await browser.newContext(contextOptions(viewport))

      await addAuthCookie(context)

      const page = await context.newPage()
      const auditRoutes = dynamicServiceRoute
        ? [...protectedRoutes.map((route) => ({ route, dynamicEditor: false })), { route: dynamicServiceRoute, dynamicEditor: true }]
        : protectedRoutes.map((route) => ({ route, dynamicEditor: false }))

      for (const { route, dynamicEditor } of auditRoutes) {
        const requestedUrl = new URL(route, `${baseUrl}/`)
        const routeLabel = dynamicEditor ? '/admin/website/services/[id]' : route

        try {
          const response = await page.goto(requestedUrl.href, {
            waitUntil: 'domcontentloaded',
            timeout: 60_000,
          })
          await page.evaluate(() => document.fonts.ready)
          const readiness = await waitForAdminPageReady(page)
          await page.waitForTimeout(200)

          const finalUrl = new URL(page.url())
          const redirected = response?.request().redirectedFrom() !== null
            || finalUrl.origin !== requestedUrl.origin
            || finalUrl.pathname !== requestedUrl.pathname
          const status = response?.status() ?? null
          const fixtureState = await page.evaluate(classifyAdminFixtureState, route)
          if (fixtureState !== 'not-applicable') {
            const states = fixtureStates.get(route) ?? new Set()
            states.add(fixtureState)
            fixtureStates.set(route, states)
          }
          const clippedText = await page.evaluate(collectVisibleClippedText)
          const dimensions = await page.evaluate(inspectAdminDocumentWidths)
          dimensions.clippedText = clippedText

          const hasOverflow = horizontalOverflowed(dimensions)
          const badStatus = status === null || status < 200 || status >= 300
          const editorControlsPresent = !dynamicEditor || await Promise.all([
            page.locator('input[name="subtitle"]').isVisible(),
            page.locator('textarea[name="description"]').isVisible(),
            page.locator('button[type="submit"]').isVisible(),
          ]).then((checks) => checks.every(Boolean))
          const hasClippedText = dimensions.clippedText.length > 0
          const fixtureStateKnown = fixtureState !== 'unknown'
          const ok = readiness.ready && !redirected && !hasOverflow && !hasClippedText && !badStatus
            && editorControlsPresent && fixtureStateKnown
          const statusLabel = status ?? 'no-response'

          console.log(
            `${ok ? 'PASS' : 'FAIL'} ${viewport.label} ${statusLabel} ${routeLabel}`
            + ` final=${finalUrl.pathname}`
            + ` widths=${dimensions.viewportWidth}/${dimensions.documentWidth}/${dimensions.bodyWidth}`
            + ` clipped=${dimensions.clippedText.length}`
            + (fixtureState === 'not-applicable' ? '' : ` fixture=${fixtureState}`),
          )

          if (!readiness.ready) {
            failures.push(
              `${viewport.label} ${routeLabel} did not finish loading`
              + ` (busy=${readiness.busyCount}, loading=${readiness.loadingLabels.join('|') || 'none'})`,
            )
          }
          if (redirected) {
            failures.push(`${viewport.label} ${routeLabel} redirected to ${finalUrl.pathname}`)
          }
          if (badStatus) {
            failures.push(`${viewport.label} ${routeLabel} returned ${statusLabel}`)
          }
          if (hasOverflow) {
            const elementDiagnostics = dimensions.overflowingElements.length
              ? `; candidates=${dimensions.overflowingElements.map((element) => (
                  `${element.tag}${element.className ? `.${element.className}` : ''}`
                  + `[left=${element.left},right=${element.right},width=${element.width},scroll=${element.scrollWidth},client=${element.clientWidth}]`
                )).join(',')}`
              : ''
            failures.push(
              `${viewport.label} ${routeLabel} overflowed horizontally`
              + ` (viewport=${dimensions.viewportWidth}, document=${dimensions.documentWidth}, body=${dimensions.bodyWidth})`
              + elementDiagnostics,
            )
          }
          if (hasClippedText) {
            failures.push(
              `${viewport.label} ${routeLabel} clipped visible text: ${clippedTextDiagnostic(dimensions.clippedText)}`,
            )
          }
          if (!editorControlsPresent) {
            failures.push(`${viewport.label} ${routeLabel} did not render the service editor controls`)
          }
          if (!fixtureStateKnown) {
            failures.push(`${viewport.label} ${routeLabel} fixture state could not be classified`)
          }

          if (route === protectedRoutes[0] && viewport.width < 768) {
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

          if (route === '/admin/website/reviews' && viewport.width < 768 && fixtureState === 'populated') {
            const interactionResults = await auditPopulatedReviewInteractions(page, viewport)
            reviewInteractionResults.push(...interactionResults)
            for (const result of interactionResults) {
              console.log(
                `${result.ok ? 'PASS' : 'FAIL'} ${viewport.label} review-interaction ${result.state}`,
              )
              if (!result.ok) {
                reviewInteractionFailures.push(
                  `${viewport.label} ${result.state}: ${result.failures.join('; ')}`,
                )
              }
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown navigation error'
          console.log(`FAIL ${viewport.label} navigation-error ${routeLabel}`)
          failures.push(`${viewport.label} ${routeLabel} could not be audited: ${message}`)
        }
      }

      await context.close()
    }
  } finally {
    await browser.close()
  }

  if (!dynamicServiceRoute && !allowMissingDynamicService) {
    failures.push(
      'Dynamic service editor proof was not run because the service list contained no safe fixture service. '
      + 'Set ADMIN_ACCEPTANCE_SERVICE_ID to a fixture or sanitized preview service ID. '
      + 'Use ADMIN_ACCEPTANCE_ALLOW_MISSING_DYNAMIC_SERVICE=1 only for an explicitly capability-route-only run.',
    )
  }

  const fixtureSummary = [...fixtureStates.entries()]
    .map(([route, states]) => `${route}=${[...states].sort().join(',')}`)
    .join('; ')
  if (fixtureSummary) console.log(`\nFixture coverage: ${fixtureSummary}.`)
  const emptyFixtureRoutes = [...fixtureStates.entries()]
    .filter(([, states]) => states.has('empty'))
    .map(([route]) => route)
  if (emptyFixtureRoutes.length) {
    console.warn(
      `Populated record/card states were not proven for: ${emptyFixtureRoutes.join(', ')}. `
      + 'This run covers their authenticated shell and empty state only.',
    )
  }

  const populatedReviewMobileStates = fixtureStates.get('/admin/website/reviews')?.has('populated')
  if (reviewInteractionResults.length) {
    const passedInteractions = reviewInteractionResults.filter((result) => result.ok).length
    console.log(
      `Review interaction coverage: ${passedInteractions}/${reviewInteractionResults.length} checks passed`
      + ' across the mobile action menu and Edit review details drawer.',
    )
  } else if (!populatedReviewMobileStates) {
    console.warn(
      'Review action-menu and edit-drawer interaction checks were not run because the review fixture was empty. '
      + 'Use a sanitized populated review fixture to prove these mobile states.',
    )
  }

  if (failures.length) {
    console.error(`\nAdmin responsive layout acceptance failed:\n- ${failures.join('\n- ')}`)
  }
  if (reviewInteractionFailures.length) {
    console.error(`\nAdmin review interaction acceptance failed:\n- ${reviewInteractionFailures.join('\n- ')}`)
  }
  if (failures.length || reviewInteractionFailures.length) process.exit(1)

  console.log(
    `\nAdmin responsive layout acceptance passed: ${protectedRoutes.length} capability routes`
    + ` at ${viewports.length} phone and desktop viewports (${protectedRoutes.length * viewports.length} route checks).`,
  )
  if (dynamicServiceRoute) {
    console.log(
      `Dynamic service editor proof passed at ${viewports.length} viewports: /admin/website/services/[id]`
      + ` (fixture selected ${explicitServiceId ? 'from ADMIN_ACCEPTANCE_SERVICE_ID' : 'from the local service list'}).`,
    )
  } else {
    console.warn(
      'Dynamic service editor proof was explicitly skipped with ADMIN_ACCEPTANCE_ALLOW_MISSING_DYNAMIC_SERVICE=1; '
      + 'the 84 passing checks cover capability routes only.',
    )
  }
  if (reviewInteractionResults.length) {
    console.log(
      `Populated review interaction proof passed: ${reviewInteractionResults.length} mobile state checks`
      + ' (action menu and Edit review details drawer; no review data changed).',
    )
  }
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null
if (entrypoint === import.meta.url) await main()
