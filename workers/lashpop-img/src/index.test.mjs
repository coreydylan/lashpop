import assert from 'node:assert/strict'
import test from 'node:test'

import lashpopImageWorker from './index.js'
import { hostedImageId } from './hosted.js'

function imageStream(bytes = [1, 2, 3]) {
  return new ReadableStream({ start(controller) { controller.enqueue(Uint8Array.from(bytes)); controller.close() } })
}

function installCache({ hit = null } = {}) {
  const writes = []
  const deletes = []
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: { default: {
      match: async () => hit,
      put: async (request, response) => writes.push({ request, response }),
      delete: async (request) => { deletes.push(request); return true },
    } },
  })
  writes.deletes = deletes
  return writes
}

function transformBinding({ contentType = 'image/jpeg', bytes = [10, 11], onTransform, onOutput } = {}) {
  return {
    transform(options) { onTransform?.(options); return this },
    async output(options) {
      onOutput?.(options)
      return { response: () => new Response(Uint8Array.from(bytes), { headers: { 'content-type': contentType } }) }
    },
  }
}

test('loads the deterministic first-party original through the native hosted binding', async () => {
  const writes = installCache()
  const deferred = []
  let requestedImageId
  let hostedInput
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/team.jpg?w=600&q=90&f=jpeg'),
    {
      IMAGE_BACKEND: 'hosted',
      BUCKET: { get: () => assert.fail('hosted delivery must not read R2') },
      IMAGES: {
        hosted: { image(imageId) { requestedImageId = imageId; return { bytes: async () => imageStream() } } },
        input(stream) {
          hostedInput = stream
          return transformBinding({
            onTransform: (options) => assert.deepEqual(options, { fit: 'scale-down', width: 600, sharpen: 1 }),
            onOutput: (options) => assert.deepEqual(options, { format: 'image/jpeg', quality: 90 }),
          })
        },
      },
    },
    { waitUntil: (promise) => deferred.push(promise) },
  )
  const imageId = await hostedImageId({ kind: 'r2', locator: 'uploads/team.jpg' })
  assert.equal(requestedImageId, imageId)
  assert.ok(hostedInput instanceof ReadableStream)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-lp-img-backend'), 'hosted')
  assert.equal(response.headers.get('x-lp-img-source'), 'cloudflare-images')
  assert.equal(response.headers.get('x-lp-img-id'), imageId)
  await Promise.all(deferred)
  assert.equal(writes.length, 1)
  assert.equal(new URL(writes[0].request.url).searchParams.get('lpv'), 'hosted-source-v13-native-binding')
})

test('uses one managed original for dynamic AVIF, WebP, and JPEG widths', async () => {
  const contentTypes = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg' }
  const sourceIds = []
  for (const [format, contentType] of Object.entries(contentTypes)) {
    installCache()
    const response = await lashpopImageWorker.fetch(
      new Request(`https://images.example/uploads/dynamic.jpg?w=1152&f=${format}`),
      {
        IMAGE_BACKEND: 'hosted',
        BUCKET: { get: () => assert.fail('hosted transforms must not read R2') },
        IMAGES: {
          hosted: { image(imageId) { sourceIds.push(imageId); return { bytes: async () => imageStream() } } },
          input: () => transformBinding({
            contentType,
            onTransform: (options) => assert.equal(options.width, 1152),
            onOutput: (options) => assert.equal(options.format, contentType),
          }),
        },
      },
      { waitUntil: () => {} },
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-lp-img-format'), format)
    assert.equal(response.headers.get('content-type'), contentType)
  }
  assert.equal(new Set(sourceIds).size, 1)
  assert.match(sourceIds[0], /^lp\/[a-f0-9]{64}$/)
})

test('dynamically transforms a managed master for a formerly oversized source', async () => {
  installCache()
  let requestedImageId
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/1768945183062-9aaqx-IMG_1858.webp?w=1728&f=avif'),
    {
      IMAGE_BACKEND: 'hosted',
      BUCKET: { get: () => assert.fail('managed master must not read the oversized R2 source') },
      IMAGES: {
        hosted: { image(imageId) { requestedImageId = imageId; return { bytes: async () => imageStream([9]) } } },
        input: () => transformBinding({ contentType: 'image/avif', onTransform: (options) => assert.equal(options.width, 1728) }),
      },
    },
    { waitUntil: () => {} },
  )
  assert.equal(requestedImageId, 'lp/65812e87532b1be2944eacad12bcc22df48e4a06912601e06dc880bbf0548bb3')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-lp-img-backend'), 'hosted')
})

test('fails closed without reading a legacy source when a managed original is missing', async () => {
  const writes = installCache()
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/missing.jpg?w=320'),
    {
      IMAGE_BACKEND: 'hosted',
      BUCKET: { get: () => assert.fail('managed-source misses must not fall back to R2') },
      IMAGES: {
        hosted: { image() { return { async bytes() { const error = new Error('404 image not found'); error.status = 404; throw error } } } },
        input: () => assert.fail('missing sources must not transform'),
      },
    },
    { waitUntil: () => assert.fail('missing sources must not write cache') },
  )
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('x-lp-img-source'), 'cloudflare-images')
  assert.equal(response.headers.get('x-lp-img-error'), 'hosted-not-found')
  assert.equal(writes.length, 0)
})

test('does not permit a query string to escape the hosted first-party path', async () => {
  installCache()
  let hostedCalls = 0
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/team.jpg?w=320&backend=legacy'),
    {
      IMAGE_BACKEND: 'hosted',
      BUCKET: { get: () => assert.fail('query strings cannot force R2') },
      IMAGES: {
        hosted: { image() { hostedCalls += 1; return { bytes: async () => imageStream() } } },
        input: () => transformBinding({ contentType: 'image/webp' }),
      },
    },
    { waitUntil: () => {} },
  )
  assert.equal(hostedCalls, 1)
  assert.equal(response.headers.get('x-lp-img-backend'), 'hosted')
})

test('keeps allow-listed booking-provider imagery external and clearly labeled', async () => {
  installCache()
  const previousFetch = globalThis.fetch
  let upstream
  globalThis.fetch = async (input) => { upstream = String(input); return new Response(imageStream(), { headers: { 'content-type': 'image/jpeg' } }) }
  try {
    const source = 'https://images.ssl.cf2.rackcdn.com/Original/team.jpeg'
    const response = await lashpopImageWorker.fetch(
      new Request(`https://images.example/ext?url=${encodeURIComponent(source)}&w=320`),
      {
        IMAGE_BACKEND: 'hosted',
        BUCKET: { get: () => assert.fail('external imagery must not read R2') },
        IMAGES: {
          hosted: { image: () => assert.fail('external imagery is not a first-party hosted master') },
          input: () => transformBinding({ contentType: 'image/webp' }),
        },
      },
      { waitUntil: () => {} },
    )
    assert.equal(upstream, source)
    assert.equal(response.headers.get('x-lp-img-backend'), 'external')
    assert.equal(response.headers.get('x-lp-img-source'), 'vagaro-rackcdn')
    assert.equal(response.headers.get('cache-control'), 'public, max-age=86400, stale-while-revalidate=3600')
  } finally { globalThis.fetch = previousFetch }
})

test('rejects arbitrary external origins', async () => {
  installCache()
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/ext?url=https%3A%2F%2Fexample.com%2Fimage.jpg&w=320'),
    { IMAGE_BACKEND: 'hosted', IMAGES: { input: () => assert.fail('rejected origins must not transform') } },
    { waitUntil: () => {} },
  )
  assert.equal(response.status, 403)
})

test('reports actual output when Cloudflare falls back from requested AVIF', async () => {
  installCache()
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/team.jpg?w=1728&f=avif'),
    {
      IMAGE_BACKEND: 'hosted',
      IMAGES: {
        hosted: { image: () => ({ bytes: async () => imageStream() }) },
        input: () => transformBinding({ contentType: 'image/webp' }),
      },
    },
    { waitUntil: () => {} },
  )
  assert.equal(response.headers.get('content-type'), 'image/webp')
  assert.equal(response.headers.get('x-lp-img-format'), 'webp')
  assert.equal(response.headers.get('x-lp-img-requested-format'), 'avif')
})

test('returns an uncached 502 for a transform failure', async () => {
  const writes = installCache()
  const previousConsoleError = console.error
  console.error = () => {}
  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/team.jpg?w=256'),
      {
        IMAGE_BACKEND: 'hosted',
        IMAGES: {
          hosted: { image: () => ({ bytes: async () => imageStream() }) },
          input: () => ({ transform() { return this }, async output() { throw new Error('binding rejected input') } }),
        },
      },
      { waitUntil: () => assert.fail('failed transforms must not write cache') },
    )
    assert.equal(response.status, 502)
    assert.equal(response.headers.get('x-lp-img-error'), 'transform-failed')
    assert.equal(writes.length, 0)
  } finally { console.error = previousConsoleError }
})

test('serves production cached variants without touching sources', async () => {
  installCache({ hit: new Response(Uint8Array.from([7]), { headers: { 'content-type': 'image/webp' } }) })
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/team.jpg?w=320'),
    {
      IMAGE_BACKEND: 'hosted',
      BUCKET: { head: () => assert.fail('cache hits must not read R2') },
      IMAGES: {
        hosted: { image: () => assert.fail('cache hits must not read Hosted Images') },
        input: () => assert.fail('cache hits must not transform'),
      },
    },
    { waitUntil: () => assert.fail('cache hits must not write cache') },
  )
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [7])
})

test('evicts an isolated cached transform after its hosted source is deleted', async () => {
  const activity = installCache({ hit: new Response(Uint8Array.from([7])) })
  const deferred = []
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/deleted.jpg?w=320'),
    {
      IMAGE_BACKEND: 'hosted',
      VERIFY_SOURCE_ON_CACHE_HIT: 'true',
      BUCKET: { head: () => assert.fail('hosted verification must not read R2') },
      IMAGES: {
        hosted: { image() { return { async details() { const error = new Error('404 image not found'); error.status = 404; throw error } } } },
        input: () => assert.fail('deleted cached sources must not transform'),
      },
    },
    { waitUntil: (promise) => deferred.push(promise) },
  )
  assert.equal(response.status, 404)
  await Promise.all(deferred)
  assert.equal(activity.deletes.length, 1)
})

test('keeps private R2 prefixes unreachable in rollback mode', async () => {
  installCache()
  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/backups/private.sql?w=320'),
    { IMAGE_BACKEND: 'legacy', BUCKET: { get: () => assert.fail('private keys must not be read') } },
    { waitUntil: () => {} },
  )
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})
