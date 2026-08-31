import assert from 'node:assert/strict'
import test from 'node:test'
import { findBannedAdminCopy } from './admin-copy-lexicon.mjs'

const REQUIRED_BANNED_PHRASES = [
  'How attention moved',
  'Traffic rhythm',
  'Operator read',
  'Action signals',
  'Signal ratio',
  'Signal rate',
  'Directional signals',
  'Not enough signal',
  'Pages earning attention',
  'Read this as discovery',
  'Success signals',
  'Re-score with Claude',
  'Browse DAM',
  'Booking taxonomy',
]

test('rejects the vague and internal phrases removed from Admin', () => {
  for (const phrase of REQUIRED_BANNED_PHRASES) {
    assert.notEqual(findBannedAdminCopy(phrase).length, 0, `expected “${phrase}” to be rejected`)
  }
})

test('accepts literal operator language', () => {
  const preferredCopy = [
    'Visitors and page views by day',
    'Vagaro confirmations ÷ booking starts',
    'Website analytics',
    'Media library',
    'Booking category mapping',
    'Daily review update',
  ]

  for (const phrase of preferredCopy) {
    assert.equal(findBannedAdminCopy(phrase).length, 0, `expected “${phrase}” to be accepted`)
  }
})
