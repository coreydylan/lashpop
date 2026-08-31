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
  'This is not a customer conversion rate',
  'Sources do not prove what caused a visit',
  'Read this as discovery, not attribution',
  'Starts and submissions are separate totals, not a visitor-by-visitor funnel',
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
    'Vagaro submissions per 100 tracked starts',
    'Sources group visitors by the referring website shared by their browser',
    'Every recorded action adds one to its total',
    'Website analytics',
    'Media library',
    'Booking category mapping',
    'Daily review update',
  ]

  for (const phrase of preferredCopy) {
    assert.equal(findBannedAdminCopy(phrase).length, 0, `expected “${phrase}” to be accepted`)
  }
})

test('allows direct negative language for real states and safety instructions', () => {
  const validCopy = [
    'Website analytics is not connected',
    'You cannot undo this action',
    'Do not send customer information by email',
  ]

  for (const phrase of validCopy) {
    assert.equal(findBannedAdminCopy(phrase).length, 0, `expected “${phrase}” to be accepted`)
  }
})
