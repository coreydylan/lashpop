import assert from 'node:assert/strict'
import test from 'node:test'
import { hasBookingConfiguration, serviceSyncHealthError } from './booking-health'

test('accepts either an exact widget URL or a service code', () => {
  assert.equal(hasBookingConfiguration({ vagaroWidgetUrl: 'https://www.vagaro.com/widget' }), true)
  assert.equal(hasBookingConfiguration({ vagaroServiceCode: '6fWR0' }), true)
  assert.equal(hasBookingConfiguration({ vagaroWidgetUrl: '  ', vagaroServiceCode: null }), false)
})

test('summarizes failures, active gaps, and fail-closed new services', () => {
  assert.equal(
    serviceSyncHealthError({
      failed: 1,
      bookingMisconfigured: ['Legacy Fill'],
      bookingPending: ['New Service'],
    }),
    '1 service record(s) failed | ' +
      '1 active service(s) lack booking configuration: Legacy Fill | ' +
      '1 new service(s) are hidden pending booking configuration: New Service'
  )
})

test('reports healthy service syncs without an error', () => {
  assert.equal(
    serviceSyncHealthError({
      failed: 0,
      bookingMisconfigured: [],
      bookingPending: [],
    }),
    null
  )
})
