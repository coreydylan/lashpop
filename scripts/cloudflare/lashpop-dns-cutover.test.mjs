import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DOMAIN,
  LEGACY_WEB_RECORDS,
  buildBatch,
  classifyWebState,
  fingerprintNonWeb,
  targetWebRecords,
} from './lashpop-dns-cutover.mjs'

const targetConfig = {
  recommendedIPv4: [{ rank: 1, value: ['216.150.1.1', '216.150.16.1'] }],
  recommendedCNAME: [{ rank: 1, value: 'project.vercel-dns.example.' }],
}

const withIds = records => records.map((record, index) => ({ ...record, id: `record-${index}` }))

test('classifies only exact legacy and Vercel web-record states', () => {
  const target = targetWebRecords(targetConfig)
  assert.equal(classifyWebState(withIds(LEGACY_WEB_RECORDS), target), 'legacy')
  assert.equal(classifyWebState(withIds(target), target), 'vercel')
  assert.equal(classifyWebState(withIds(LEGACY_WEB_RECORDS.slice(1)), target), 'mixed-or-unknown')
})

test('builds one atomic web-only batch', () => {
  const target = targetWebRecords(targetConfig)
  const nonWeb = {
    id: 'mail',
    type: 'MX',
    name: DOMAIN,
    content: `mail.${DOMAIN}`,
    priority: 10,
    ttl: 300,
    proxied: false,
  }
  const batch = buildBatch([...withIds(LEGACY_WEB_RECORDS), nonWeb], target)
  assert.equal(batch.deletes.length, 5)
  assert.deepEqual(batch.posts, target)
  assert.ok(!batch.deletes.some(item => item.id === 'mail'))
})

test('non-web fingerprint ignores only apex and www web routing', () => {
  const mail = {
    type: 'MX',
    name: DOMAIN,
    content: `mail.${DOMAIN}`,
    priority: 10,
    ttl: 300,
    proxied: false,
  }
  const before = fingerprintNonWeb([...LEGACY_WEB_RECORDS, mail])
  const after = fingerprintNonWeb([...targetWebRecords(targetConfig), mail])
  assert.deepEqual(after, before)
  assert.equal(before.count, 1)
})
