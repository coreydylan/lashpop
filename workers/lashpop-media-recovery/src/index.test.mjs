import test from 'node:test'
import assert from 'node:assert/strict'
import worker, { imageOptions } from './index.js'
import { sources } from './sources.js'

const r2 = Object.entries(sources).find(([, source]) => source.kind === 'r2')
const heic = Object.entries(sources).find(([, source]) => source.key?.toLowerCase().endsWith('.heic'))
const png = Object.entries(sources).find(([, source]) => source.key?.toLowerCase().endsWith('.png'))
const external = Object.entries(sources).find(([, source]) => source.kind === 'external')
const originalFetch = globalThis.fetch

function fixture() {
  const stored = new Map()
  const reads = []
  const transforms = []
  const pending = []
  globalThis.caches = { default: {
    match: async key => stored.get(key.url)?.clone(),
    put: async (key, response) => { stored.set(key.url, response) },
  } }
  const env = {
    BUCKET: { get: async key => { reads.push(key); return { size: 4, body: new Blob(['data']).stream() } } },
    IMAGES: { input: body => ({ transform: options => ({ output: async output => {
      await new Response(body).arrayBuffer()
      transforms.push({ options, output })
      return { response: () => new Response('encoded', { headers: { 'content-type': output.format } }) }
    } }) }) },
  }
  return { env, reads, transforms, pending, ctx: { waitUntil: task => pending.push(task) } }
}

test('registry is the complete ready snapshot, never the whole bucket', () => {
  assert.equal(Object.keys(sources).length, 531)
  assert.equal(Object.values(sources).filter(source => source.kind === 'r2').length, 407)
  assert.equal(Object.values(sources).filter(source => source.kind === 'external').length, 75)
})

test('unregistered keys, encoded traversal, arbitrary URLs, and writes cannot read storage', async () => {
  const f = fixture()
  for (const [path, method, status] of [
    ['/image/backups/private.sql', 'GET', 404],
    ['/image/lp/not-registered', 'GET', 404],
    [`/image/${r2[0]}?url=https://127.0.0.1`, 'GET', 400],
    [`/image/${r2[0]}?w=NaN`, 'GET', 400],
    [`/image/${r2[0]}`, 'PUT', 405],
    ['/image/lp%2fanything', 'GET', 404],
  ]) {
    const response = await worker.fetch(new Request(`https://media.test${path}`, { method }), f.env, f.ctx)
    assert.equal(response.status, status, path)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
  assert.deepEqual(f.reads, [])
})

test('HEIC is decoded and emitted as a browser format with bounded parameters', async () => {
  const f = fixture()
  const response = await worker.fetch(new Request(`https://media.test/image/${heic[0]}?w=99999&q=999`, { headers: { accept: 'image/avif,image/webp' } }), f.env, f.ctx)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/avif')
  assert.equal(response.headers.get('vary'), 'Accept')
  assert.deepEqual(f.reads, [heic[1].key])
  assert.deepEqual(f.transforms[0], { options: { width: 3840, fit: 'scale-down' }, output: { format: 'image/avif', quality: 90 } })
  await Promise.all(f.pending)
})

test('PNG preserves transparency for legacy clients and excludes refused Accept formats', () => {
  const url = new URL('https://media.test/image/x?w=300&q=80')
  assert.deepEqual(imageOptions(new Request(url, { headers: { accept: 'image/avif;q=0,image/webp;q=0' } }), url, png[1]), { width: 320, quality: 85, format: 'png' })
})

test('cache distinguishes formats and HEAD returns the same headers without a body', async () => {
  const f = fixture()
  const url = `https://media.test/image/${r2[0]}?w=320`
  const request = new Request(url, { headers: { accept: 'image/webp' } })
  const first = await worker.fetch(request, f.env, f.ctx)
  await Promise.all(f.pending)
  const head = await worker.fetch(new Request(url, { method: 'HEAD', headers: request.headers }), f.env, f.ctx)
  assert.equal(await head.text(), '')
  assert.equal(head.headers.get('content-type'), first.headers.get('content-type'))
  assert.equal(f.reads.length, 1)
  const other = await worker.fetch(new Request(url, { headers: { accept: 'image/avif' } }), f.env, f.ctx)
  assert.equal(other.headers.get('content-type'), 'image/avif')
  assert.equal(f.reads.length, 2)
})

test('provider failures never cache or leak a HEIC original', async () => {
  const f = fixture()
  f.env.IMAGES.input = () => { throw new Error('unavailable') }
  const response = await worker.fetch(new Request(`https://media.test/image/${heic[0]}`), f.env, f.ctx)
  assert.equal(response.status, 502)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(f.pending.length, 0)
})

test('external source is pinned to the registry and redirects fail closed', async () => {
  const f = fixture()
  let called
  globalThis.fetch = async (url, options) => {
    called = { url: url.toString(), options }
    return new Response('source', { headers: { 'content-type': 'image/jpeg' } })
  }
  try {
    const response = await worker.fetch(new Request(`https://media.test/image/${external[0]}`), f.env, f.ctx)
    assert.equal(response.status, 200)
    assert.equal(called.url, external[1].url)
    assert.equal(called.options.redirect, 'error')
    assert.equal(f.reads.length, 0)
  } finally { globalThis.fetch = originalFetch }
})
