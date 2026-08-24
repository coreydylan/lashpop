import assert from 'node:assert/strict'
import test from 'node:test'

import lashpopImageWorker from './index.js'

function imageStream(bytes = [1, 2, 3]) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(Uint8Array.from(bytes))
      controller.close()
    },
  })
}

function installCache({ hit = null } = {}) {
  const writes = []
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: {
      default: {
        match: async () => hit,
        put: async (request, response) => {
          writes.push({ request, response })
        },
      },
    },
  })
  return writes
}

test('streams R2 bytes through the Images binding and versions the cache key', async () => {
  const writes = installCache()
  const deferred = []
  let receivedInput
  let receivedTransform
  let receivedOutput

  const transformer = {
    transform(options) {
      receivedTransform = options
      return this
    },
    async output(options) {
      receivedOutput = options
      return {
        response() {
          return new Response(Uint8Array.from([8, 9]), {
            headers: { 'content-type': 'image/avif' },
          })
        },
      }
    },
  }

  const env = {
    BUCKET: {
      async get() {
        return {
          body: imageStream(),
          httpMetadata: { contentType: 'image/jpeg' },
        }
      },
    },
    IMAGES: {
      input(stream) {
        receivedInput = stream
        return transformer
      },
    },
  }
  const ctx = {
    waitUntil(promise) {
      deferred.push(promise)
    },
  }

  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/team.jpg?w=600&q=90', {
      headers: { accept: 'image/avif,image/webp,*/*' },
    }),
    env,
    ctx,
  )

  assert.ok(receivedInput instanceof ReadableStream)
  assert.deepEqual(receivedTransform, {
    fit: 'scale-down',
    width: 600,
    sharpen: 1,
  })
  assert.deepEqual(receivedOutput, { format: 'image/avif', quality: 90 })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/avif')
  assert.equal(response.headers.get('x-lp-img-format'), 'avif')
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [8, 9])

  await Promise.all(deferred)
  assert.equal(writes.length, 1)
  const cacheUrl = new URL(writes[0].request.url)
  assert.equal(cacheUrl.searchParams.get('fmt'), 'avif')
  assert.equal(cacheUrl.searchParams.get('dpr'), '1')
  assert.equal(cacheUrl.searchParams.get('lpv'), 'stream-input-v2')
})

test('returns an uncached 502 instead of disguising a transform failure as an optimized image', async () => {
  const writes = installCache()
  const deferred = []
  const logged = []
  const previousConsoleError = console.error
  console.error = (message) => logged.push(message)

  const env = {
    BUCKET: {
      async get() {
        return {
          body: imageStream([4, 5, 6]),
          httpMetadata: { contentType: 'image/jpeg' },
        }
      },
    },
    IMAGES: {
      input(stream) {
        assert.ok(stream instanceof ReadableStream)
        return {
          transform() {
            return this
          },
          async output() {
            throw new Error('binding rejected input')
          },
        }
      },
    },
  }

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/team.jpg?w=256', {
        headers: { accept: 'image/webp,*/*' },
      }),
      env,
      { waitUntil: (promise) => deferred.push(promise) },
    )

    assert.equal(response.status, 502)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(response.headers.get('x-lp-img-error'), 'transform-failed')
    assert.equal(await response.text(), 'Image transformation failed')
    assert.equal(writes.length, 0)
    assert.equal(deferred.length, 0)
    assert.equal(logged.length, 1)
    assert.match(logged[0], /image transformation failed/)
    assert.match(logged[0], /binding rejected input/)
  } finally {
    console.error = previousConsoleError
  }
})

test('serves cached variants without touching source bindings', async () => {
  const cached = new Response(Uint8Array.from([7]), {
    headers: {
      'content-type': 'image/webp',
      'x-lp-img-format': 'webp',
    },
  })
  installCache({ hit: cached })

  const response = await lashpopImageWorker.fetch(
    new Request('https://images.example/uploads/team.jpg?w=320', {
      headers: { accept: 'image/webp,*/*' },
    }),
    {
      BUCKET: { get: () => assert.fail('cache hit should not read R2') },
      IMAGES: { input: () => assert.fail('cache hit should not transform') },
    },
    { waitUntil: () => assert.fail('cache hit should not write cache') },
  )

  assert.equal(response.headers.get('content-type'), 'image/webp')
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [7])
})
