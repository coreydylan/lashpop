import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyRoster, type ReconcileRow } from './reconcile'

function row(overrides: Partial<ReconcileRow> & { id: string; name: string }): ReconcileRow {
  return {
    isActive: true,
    showOnWebsite: true,
    showOnWebsiteReason: null,
    vagaroPublicProviderId: null,
    usesLashpopBooking: true,
    ...overrides,
  }
}

test('a healthy roster produces no alerts', () => {
  const report = classifyRoster(
    [
      row({ id: '1', name: 'Kelly Richter', vagaroPublicProviderId: 11 }),
      row({ id: '2', name: 'Nancy Nicole', vagaroPublicProviderId: 12 }),
      row({
        id: '3',
        name: 'Ava Zeutenhorst',
        vagaroPublicProviderId: 13,
        showOnWebsite: false,
        showOnWebsiteReason: 'Client-approved departure',
      }),
    ],
    [
      { providerId: 11, name: 'Kelly Richter' },
      { providerId: 12, name: 'Nancy Nicole' },
      { providerId: 13, name: 'Ava Zeutenhorst' },
    ],
  )

  assert.equal(report.ok, true)
  assert.deepEqual(report.alerts, [])
  assert.equal(report.counts.activePublished, 2)
  assert.equal(report.counts.activeHiddenAcknowledged, 1)
})

test('an active provider hidden with no reason is an alert', () => {
  // The August 2026 bug: published artists silently unpublished.
  const report = classifyRoster(
    [row({ id: '1', name: 'Kelly Richter', vagaroPublicProviderId: 11, showOnWebsite: false })],
    [{ providerId: 11, name: 'Kelly Richter' }],
  )

  assert.equal(report.ok, false)
  assert.equal(report.counts.activeHiddenUnexplained, 1)
  assert.match(report.alerts[0], /hidden with no recorded reason: Kelly Richter/)
})

test('an inactive row still flagged for publication is an alert', () => {
  const report = classifyRoster(
    [row({ id: '9', name: 'Gabby Sanchez', isActive: false, showOnWebsite: true })],
    [],
  )

  assert.equal(report.ok, false)
  assert.equal(report.counts.inactivePublished, 1)
  assert.match(report.alerts[0], /reactivation would publish it immediately/)
})

test('a provider in Vagaro with no row is an alert, and duplicate names warn', () => {
  const report = classifyRoster(
    [
      row({ id: '1', name: 'Kimberly Starnes' }),
      row({ id: '2', name: 'Kimberly Starnes', isActive: false, showOnWebsite: false }),
    ],
    [
      { providerId: 44, name: 'Brand New Person' },
      { providerId: null, name: 'Kimberly Starnes' },
    ],
  )

  assert.deepEqual(report.inVagaroMissingFromDb, ['Brand New Person'])
  assert.equal(report.alerts.some(alert => alert.includes('Brand New Person')), true)
  assert.equal(report.duplicateNames.length, 1)
  assert.match(report.warnings[0], /name fallback cannot resolve it/)
})
