import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PENDING_TINY_TATTOOS_FAQ_ID,
  withPendingTinyTattoosFaqCategory,
} from './public-faq-categories'

test('adds a content-pending Tiny Tattoos category between jewelry and Botox', () => {
  const result = withPendingTinyTattoosFaqCategory([
    { id: 'jewelry', name: 'permanent-jewelry', displayName: 'Permanent Jewelry', displayOrder: 8 },
    { id: 'botox', name: 'botox', displayName: 'Botox', displayOrder: 9 },
  ])

  assert.deepEqual(result.map((category) => category.displayName), [
    'Permanent Jewelry',
    'Tiny Tattoos',
    'Botox',
  ])
  assert.equal(result[1].id, PENDING_TINY_TATTOOS_FAQ_ID)
  assert.equal('contentPending' in result[1] && result[1].contentPending, true)
})

test('does not duplicate a real Tiny Tattoos FAQ category once content exists', () => {
  const categories = [
    { id: 'tiny', name: 'tiny-tattoos', displayName: 'Tiny Tattoos', displayOrder: 8 },
  ]

  assert.deepEqual(withPendingTinyTattoosFaqCategory(categories), categories)
})
