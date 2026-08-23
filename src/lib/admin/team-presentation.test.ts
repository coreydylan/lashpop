import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  buildTeamPresentationUpdates,
  parseTeamPresentationUpdates,
} from './team-presentation'

const members = [
  { id: 'a1', showOnWebsite: true },
  { id: 'b2', showOnWebsite: false },
  { id: 'c3', showOnWebsite: true },
]

test('the admin UI payload is accepted by the API contract', () => {
  // This is the regression that broke Save Changes for everyone: the UI sent
  // displayOrder as a string and the route required an integer.
  const updates = buildTeamPresentationUpdates(members)
  const parsed = parseTeamPresentationUpdates({ updates })
  assert.equal(parsed.ok, true)
  assert.deepEqual(parsed.ok && parsed.updates, [
    { id: 'a1', showOnWebsite: true, displayOrder: 0 },
    { id: 'b2', showOnWebsite: false, displayOrder: 1 },
    { id: 'c3', showOnWebsite: true, displayOrder: 2 },
  ])
})

test('display order is emitted as an integer, never a string', () => {
  for (const update of buildTeamPresentationUpdates(members)) {
    assert.equal(typeof update.displayOrder, 'number')
    assert.equal(Number.isInteger(update.displayOrder), true)
  }
})

test('a stringified display order is rejected', () => {
  const parsed = parseTeamPresentationUpdates({
    updates: [{ id: 'a1', showOnWebsite: true, displayOrder: '0' }],
  })
  assert.equal(parsed.ok, false)
  assert.match(parsed.ok ? '' : parsed.error, /displayOrder/)
})

test('one bad row rejects the whole payload before any write', () => {
  const parsed = parseTeamPresentationUpdates({
    updates: [
      { id: 'a1', showOnWebsite: true, displayOrder: 0 },
      { id: 'b2', showOnWebsite: 'yes', displayOrder: 1 },
    ],
  })
  assert.equal(parsed.ok, false)
  assert.match(parsed.ok ? '' : parsed.error, /updates\[1\]\.showOnWebsite/)
})

test('missing or malformed envelopes are rejected', () => {
  assert.equal(parseTeamPresentationUpdates(null).ok, false)
  assert.equal(parseTeamPresentationUpdates({}).ok, false)
  assert.equal(parseTeamPresentationUpdates({ updates: 'nope' }).ok, false)
  assert.equal(parseTeamPresentationUpdates({ updates: [{ showOnWebsite: true, displayOrder: 0 }] }).ok, false)
})

test('duplicate ids are rejected', () => {
  const parsed = parseTeamPresentationUpdates({
    updates: [
      { id: 'a1', showOnWebsite: true, displayOrder: 0 },
      { id: 'a1', showOnWebsite: false, displayOrder: 1 },
    ],
  })
  assert.equal(parsed.ok, false)
  assert.match(parsed.ok ? '' : parsed.error, /duplicate/)
})
