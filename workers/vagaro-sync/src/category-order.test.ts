import assert from 'node:assert/strict'
import test from 'node:test'
import { computeEffectiveCategoryOrder } from './category-order'

test('deduplicates merged source categories and preserves a manual anchor', () => {
  const order = computeEffectiveCategoryOrder([
    { websiteId: 'lashes', sourceOrder: 1, active: true },
    { websiteId: 'lashes', sourceOrder: 2, active: true },
    { websiteId: 'brows', sourceOrder: 3, active: true },
    { websiteId: 'fine-line', sourceOrder: 8, active: true },
    { websiteId: 'bundles', sourceOrder: 9, active: true },
  ], new Set([4]))

  assert.deepEqual(Object.fromEntries(order), {
    lashes: 1,
    brows: 2,
    'fine-line': 3,
    bundles: 5,
  })
})

test('ignores inactive Vagaro categories', () => {
  const order = computeEffectiveCategoryOrder([
    { websiteId: 'lashes', sourceOrder: 1, active: true },
    { websiteId: 'removed', sourceOrder: 2, active: false },
    { websiteId: 'brows', sourceOrder: 3, active: true },
  ], new Set())

  assert.deepEqual(Object.fromEntries(order), { lashes: 1, brows: 2 })
})
