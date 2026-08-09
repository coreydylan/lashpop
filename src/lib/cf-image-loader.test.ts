import assert from 'node:assert/strict'
import test from 'node:test'
import { cfPortraitImageLoader } from './cf-image-loader'

test('mobile hero requests an oversampled full frame without baking in a crop', () => {
  const result = cfPortraitImageLoader({
    src: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/hero-facetune.jpg',
    width: 1200,
    quality: 90,
    aspectRatio: 4 / 9,
  })
  const url = new URL(result)

  assert.equal(url.hostname, 'lashpop-img.experial.workers.dev')
  assert.equal(url.pathname, '/hero-facetune.jpg')
  assert.equal(url.searchParams.get('w'), '3840')
  assert.equal(url.searchParams.get('h'), null)
  assert.equal(url.searchParams.get('fit'), null)
  assert.equal(url.searchParams.get('gx'), null)
  assert.equal(url.searchParams.get('gy'), null)
})

test('smaller portrait candidates scale enough for common landscape sources', () => {
  const result = cfPortraitImageLoader({
    src: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/hero.jpg',
    width: 256,
    aspectRatio: 4 / 9,
  })
  const url = new URL(result)

  assert.equal(url.searchParams.get('w'), '1152')
})
