import assert from 'node:assert/strict'
import test from 'node:test'
import {
  persistNewsletterSubscription,
  type NewsletterSubscriptionRecord,
  type NewsletterSubscriptionStore,
} from './newsletter-persistence'

function memoryStore(seed: NewsletterSubscriptionRecord[] = []) {
  const records = new Map(seed.map((record) => [record.email, { ...record }]))
  const store: NewsletterSubscriptionStore = {
    async findByEmail(email) {
      const record = records.get(email)
      return record ? { id: record.id, status: record.status } : null
    },
    async insert(email, now) {
      records.set(email, {
        id: `subscriber-${records.size + 1}`,
        email,
        source: 'footer_form',
        status: 'active',
        subscribedAt: now,
        unsubscribedAt: null,
        updatedAt: now,
      })
    },
    async reactivate(id, now) {
      const record = Array.from(records.values()).find((candidate) => candidate.id === id)
      assert.ok(record)
      record.status = 'active'
      record.source = 'footer_form'
      record.subscribedAt = now
      record.unsubscribedAt = null
      record.updatedAt = now
    },
  }
  return { records, store }
}

test('a footer signup persists one active consent record idempotently', async () => {
  const now = new Date('2026-08-31T19:00:00Z')
  const state = memoryStore()

  assert.equal(await persistNewsletterSubscription(state.store, 'guest@example.com', now), 'new')
  assert.equal(
    await persistNewsletterSubscription(state.store, 'guest@example.com', now),
    'already-active',
  )
  assert.equal(state.records.size, 1)
  assert.equal(state.records.get('guest@example.com')?.status, 'active')
})

test('a new footer opt-in reactivates but never erases consent history', async () => {
  const old = new Date('2026-08-01T12:00:00Z')
  const now = new Date('2026-08-31T19:00:00Z')
  const state = memoryStore([{
    id: 'existing',
    email: 'returning@example.com',
    source: 'footer_form',
    status: 'unsubscribed',
    subscribedAt: old,
    unsubscribedAt: old,
    updatedAt: old,
  }])

  assert.equal(
    await persistNewsletterSubscription(state.store, 'returning@example.com', now),
    'reactivated',
  )
  assert.equal(state.records.size, 1)
  assert.deepEqual(state.records.get('returning@example.com'), {
    id: 'existing',
    email: 'returning@example.com',
    source: 'footer_form',
    status: 'active',
    subscribedAt: now,
    unsubscribedAt: null,
    updatedAt: now,
  })
})
