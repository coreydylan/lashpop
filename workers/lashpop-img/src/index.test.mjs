import assert from 'node:assert/strict'
import test from 'node:test'

import lashpopImageWorker from './index.js'
import { hostedImageId } from './hosted.js'

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
  assert.equal(response.headers.get('x-lp-img-backend'), 'legacy')
  assert.equal(response.headers.get('x-lp-img-format'), 'avif')
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [8, 9])

  await Promise.all(deferred)
  assert.equal(writes.length, 1)
  const cacheUrl = new URL(writes[0].request.url)
  assert.equal(cacheUrl.searchParams.get('fmt'), 'avif')
  assert.equal(cacheUrl.searchParams.get('dpr'), '1')
  assert.equal(cacheUrl.searchParams.get('lp-backend'), 'legacy')
  assert.equal(cacheUrl.searchParams.get('lpv'), 'hosted-source-v7-final')
})

test('streams the deterministic Hosted Images original through the identical transform binding', async () => {
  const writes = installCache()
  const deferred = []
  const previousFetch = globalThis.fetch
  let deliveryUrl

  globalThis.fetch = async (input) => {
    deliveryUrl = String(input)
    return new Response(imageStream([1, 2, 3]), {
      headers: { 'content-type': 'image/jpeg' },
    })
  }

  let hostedInput
  const transformer = {
    transform() { return this },
    async output() {
      return {
        response: () => new Response(Uint8Array.from([10, 11]), {
          headers: { 'content-type': 'image/avif' },
        }),
      }
    },
  }

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/team.jpg?w=600&q=90&f=jpeg', {
        headers: { accept: 'image/jpeg' },
      }),
      {
        IMAGE_BACKEND: 'hosted',
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_IMAGES_API_TOKEN: 'images-token',
        BUCKET: { get: () => assert.fail('hosted hit should not read R2') },
        IMAGES: {
          input(stream) {
            hostedInput = stream
            return transformer
          },
        },
      },
      { waitUntil: (promise) => deferred.push(promise) },
    )

    const imageId = await hostedImageId({ kind: 'r2', locator: 'uploads/team.jpg' })
    assert.match(deliveryUrl, new RegExp(`/accounts/account-id/images/v1/${encodeURIComponent(imageId)}/blob$`))
    assert.ok(hostedInput instanceof ReadableStream)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-lp-img-backend'), 'hosted')
    assert.equal(response.headers.get('x-lp-img-id'), imageId)
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [10, 11])

    await Promise.all(deferred)
    assert.equal(writes.length, 1)
    assert.equal(new URL(writes[0].request.url).searchParams.get('lp-backend'), 'hosted')
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('falls through to legacy transformation without caching when Hosted Images misses', async () => {
  const writes = installCache()
  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('missing', { status: 404 })

  const transformer = {
    transform() {
      return this
    },
    async output() {
      return {
        response() {
          return new Response(Uint8Array.from([12]), {
            headers: { 'content-type': 'image/webp' },
          })
        },
      }
    },
  }

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/team.jpg?w=320', {
        headers: { accept: 'image/webp,*/*' },
      }),
      {
        IMAGE_BACKEND: 'hosted',
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_IMAGES_API_TOKEN: 'images-token',
        BUCKET: {
          async get() {
            return {
              body: imageStream(),
              httpMetadata: { contentType: 'image/jpeg' },
            }
          },
        },
        IMAGES: { input: () => transformer },
      },
      { waitUntil: () => assert.fail('fallback must not be pinned in cache') },
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-lp-img-backend'), 'legacy')
    assert.equal(response.headers.get('x-lp-img-fallback'), 'hosted-http-404')
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=60')
    assert.equal(writes.length, 0)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('request override can force legacy during a hosted rollout', async () => {
  installCache()
  const previousFetch = globalThis.fetch
  globalThis.fetch = () => assert.fail('legacy override should not fetch Hosted Images')

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/team.jpg?w=320&backend=legacy'),
      {
        IMAGE_BACKEND: 'hosted',
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_IMAGES_API_TOKEN: 'images-token',
        BUCKET: {
          async get() {
            return {
              body: imageStream(),
              httpMetadata: { contentType: 'image/jpeg' },
            }
          },
        },
        IMAGES: {
          input() {
            return {
              transform() { return this },
              async output() {
                return { response: () => new Response(Uint8Array.from([13])) }
              },
            }
          },
        },
      },
      { waitUntil: () => {} },
    )

    assert.equal(response.headers.get('x-lp-img-backend'), 'legacy')
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('repairs a legacy decode failure from the normalized hosted original', async () => {
  installCache()
  const previousFetch = globalThis.fetch
  let transformAttempt = 0
  globalThis.fetch = async () => new Response(imageStream([9]), {
    headers: { 'content-type': 'image/png' },
  })

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/mislabeled.webp?w=600&backend=legacy'),
      {
        IMAGE_BACKEND: 'legacy',
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_IMAGES_API_TOKEN: 'images-token',
        BUCKET: {
          async get() {
            return {
              body: imageStream([1]),
              httpMetadata: { contentType: 'image/webp' },
            }
          },
        },
        IMAGES: {
          input() {
            transformAttempt += 1
            return {
              transform() { return this },
              async output() {
                if (transformAttempt === 1) throw new Error('legacy decode failed')
                return { response: () => new Response(Uint8Array.from([14])) }
              },
            }
          },
        },
      },
      { waitUntil: () => {} },
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-lp-img-backend'), 'hosted-repair')
    assert.equal(transformAttempt, 2)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('unwraps a precomputed AVIF variant for an oversized exact-parity source', async () => {
  installCache()
  const previousFetch = globalThis.fetch
  const payload = Buffer.from([1, 2, 3]).toString('base64')
  globalThis.fetch = async () => new Response(
    `<svg xmlns="http://www.w3.org/2000/svg"><metadata id="lp-exact" data-mime="image/avif">${payload}</metadata></svg>`,
    { headers: { 'content-type': 'image/svg+xml' } },
  )

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/1768945183062-9aaqx-IMG_1858.webp?w=600&q=90&backend=hosted', {
        headers: { accept: 'image/avif,image/webp,*/*' },
      }),
      {
        IMAGE_BACKEND: 'hosted',
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_IMAGES_API_TOKEN: 'images-token',
        BUCKET: { get: () => assert.fail('precomputed hit should not read R2') },
        IMAGES: { input: () => assert.fail('precomputed hit should not transform again') },
      },
      { waitUntil: () => {} },
    )

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/avif')
    assert.equal(response.headers.get('x-lp-img-backend'), 'hosted')
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3])
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('serves a pinned AVIF variant for a normal hosted source', async () => {
  installCache()
  const env = {
    IMAGE_BACKEND: 'hosted',
    CLOUDFLARE_ACCOUNT_ID: 'account-id',
    CLOUDFLARE_IMAGES_API_TOKEN: 'images-token',
    BUCKET: { get: () => assert.fail('pinned hit should not read R2') },
    IMAGES: { input: () => assert.fail('pinned hit should not transform again') },
  }
  const variantBytes = Uint8Array.from([0, 0, 0, 28, 102, 116, 121, 112, 97, 118, 105, 102])
  const wrapper = `<svg xmlns="http://www.w3.org/2000/svg"><metadata id="lp-exact" data-mime="image/avif">${Buffer.from(variantBytes).toString('base64')}</metadata></svg>`
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
    const url = String(input)
    assert.match(url, /\/images\/v1\/lpv%2F/)
    return new Response(wrapper, { headers: { 'content-type': 'image/svg+xml' } })
  }

  try {
    const response = await lashpopImageWorker.fetch(
      new Request('https://images.example/uploads/team.jpg?w=600&f=avif', {
        headers: { accept: 'image/avif' },
      }),
      env,
      { waitUntil: () => {} },
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('x-lp-img-backend'), 'hosted')
    assert.equal(response.headers.get('content-type'), 'image/avif')
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), variantBytes)
  } finally {
    globalThis.fetch = originalFetch
  }
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
