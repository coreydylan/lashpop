import assert from 'node:assert/strict'
import test from 'node:test'
import tattooSnapshots from '../../../tests/fixtures/vagaro-tattoo-mappings.json'
import { resolveVagaroServiceWidgetUrl } from '../../../src/lib/vagaro-widget'
import { getBookingConfigurationIssue, hasBookingConfiguration, serviceSyncHealthError } from './booking-health'

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
      serviceName: 'Tiny Tattoos',
      serviceCategory: 'Tiny Tattoos',
    }),
    true,
  )
  assert.equal(
    hasBookingConfiguration({
      vagaroServiceId: known,
      vagaroWidgetUrl: verifiedUrl,
      serviceName: 'Tiny Tattoos',
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

test('a missing manifest entry is configuration evidence, independent of launcher validity', () => {
  for (const mapping of tattooSnapshots.mappings) {
    const service = {
      vagaroServiceId: mapping.vagaroServiceId,
      vagaroWidgetUrl: mapping.widgetUrl,
      serviceName: mapping.name,
      serviceCategory: mapping.category,
    }
    assert.equal(resolveVagaroServiceWidgetUrl({ widgetUrl: mapping.widgetUrl }), mapping.widgetUrl)
    assert.equal(getBookingConfigurationIssue(service, []), 'missing-manifest-entry')
    assert.equal(getBookingConfigurationIssue(service, tattooSnapshots.mappings), null)
    // A newer verified manifest may resolve metadata drift; it proves no live runtime outcome.
    assert.ok(serviceSyncHealthError({ failed: 0, bookingMisconfigured: [mapping.name], bookingPending: [] }))
  }
})

test('diagnosis keeps swapped loaders, identity drift, and invalid links distinct', () => {
  const [one, three] = tattooSnapshots.mappings
  const service = {
    vagaroServiceId: one.vagaroServiceId,
    vagaroWidgetUrl: one.widgetUrl,
    serviceName: one.name,
    serviceCategory: one.category,
  }
  assert.equal(getBookingConfigurationIssue({ ...service, vagaroWidgetUrl: three.widgetUrl }, tattooSnapshots.mappings), 'url-mismatch')
  assert.equal(getBookingConfigurationIssue({ ...service, serviceName: three.name }, tattooSnapshots.mappings), 'identity-drift')
  assert.equal(getBookingConfigurationIssue({ ...service, vagaroWidgetUrl: 'https://www.vagaro.com/lashpop32/book-now?ServiceId=41101423' }, tattooSnapshots.mappings), 'invalid-loader')
})
