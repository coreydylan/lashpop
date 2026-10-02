import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyBookingRuntime, loaderRequestMatches } from './vagaro-booking-evidence'

test('provider errors outrank a matching service name or generic menu', () => {
  assert.equal(classifyBookingRuntime({
    providerErrors: ['getwidgetservices: net::ERR_FAILED'],
    selectedServiceVisible: true,
    unrelatedServiceVisible: false,
  }), 'provider-runtime-blocked')
})

test('only an unblocked scoped screen confirms service selection', () => {
  assert.equal(classifyBookingRuntime({ providerErrors: [], selectedServiceVisible: true, unrelatedServiceVisible: true }), 'selection-unconfirmed')
  assert.equal(classifyBookingRuntime({ providerErrors: [], selectedServiceVisible: false, unrelatedServiceVisible: false }), 'selection-unconfirmed')
  assert.equal(classifyBookingRuntime({ providerErrors: [], selectedServiceVisible: true, unrelatedServiceVisible: false }), 'service-selection-confirmed')
})

test('network comparison ignores fragments while preserving opaque paths and version tokens', () => {
  const loader = 'https://www.vagaro.com//resources/WidgetEmbeddedLoader/opaque?v=original#'
  assert.equal(loaderRequestMatches(loader, loader.slice(0, -1)), true)
  assert.equal(loaderRequestMatches(loader, loader.replace('original', 'different')), false)
  assert.equal(loaderRequestMatches(loader, loader.replace('opaque', 'another')), false)
  assert.equal(loaderRequestMatches(loader, loader.replace('//resources', '/resources')), false)
})
