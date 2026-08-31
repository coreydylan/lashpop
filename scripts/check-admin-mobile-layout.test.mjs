import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from '@playwright/test'
import {
  classifyAdminFixtureState,
  collectVisibleClippedText,
  inspectAdminDocumentWidths,
  inspectAdminInteractionSurface,
  inspectAdminPageReadiness,
} from './check-admin-mobile-layout.mjs'

let browser
let page

before(async () => {
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ viewport: { width: 320, height: 800 } })
})

after(async () => {
  await browser?.close()
})

async function audit(markup) {
  await page.setContent(`<main>${markup}</main>`)
  return page.evaluate(collectVisibleClippedText)
}

test('finds horizontal and vertical clipped copy', async () => {
  const candidates = await audit(`
    <p id="horizontal" style="display:block;width:80px;white-space:nowrap;overflow:hidden">
      This sentence is wider than its box.
    </p>
    <p id="vertical" style="display:block;width:90px;height:18px;line-height:18px;overflow:hidden">
      This sentence wraps onto several lines and is cut short.
    </p>
  `)

  assert.deepEqual(candidates.map((candidate) => candidate.selector), ['p#horizontal', 'p#vertical'])
  assert.equal(candidates[0].axis, 'x')
  assert.equal(candidates[1].axis, 'y')
})

test('exempts intentional controls, horizontal scrollers, and marked regions', async () => {
  const candidates = await audit(`
    <input style="width:40px" value="A deliberately long input value">
    <div style="width:90px;overflow-x:auto">
      <span style="display:inline-block;white-space:nowrap">Scrollable filter choices remain available</span>
    </div>
    <p data-admin-layout-overflow="allow" style="width:70px;white-space:nowrap;overflow:hidden">
      Explicitly accepted visual truncation
    </p>
  `)

  assert.deepEqual(candidates, [])
})

test('exempts responsive screen-reader-only copy only while its hidden styles apply', async () => {
  const markup = `
    <style>
      .mobile-clipped {
        display: block;
        width: 60px;
        white-space: nowrap;
        overflow: hidden;
      }
      @media (min-width: 640px) {
        .sm\\:sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      }
    </style>
    <label id="responsive-label" class="sm:sr-only mobile-clipped">
      Service category with a deliberately long name
    </label>
  `

  await page.setViewportSize({ width: 1024, height: 800 })
  assert.deepEqual(await audit(markup), [])

  await page.setViewportSize({ width: 320, height: 800 })
  const mobileCandidates = await audit(markup)
  assert.equal(mobileCandidates.length, 1)
  assert.match(mobileCandidates[0].selector, /^label#responsive-label/)
})

test('exempts labelled truncation and flags unlabeled clipping, including utility classes', async () => {
  const candidates = await audit(`
    <p id="labelled" title="The full labelled sentence remains available" style="width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      The full labelled sentence remains available
    </p>
    <p id="unlabelled" style="width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      This unlabelled sentence is visually truncated
    </p>
    <p id="utility-class" class="truncate" style="width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      This explicitly authored one-line summary remains accessible in the DOM
    </p>
  `)

  assert.deepEqual(candidates.map((candidate) => candidate.selector), ['p#unlabelled', 'p#utility-class.truncate'])
  assert.ok(candidates.every((candidate) => candidate.authoredTruncation))
})

test('accepts the shell current-page title when its link exposes the full name', async () => {
  const candidates = await audit(`
    <header class="admin-mobile-header">
      <a href="/admin/overview">
        <span class="truncate" style="display:block;width:54px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          Services and booking
        </span>
      </a>
    </header>
  `)

  assert.deepEqual(candidates, [])
})

test('wait-state inspection catches busy regions and visible loading copy', async () => {
  await page.setContent(`
    <main aria-busy="true">
      <p>Loading reviews…</p>
    </main>
  `)
  assert.deepEqual(await page.evaluate(inspectAdminPageReadiness), {
    ready: false,
    busyCount: 1,
    loadingLabels: ['Loading reviews…'],
  })

  await page.locator('main').evaluate((element) => element.setAttribute('aria-busy', 'false'))
  await page.locator('p').evaluate((element) => { element.hidden = true })
  assert.deepEqual(await page.evaluate(inspectAdminPageReadiness), {
    ready: true,
    busyCount: 0,
    loadingLabels: [],
  })
})

test('classifies empty and populated review, service, and launch-checklist fixtures', async () => {
  await page.setContent('<main><p>No reviews match</p></main>')
  assert.equal(await page.evaluate(classifyAdminFixtureState, '/admin/website/reviews'), 'empty')

  await page.setContent('<main><button id="review-actions-trigger-fixture">Actions</button></main>')
  assert.equal(await page.evaluate(classifyAdminFixtureState, '/admin/website/reviews'), 'populated')

  await page.setContent('<main><p>0 services across 0 categories</p></main>')
  assert.equal(await page.evaluate(classifyAdminFixtureState, '/admin/website/services'), 'empty')

  await page.setContent('<main><a href="/admin/website/services/fixture-service">Edit service</a></main>')
  assert.equal(await page.evaluate(classifyAdminFixtureState, '/admin/website/services'), 'populated')

  await page.setContent('<main><p>No service categories are available yet. Update from Vagaro first.</p></main>')
  assert.equal(await page.evaluate(classifyAdminFixtureState, '/admin/workflows/service-launch'), 'empty')

  await page.setContent('<main><ol aria-label="Service launch checklist"><li>Check booking links</li></ol></main>')
  assert.equal(await page.evaluate(classifyAdminFixtureState, '/admin/workflows/service-launch'), 'populated')
})

test('inspects rendered interaction controls and a drawer contained by the viewport', async () => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.setContent(`
    <div role="dialog" aria-modal="true" style="position:fixed;inset:0;display:flex;flex-direction:column">
      <button aria-label="Close review editor">Close</button>
      <div style="height:1200px;overflow:auto">
        <input name="review-quality-score" value="9">
        <select name="review-tagged-stylist"><option>Studio review</option></select>
        <textarea name="review-editor-notes">Useful note</textarea>
      </div>
      <button>Cancel</button>
      <button>Save changes</button>
    </div>
  `)

  const result = await page.evaluate(inspectAdminInteractionSurface, {
    surfaceSelector: '[role="dialog"]',
    expectedControls: [
      { label: 'Close review editor', selector: 'button[aria-label="Close review editor"]' },
      { label: 'Quality score', selector: 'input[name="review-quality-score"]' },
      { label: 'Stylist', selector: 'select[name="review-tagged-stylist"]' },
      { label: 'Notes', selector: 'textarea[name="review-editor-notes"]' },
      { label: 'Cancel', selector: 'button', textOptions: ['Cancel'] },
      { label: 'Save', selector: 'button', textOptions: ['Save changes'] },
    ],
  })

  assert.equal(result.present, true)
  assert.equal(result.visible, true)
  assert.equal(result.offViewport, false)
  assert.ok(result.controls.every((control) => control.present && control.visible))
})

test('reports off-viewport surfaces plus missing and hidden expected controls', async () => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.setContent(`
    <div id="drawer" style="position:fixed;left:12px;top:0;width:330px;height:800px">
      <button style="display:none">Edit details</button>
    </div>
  `)

  const result = await page.evaluate(inspectAdminInteractionSurface, {
    surfaceSelector: '#drawer',
    expectedControls: [
      { label: 'Edit details', selector: 'button', textOptions: ['Edit details'] },
      { label: 'Cancel', selector: 'button', textOptions: ['Cancel'] },
    ],
  })

  assert.equal(result.offViewport, true)
  assert.deepEqual(result.controls, [
    { label: 'Edit details', present: true, visible: false },
    { label: 'Cancel', present: false, visible: false },
  ])
})

test('document width inspection exposes horizontal overflow diagnostics', async () => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.setContent('<main><div id="wide" style="width:420px">Wide interaction surface</div></main>')

  const dimensions = await page.evaluate(inspectAdminDocumentWidths)
  assert.equal(dimensions.viewportWidth, 320)
  assert.ok(dimensions.documentWidth >= 420)
  assert.ok(dimensions.overflowingElements.some((element) => element.tag === 'div'))
})
