import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTHORITATIVE_STUDIO_COORDINATES,
  DEFAULT_STUDIO_SETTINGS,
  mergeStudioSettings,
} from './studio'

test('the default map marker uses the verified 429 S Coast Hwy parcel', () => {
  assert.deepEqual(DEFAULT_STUDIO_SETTINGS.coordinates, AUTHORITATIVE_STUDIO_COORDINATES)
})

test('the historical intersection pin is normalized without overriding later admin edits', () => {
  assert.deepEqual(
    mergeStudioSettings({ coordinates: { lat: 33.1959, lng: -117.3795 } }).coordinates,
    AUTHORITATIVE_STUDIO_COORDINATES,
  )
  assert.deepEqual(
    mergeStudioSettings({ coordinates: { lat: 33.2, lng: -117.38 } }).coordinates,
    { lat: 33.2, lng: -117.38 },
  )
})
