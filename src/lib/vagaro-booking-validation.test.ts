import assert from 'node:assert/strict'
import test from 'node:test'
import { getVagaroDirectBookingUrl } from './vagaro-widget'
import { auditActiveServiceBookings } from './vagaro-booking-validation'

test('accounts for numeric Vagaro services and the intentional Botox route', () => {
  const audit = auditActiveServiceBookings([
    {
      id: 'fine-line',
      name: 'Fine Line Tattoos',
      mainCategory: 'Fine Line Tattoos',
      vagaroServiceId: '35729654',
      vagaroWidgetUrl: getVagaroDirectBookingUrl('35729654'),
    },
    {
      id: 'classic',
      name: 'Classic Full Set',
      mainCategory: 'Lash Extensions',
      vagaroServiceId: '11493553',
    },
    {
      id: 'botox',
      name: 'Botox Treatment',
      mainCategory: 'Injectables',
      vagaroServiceId: null,
    },
  ])

  assert.deepEqual(audit, {
    total: 3,
    vagaro: 2,
    external: 1,
    issues: [],
  })
})

test('reports missing, duplicate, and mismatched service mappings', () => {
  const audit = auditActiveServiceBookings([
    {
      id: 'missing',
      name: 'Missing Service',
      mainCategory: 'Lashes',
      vagaroServiceId: null,
    },
    {
      id: 'first',
      name: 'First Duplicate',
      mainCategory: 'Lashes',
      vagaroServiceId: '12345',
    },
    {
      id: 'second',
      name: 'Second Duplicate',
      mainCategory: 'Lashes',
      vagaroServiceId: '12345',
    },
    {
      id: 'mismatch',
      name: 'Mismatched Widget',
      mainCategory: 'Brows',
      vagaroServiceId: '99999',
      vagaroWidgetUrl: getVagaroDirectBookingUrl('88888'),
    },
  ])

  assert.equal(audit.total, 4)
  assert.equal(audit.vagaro, 1)
  assert.equal(audit.external, 0)
  assert.deepEqual(audit.issues, [
    'Missing Service: missing a numeric vagaro_service_id',
    'Second Duplicate: Vagaro service ID 12345 is already used by First Duplicate',
    'Mismatched Widget: stored BusinessWidget maps 88888 instead of 99999',
  ])
})

test('fails closed when the production query returns no services', () => {
  assert.deepEqual(auditActiveServiceBookings([]), {
    total: 0,
    vagaro: 0,
    external: 0,
    issues: ['No active services were returned from the production database'],
  })
})
