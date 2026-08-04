import assert from 'node:assert/strict'
import test from 'node:test'
import { hasBookingConfiguration, serviceSyncHealthError } from './booking-health'

const GENERATED_LOADER =
  'https://www.vagaro.com//resources/WidgetEmbeddedLoader/example6fWR0?v=service-token#'

test('accepts only a complete generated Vagaro loader URL', () => {
  assert.equal(hasBookingConfiguration({ vagaroWidgetUrl: GENERATED_LOADER }), true)
  assert.equal(hasBookingConfiguration({ vagaroWidgetUrl: 'https://www.vagaro.com/widget' }), false)
  assert.equal(hasBookingConfiguration({ vagaroServiceCode: '6fWR0' }), false)
  assert.equal(
    hasBookingConfiguration({
      vagaroWidgetUrl:
        'https://www.vagaro.com/Users/BusinessWidget.aspx?WidgetServiceId=0&ServiceID=35729654',
    }),
    false,
  )
  assert.equal(
    hasBookingConfiguration({
      vagaroWidgetUrl: 'https://www.vagaro.com/lashpop32/book-now?ServiceId=35729654',
    }),
    false,
  )
  assert.equal(
    hasBookingConfiguration({
      vagaroWidgetUrl:
        'https://www.vagaro.com//resources/WidgetEmbeddedLoader/example6fWR0',
    }),
    false,
  )
})

test('rejects an unverified loader when a numeric Vagaro service id is known', () => {
  assert.equal(
    hasBookingConfiguration({
      vagaroServiceId: '35729654',
      vagaroWidgetUrl: GENERATED_LOADER,
    }),
    false,
  )
})

test('rejects identity drift for an otherwise verified loader', () => {
  const known = '35729654'
  const verifiedUrl =
    'https://www.vagaro.com//resources/WidgetEmbeddedLoader/OZqsEJatCoPqFJ1y6BuPFXcz3Hy6puSdBuOc1WJD1wOc1WO61Ctdg4tjxMG9pUxapkUcvCu7gCmjZcoapOUc9CvdfQOapkvdfYPcHiPce?v=swlN4y3YLvFyVk4lRpyjUo28ODY4nm8e760Wz8N2GInm#'

  assert.equal(
    hasBookingConfiguration({
      vagaroServiceId: known,
      vagaroWidgetUrl: verifiedUrl,
      serviceName: 'Fine Line Tattoos',
      serviceCategory: 'Fine Line Tattoos',
    }),
    true,
  )
  assert.equal(
    hasBookingConfiguration({
      vagaroServiceId: known,
      vagaroWidgetUrl: verifiedUrl,
      serviceName: 'Fine Line Tattoos',
      serviceCategory: 'Moved Category',
    }),
    false,
  )
})

test('summarizes failures, active gaps, and fail-closed new services', () => {
  assert.equal(
    serviceSyncHealthError({
      failed: 1,
      bookingMisconfigured: ['Legacy Fill'],
      bookingPending: ['New Service'],
    }),
    '1 service record(s) failed | ' +
      '1 active service(s) lack a verified Vagaro loader URL: Legacy Fill | ' +
      '1 new service(s) are hidden pending a verified Vagaro loader URL: New Service'
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
