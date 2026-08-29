import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import cfImageLoader, { cfPortraitImageLoader } from './cf-image-loader'

const DIRECT_ORIGIN = 'imagedelivery.net'

function directFor(canonical: string) {
  const imageId = `lp/${createHash('sha256').update(canonical).digest('hex')}`
  return `https://imagedelivery.net/zXebLwufc8AGAQU5E9oXHw/${imageId}/public`
}

test('repository rasters use direct Cloudflare Images flexible variants', () => {
  const result = cfImageLoader({
    src: '/lashpop-images/studio/hero-facetune.jpg',
    width: 600,
  })
  const url = new URL(result)

  assert.equal(url.hostname, DIRECT_ORIGIN)
  assert.match(url.pathname, /\/lp\/[a-f0-9]{64}\/w=600,q=90,fit=scale-down,metadata=none$/)
})

test('already-direct delivery URLs preserve their image id and replace only the variant', () => {
  const result = cfImageLoader({
    src: 'https://imagedelivery.net/zXebLwufc8AGAQU5E9oXHw/lp/abc/public',
    width: 1440,
    quality: 85,
  })
  const url = new URL(result)

  assert.equal(url.hostname, DIRECT_ORIGIN)
  assert.equal(url.pathname, '/zXebLwufc8AGAQU5E9oXHw/lp/abc/w=1440,q=85,fit=scale-down,metadata=none')
})

test('direct R2 and Vagaro delivery URLs never use the image Worker', () => {
  for (const source of [
    directFor('r2:uploads/classic.jpg'),
    directFor('ext:https://example.ssl.cf2.rackcdn.com/Original/staff.jpg'),
  ]) {
    const url = new URL(cfImageLoader({ src: source, width: 600 }))
    assert.equal(url.hostname, DIRECT_ORIGIN)
    assert.match(url.pathname, /\/lp\/[a-f0-9]{64}\/w=600,q=90,fit=scale-down,metadata=none$/)
  }
})

test('mobile hero requests an oversampled direct full frame without baking in a crop', () => {
  const result = cfPortraitImageLoader({
    src: '/lashpop-images/studio/hero-facetune.jpg',
    width: 1200,
    quality: 90,
    aspectRatio: 4 / 9,
  })
  const url = new URL(result)

  assert.equal(url.hostname, DIRECT_ORIGIN)
  assert.match(url.pathname, /\/w=3840,q=90,fit=scale-down,metadata=none$/)
  assert.equal(url.search, '')
})

test('smaller portrait candidates scale enough for common landscape sources', () => {
  const result = cfPortraitImageLoader({
    src: '/lashpop-images/studio/hero-facetune.jpg',
    width: 256,
    aspectRatio: 4 / 9,
  })

  assert.match(new URL(result).pathname, /\/w=1152,q=90,fit=scale-down,metadata=none$/)
})

test('vectors stay local and never require a hosted raster mapping', () => {
  assert.equal(
    cfImageLoader({ src: '/lashpop-images/services/thin/lashes-icon.svg', width: 256 }),
    '/lashpop-images/services/thin/lashes-icon.svg',
  )
})

test('an unregistered site raster fails closed instead of falling back to the app origin', () => {
  assert.throws(
    () => cfImageLoader({ src: '/lashpop-images/missing-public-raster.png', width: 320 }),
    /missing from the Cloudflare Images manifest/,
  )
})
