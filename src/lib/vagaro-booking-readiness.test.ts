import assert from 'node:assert/strict'
import test from 'node:test'
import widgetManifest from '../../workers/vagaro-sync/src/vagaro-widget-manifest.json'
import {
  getVagaroBookingStatus,
  hasVerifiedVagaroBooking,
} from './vagaro-booking-readiness'

const verified = widgetManifest.mappings[0]

test('accepts the exact service identity and generated loader snapshot', () => {
  assert.equal(
    hasVerifiedVagaroBooking({
      vagaroServiceId: verified.vagaroServiceId,
      name: verified.name,
      category: verified.category,
      widgetUrl: verified.widgetUrl,
    }),
    true,
  )
})

test('marks a newly discovered service as pending', () => {
  assert.equal(
    getVagaroBookingStatus({
      vagaroServiceId: '999999999',
      name: 'Brand New Service',
      category: 'Lashes',
      widgetUrl: null,
    }),
    'pending',
  )
})

test('does not report an inactive legacy encoded ID as a new pending service', () => {
  assert.equal(
    getVagaroBookingStatus({
      vagaroServiceId: 'legacy~encoded==',
      name: 'Retired Service',
      category: 'Legacy',
      isActive: false,
    }),
    'retired',
  )
})

test('fails closed when Vagaro renames or moves a mapped service', () => {
  assert.equal(
    getVagaroBookingStatus({
      vagaroServiceId: verified.vagaroServiceId,
      name: verified.name,
      category: `${verified.category} moved`,
      widgetUrl: verified.widgetUrl,
    }),
    'identity-drift',
  )
})

test('fails closed when a different valid-looking loader is stored', () => {
  const different = widgetManifest.mappings[1]
  assert.equal(
    getVagaroBookingStatus({
      vagaroServiceId: verified.vagaroServiceId,
      name: verified.name,
      category: verified.category,
      widgetUrl: different.widgetUrl,
    }),
    'url-mismatch',
  )
})
