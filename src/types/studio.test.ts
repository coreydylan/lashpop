import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_STUDIO_SETTINGS, mergeStudioSettings } from './studio'

test('the default map pin matches the configured 429 S Coast Hwy address', () => {
  assert.deepEqual(DEFAULT_STUDIO_SETTINGS.address, {
    street: '429 S Coast Hwy',
    city: 'Oceanside',
    state: 'CA',
    zip: '92054',
  })
  assert.deepEqual(DEFAULT_STUDIO_SETTINGS.coordinates, {
    lat: 33.1913757,
    lng: -117.3758363,
  })
})

test('stored studio settings can still intentionally override the default pin', () => {
  assert.deepEqual(
    mergeStudioSettings({ coordinates: { lat: 33.2, lng: -117.4 } }).coordinates,
    { lat: 33.2, lng: -117.4 },
  )
})

test('the known stale intersection pin is corrected when the configured address matches', () => {
  assert.deepEqual(
    mergeStudioSettings({
      address: {
        street: '429 S Coast Hwy',
        city: 'Oceanside',
        state: 'CA',
        zip: '92054',
      },
      coordinates: { lat: 33.1959, lng: -117.3795 },
    }).coordinates,
    DEFAULT_STUDIO_SETTINGS.coordinates,
  )
})
