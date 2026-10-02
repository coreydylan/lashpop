import assert from 'node:assert/strict'
import test from 'node:test'
import type { Db } from './db'
import { ingestVagaroImage, type ImageRegistry, type VagaroImageResult } from './cloudflare-images'
import type { VagaroClient } from './vagaro-client'
import { syncAllServices } from './sync'
import { services } from './schema'
import type { PublicServiceRecord, PublicServicesPayload } from './public-services'
import { serviceSyncHealthError } from './booking-health'

const oldSource = 'https://images.rackcdn.com/Service/Original/old.jpg'
const oldImage = 'https://imagedelivery.net/account/existing/public'
const rejectedSource = 'https://untrusted.example/Service/Original/new.jpg'
const client = { async getServices() {
  return [{ serviceId: '1', serviceTitle: 'Service 1', serviceDescription: 'Fresh copy',
    servicePerformedBy: [{ price: 49, durationMinutes: 75 }] }]
} } as unknown as VagaroClient

function payload(count: number, photoCount: number): PublicServicesPayload {
  const records = Array.from({ length: count }, (_, i) => ({
    serviceId: String(i + 1), serviceTitle: `Service ${i + 1}`,
    parentServiceId: null, parentServiceTitle: 'Lashes', parentCategoryId: null,
    photoUrl: i < photoCount ? rejectedSource : null,
    isActive: true, isSoftDeleted: false, raw: {},
  } as PublicServiceRecord))
  return { categories: [], records, photosByTitle: new Map(),
    photosByServiceId: new Map(records.filter(r => r.photoUrl).map(r => [r.serviceId, r.photoUrl!])) }
}

function fakeDb(count: number, insert = false, failUpdate = false) {
  const patches: Record<string, unknown>[] = []
  const inserted: Record<string, unknown>[] = []
  const rows = Array.from({ length: count }, (_, i) => [{
    id: `local-${i + 1}`, vagaroServiceId: String(i + 1), name: `Service ${i + 1}`,
    isActive: false, vagaroImageUrl: oldImage, vagaroImageSourceUrl: oldSource,
  }])
  const db = {
    select() { return { from(table: unknown) {
      return table === services
        ? { where() { return {
            async limit() { return insert ? [] : rows.shift() ?? [] },
            then(resolve: (rows: unknown[]) => unknown) { return Promise.resolve(resolve([])) },
          } } }
        : { async innerJoin() { return [] } }
    } } },
    update() { return { set(patch: Record<string, unknown>) { return { async where() {
      if (failUpdate) throw new Error('database write failed')
      patches.push(patch)
    } } } } },
    insert() { return { values(row: Record<string, unknown>) { return { async returning() {
      inserted.push(row)
      return [{ id: 'new-local' }]
    } } } } },
  } as unknown as Db
  return { db, patches, inserted }
}

test('the confirmed URL rejection no longer prevents 56 photo-bearing service updates', async () => {
  let registryReads = 0
  const registry = { async get() { registryReads++; throw new Error('must not access registry') } } as unknown as ImageRegistry
  const ingestor = (request: Parameters<typeof ingestVagaroImage>[2]) =>
    ingestVagaroImage({ DB: {} as D1Database, CLOUDFLARE_ACCOUNT_ID: 'test',
      CLOUDFLARE_IMAGES_ACCOUNT_HASH: 'test' }, registry, request)
  const state = fakeDb(91)
  const stats = await syncAllServices(state.db, client, 'test', payload(91, 56), ingestor)
  assert.equal(stats.synced, 91)
  assert.equal(stats.failed, 0)
  assert.equal(stats.photoFailures.length, 56)
  assert.match(stats.photoFailures[0].error, /HTTPS on an allow-listed Vagaro image host and path/)
  assert.equal(registryReads, 0)
  assert.equal(state.patches.length, 91)
  assert.equal(state.patches[0].priceStarting, 4900)
  assert.equal(state.patches[0].durationMinutes, 75)
  assert.equal(state.patches[0].vagaroDescription, 'Fresh copy')
  for (const patch of state.patches) {
    assert.equal(Object.hasOwn(patch, 'vagaroImageUrl'), false)
    assert.equal(Object.hasOwn(patch, 'vagaroImageSourceUrl'), false)
    assert.ok(patch.lastSyncedAt instanceof Date)
  }
  assert.match(serviceSyncHealthError(stats)!, /56 service photo update\(s\) failed; catalog records still synced/)
})

test('new service with a rejected photo is hidden and never stores the untrusted source', async () => {
  const state = fakeDb(1, true)
  const stats = await syncAllServices(state.db, client, 'test', payload(1, 1), async () => {
    throw new Error('Vagaro image source must be HTTPS on an allow-listed rackcdn.com host')
  })
  assert.equal(stats.synced, 1)
  assert.equal(stats.failed, 0)
  assert.equal(stats.photoFailures.length, 1)
  assert.equal(state.inserted[0].isActive, false)
  assert.equal(state.inserted[0].vagaroImageUrl, null)
  assert.equal(state.inserted[0].vagaroImageSourceUrl, null)
  assert.deepEqual(stats.bookingPending, ['Service 1'])
})

test('successful and preserved ingestion results keep matching image/source pairs', async () => {
  for (const status of ['ready', 'preserved'] as const) {
    const state = fakeDb(1)
    const result: VagaroImageResult = { status, sourceUrl: oldSource, deliveryUrl: oldImage, imageId: 'existing' }
    const stats = await syncAllServices(state.db, client, 'test', payload(1, 1), async () => result)
    assert.deepEqual(stats.photoFailures, [])
    assert.equal(state.patches[0].vagaroImageUrl, oldImage)
    assert.equal(state.patches[0].vagaroImageSourceUrl, oldSource)
  }
})

test('catalog write failures still fail the service and block reconciliation', async () => {
  const state = fakeDb(2, false, true)
  await assert.rejects(syncAllServices(state.db, client, 'test', payload(2, 0)),
    /All 2 service upserts failed.*database write failed/)
  assert.deepEqual(state.patches, [])
})
