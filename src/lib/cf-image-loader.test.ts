import assert from 'node:assert/strict'
import test from 'node:test'
import { cfCroppedImageLoader } from './cf-image-loader'

test('mobile hero requests a real portrait crop with the configured focal point', () => {
  const result = cfCroppedImageLoader({
    src: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/hero-facetune.jpg',
    width: 1200,
    quality: 90,
    aspectRatio: 4 / 9,
    position: { x: 55, y: 40 },
  })
  const url = new URL(result)

  assert.equal(url.hostname, 'lashpop-img.experial.workers.dev')
  assert.equal(url.pathname, '/hero-facetune.jpg')
  assert.equal(url.searchParams.get('w'), '1200')
  assert.equal(url.searchParams.get('h'), '2700')
  assert.equal(url.searchParams.get('fit'), 'cover')
  assert.equal(url.searchParams.get('gx'), '0.55')
  assert.equal(url.searchParams.get('gy'), '0.4')
})

test('crop focal points are clamped to the supported range', () => {
  const result = cfCroppedImageLoader({
    src: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/hero.jpg',
    width: 400,
    aspectRatio: 1,
    position: { x: 200, y: -20 },
  })
  const url = new URL(result)

  assert.equal(url.searchParams.get('gx'), '1')
  assert.equal(url.searchParams.get('gy'), '0')
})
