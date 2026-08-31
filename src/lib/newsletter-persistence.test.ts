import assert from 'node:assert/strict'
import test from 'node:test'

import {
  persistNewsletterSubscription,
  type NewsletterPersistenceStore,
} from './newsletter-persistence'

type Record = {
  id: string
  email: string
  status: string
  subscribedAt: Date
  unsubscribedAt: Date | null
}

function memoryStore(records: Record[]): NewsletterPersistenceStore {
  return {
    async findByEmail(email) {
      const record = records.find((candidate) => candidate.email === email)
      return record ? { id: record.id, status: record.status } : null
    },
    async insertActive(email, now) {
      records.push({
        id: `subscriber-${records.length + 1}`,
        email,
        status: 'active',
        subscribedAt: now,
        unsubscribedAt: null,
      })
    },
    async reactivate(id, now) {
      const record = records.find((candidate) => candidate.id === id)
      assert.ok(record)
      record.status = 'active'
      record.subscribedAt = now
      record.unsubscribedAt = null
    },
  }
}

test('a footer signup is persisted and repeat submission remains idempotent', async () => {
  const records: Record[] = []
  const store = memoryStore(records)
  const now = new Date('2026-08-31T20:00:00Z')

  assert.equal(await persistNewsletterSubscription(store, 'guest@example.com', now), 'new')
  assert.equal(await persistNewsletterSubscription(store, 'guest@example.com', now), 'existing')
  assert.equal(records.length, 1)
  assert.equal(records[0].status, 'active')
})

test('new consent reactivates the existing ledger row instead of inserting a duplicate', async () => {
  const records: Record[] = [{
    id: 'subscriber-1',
    email: 'returning@example.com',
    status: 'unsubscribed',
    subscribedAt: new Date('2026-01-01T00:00:00Z'),
    unsubscribedAt: new Date('2026-06-01T00:00:00Z'),
  }]
  const now = new Date('2026-08-31T20:00:00Z')

  assert.equal(
    await persistNewsletterSubscription(memoryStore(records), 'returning@example.com', now),
    'reactivated',
  )
  assert.equal(records.length, 1)
  assert.equal(records[0].status, 'active')
  assert.equal(records[0].unsubscribedAt, null)
  assert.equal(records[0].subscribedAt, now)
})
