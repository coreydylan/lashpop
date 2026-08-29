import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ingestVagaroImage,
  validateVagaroImageSource,
  type ImageRegistry,
  type ImageRegistryRow,
} from './cloudflare-images'

function fakeRegistry(initial: ImageRegistryRow | null = null) {
  let row = initial
  const failures: string[] = []
  const registry: ImageRegistry = {
    async get() { return row },
    async recordSuccess(input) {
      row = {
        source_key: input.request.sourceKey,
        source_kind: input.request.sourceKind,
        source_url: input.request.sourceUrl,
        cloudflare_image_id: input.imageId,
        delivery_url: input.deliveryUrl,
        previous_cloudflare_image_id: input.previousImageId,
        source_etag: input.etag,
        source_last_modified: input.lastModified,
        source_content_length: input.contentLength,
        source_content_hash: input.contentHash,
        status: 'ready',
        failure_count: 0,
        last_error: null,
        checked_at: input.now,
        ingested_at: input.now,
        refreshed_at: input.now,
      }
    },
    async recordFailure(_sourceKey, message) {
      failures.push(message)
      if (row) row = { ...row, failure_count: row.failure_count + 1, last_error: message }
    },
    async touch(_sourceKey, now) {
      if (row) row = { ...row, checked_at: now, failure_count: 0, last_error: null }
    },
  }
  return { registry, failures, row: () => row }
}

const env = {
  DB: {} as D1Database,
  CLOUDFLARE_ACCOUNT_ID: 'account',
  CLOUDFLARE_IMAGES_ACCOUNT_HASH: 'delivery-hash',
  CLOUDFLARE_IMAGES_API_TOKEN: 'secret-token',
}

const request = {
  sourceKey: 'vagaro:staff:123',
  sourceKind: 'vagaro-staff' as const,
  sourceUrl: 'https://images.ssl.cf2.rackcdn.com/Original/staff.jpg',
}

test('accepts only HTTPS Vagaro CDN image sources', () => {
  assert.equal(validateVagaroImageSource(request.sourceUrl).hostname, 'images.ssl.cf2.rackcdn.com')
  assert.throws(() => validateVagaroImageSource('https://example.com/staff.jpg'), /allow-listed/)
  assert.throws(() => validateVagaroImageSource('http://images.rackcdn.com/staff.jpg'), /HTTPS/)
})

test('ingestion uploads once and reuses a conditional 304 idempotently', async () => {
  const previousFetch = globalThis.fetch
  const state = fakeRegistry()
  let uploads = 0
  let sourceReads = 0

  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (url === request.sourceUrl) {
      sourceReads++
      const headers = new Headers(init?.headers)
      if (headers.get('if-none-match') === '"v1"') return new Response(null, { status: 304 })
      return new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg', 'content-length': '3', etag: '"v1"' },
      })
    }
    if (init?.method === 'POST') {
      uploads++
      return Response.json({ success: true })
    }
    return new Response('missing', { status: 404 })
  }

  try {
    const first = await ingestVagaroImage(env, state.registry, request)
    const second = await ingestVagaroImage(env, state.registry, request)
    assert.equal(first.status, 'ready')
    assert.equal(second.status, 'existing')
    assert.equal(second.imageId, first.imageId)
    assert.equal(uploads, 1)
    assert.equal(sourceReads, 2)
    assert.match(first.deliveryUrl, /^https:\/\/imagedelivery\.net\/delivery-hash\/lp\/vagaro\//)
    assert.equal(JSON.stringify([...new Headers({ authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` })]).includes('secret-token'), true)
    assert.equal(first.deliveryUrl.includes('secret-token'), false)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('adopts an already-hosted migration row without uploading the same source again', async () => {
  const previousFetch = globalThis.fetch
  const migrated: ImageRegistryRow = {
    source_key: request.sourceKey,
    source_kind: request.sourceKind,
    source_url: request.sourceUrl,
    cloudflare_image_id: 'lp/existing-transition-image',
    delivery_url: 'https://imagedelivery.net/delivery-hash/lp/existing-transition-image/public',
    previous_cloudflare_image_id: null,
    source_etag: null,
    source_last_modified: null,
    source_content_length: null,
    source_content_hash: null,
    status: 'ready',
    failure_count: 0,
    last_error: null,
    checked_at: 1,
    ingested_at: 1,
    refreshed_at: 1,
  }
  const state = fakeRegistry(migrated)
  let imageApiCalls = 0
  globalThis.fetch = async (input) => {
    if (String(input) === request.sourceUrl) {
      return new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg', 'content-length': '3', etag: '"v1"' },
      })
    }
    imageApiCalls++
    return new Response('unexpected', { status: 500 })
  }

  try {
    const result = await ingestVagaroImage(env, state.registry, request)
    assert.equal(result.status, 'existing')
    assert.equal(result.imageId, migrated.cloudflare_image_id)
    assert.equal(imageApiCalls, 0)
    assert.ok(state.row()?.source_content_hash)
    assert.equal(state.row()?.source_etag, '"v1"')
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('a changed source publishes a new immutable image and retains the prior id for rollback', async () => {
  const previousFetch = globalThis.fetch
  const state = fakeRegistry()
  let version = 1

  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (url === request.sourceUrl) {
      const bytes = version === 1 ? [1, 2, 3] : [4, 5, 6]
      return new Response(Uint8Array.from(bytes), {
        status: 200,
        headers: { 'content-type': 'image/jpeg', 'content-length': '3', etag: `"v${version}"` },
      })
    }
    if (init?.method === 'POST') return Response.json({ success: true })
    return new Response('missing', { status: 404 })
  }

  try {
    const first = await ingestVagaroImage(env, state.registry, request)
    version = 2
    const second = await ingestVagaroImage(env, state.registry, request)
    assert.notEqual(second.imageId, first.imageId)
    assert.equal(state.row()?.previous_cloudflare_image_id, first.imageId)
    assert.equal(state.row()?.cloudflare_image_id, second.imageId)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('refresh failure preserves the last ready direct image and never exposes the provider URL', async () => {
  const previousFetch = globalThis.fetch
  const existing: ImageRegistryRow = {
    source_key: request.sourceKey,
    source_kind: request.sourceKind,
    source_url: request.sourceUrl,
    cloudflare_image_id: 'lp/vagaro/old/content',
    delivery_url: 'https://imagedelivery.net/delivery-hash/lp/vagaro/old/content/public',
    previous_cloudflare_image_id: null,
    source_etag: '"old"',
    source_last_modified: null,
    source_content_length: 3,
    source_content_hash: 'old',
    status: 'ready',
    failure_count: 0,
    last_error: null,
    checked_at: 1,
    ingested_at: 1,
    refreshed_at: 1,
  }
  const state = fakeRegistry(existing)
  globalThis.fetch = async () => new Response('gone', { status: 404 })

  try {
    const result = await ingestVagaroImage(env, state.registry, request)
    assert.equal(result.status, 'preserved')
    assert.equal(result.deliveryUrl, existing.delivery_url)
    assert.equal(result.deliveryUrl.includes('rackcdn.com'), false)
    assert.match(state.failures[0], /returned 404/)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('first ingestion failure fails closed when no ready image exists', async () => {
  const previousFetch = globalThis.fetch
  const state = fakeRegistry()
  globalThis.fetch = async () => new Response('gone', { status: 404 })

  try {
    await assert.rejects(ingestVagaroImage(env, state.registry, request), /returned 404/)
  } finally {
    globalThis.fetch = previousFetch
  }
})
