import assert from 'node:assert/strict'
import test from 'node:test'
import { cfPortraitImageLoader, getImageWorkerBase } from './cf-image-loader'

test('feature preview points all optimized images at the isolated hosted worker', async () => {
  const previousBase = process.env.NEXT_PUBLIC_IMAGE_WORKER_BASE
  process.env.NEXT_PUBLIC_IMAGE_WORKER_BASE = 'https://lashpop-img-preview.experial.workers.dev/'

  try {
    const { default: cfImageLoader } = await import('./cf-image-loader')
    const result = cfImageLoader({
      src: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/classic.jpg',
      width: 600,
    })
    const url = new URL(result)

    assert.equal(url.hostname, 'lashpop-img-preview.experial.workers.dev')
    assert.equal(url.searchParams.get('backend'), null)
    assert.equal(url.searchParams.get('w'), '600')
    assert.equal(url.searchParams.get('q'), '90')
  } finally {
    if (previousBase === undefined) delete process.env.NEXT_PUBLIC_IMAGE_WORKER_BASE
    else process.env.NEXT_PUBLIC_IMAGE_WORKER_BASE = previousBase
  }
})

test('mobile hero requests an oversampled full frame without baking in a crop', () => {
  const result = cfPortraitImageLoader({
    src: 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/hero-facetune.jpg',
    width: 1200,
    quality: 90,
    aspectRatio: 4 / 9,
  })
  const url = new URL(result)

  assert.equal(url.hostname, new URL(getImageWorkerBase()).hostname)
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
