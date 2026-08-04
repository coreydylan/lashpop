import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const bookingView = readFileSync(
  new URL('../components/service-browser/views/BookingView.tsx', import.meta.url),
  'utf8',
)
const browserContext = readFileSync(
  new URL('../components/service-browser/ServiceBrowserContext.tsx', import.meta.url),
  'utf8',
)

test('the generated Vagaro loader is injected as a script in the required order', () => {
  const appendScript = bookingView.indexOf('vagaroDiv.appendChild(script)')
  const appendContainer = bookingView.indexOf('container.appendChild(vagaroDiv)')

  assert.ok(appendScript >= 0)
  assert.ok(appendContainer > appendScript)
  assert.equal(bookingView.includes('iframe.src = widgetScriptUrl'), false)
})

test('the booking iframe is not sandboxed or rewritten before Vagaro initializes', () => {
  assert.equal(bookingView.includes('installVagaroIframeSandbox'), false)
  assert.equal(bookingView.includes("setAttribute('sandbox'"), false)
  assert.ok(bookingView.includes('widgetContainerRef.current?.replaceChildren()'))
})

test('service selection never guesses another row by a similar name', () => {
  assert.equal(browserContext.includes('normalizeName'), false)
  assert.equal(browserContext.includes('selectedService: service'), true)
})
