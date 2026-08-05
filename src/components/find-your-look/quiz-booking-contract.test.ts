import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const modalSource = readFileSync(
  fileURLToPath(new URL('./FindYourLookModal.tsx', import.meta.url)),
  'utf8',
)
const actionSource = readFileSync(
  fileURLToPath(new URL('../../actions/quiz-photos.ts', import.meta.url)),
  'utf8',
)
const browserSource = readFileSync(
  fileURLToPath(new URL('../service-browser/ServiceBrowserContext.tsx', import.meta.url)),
  'utf8',
)

test('quiz buttons use verified widget readiness instead of the retired service-code field', () => {
  assert.ok(actionSource.includes('hasVerifiedVagaroBooking({'))
  assert.ok(actionSource.includes('vagaroWidgetUrl: bookingReady ? r.vagaroWidgetUrl : null'))
  assert.ok(modalSource.includes('disabled={!service.vagaroWidgetUrl}'))
  assert.equal(modalSource.includes('disabled={!service.vagaroServiceCode}'), false)
})

test('quiz booking selects the exact service row by id', () => {
  assert.ok(browserSource.includes('services.find(s => s.id === serviceId)'))
  assert.equal(browserSource.includes('services.find(s => s.slug === serviceSlug)'), false)
})
