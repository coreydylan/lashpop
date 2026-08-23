import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const actionsSource = readFileSync(
  fileURLToPath(new URL('../actions/team.ts', import.meta.url)),
  'utf8',
)
const syncSource = readFileSync(
  fileURLToPath(new URL('../../workers/vagaro-sync/src/sync.ts', import.meta.url)),
  'utf8',
)
const legacySyncSource = readFileSync(
  fileURLToPath(new URL('./vagaro-sync.ts', import.meta.url)),
  'utf8',
)
const localBusinessSchemaSource = readFileSync(
  fileURLToPath(new URL('../components/seo/LocalBusinessSchema.tsx', import.meta.url)),
  'utf8',
)

test('every public team query requires both source activity and website publication', () => {
  const publicationFilters = actionsSource.match(/eq\(teamMembers\.showOnWebsite, true\)/g) ?? []
  const activityFilters = actionsSource.match(/eq\(teamMembers\.isActive, true\)/g) ?? []

  assert.ok(publicationFilters.length >= 4)
  assert.ok(activityFilters.length >= publicationFilters.length)
})

test('new Vagaro providers are unpublished and existing-provider sync preserves publication', () => {
  const staffSyncStart = syncSource.indexOf('export async function syncPublicStaff')
  const staffSync = syncSource.slice(staffSyncStart)
  const existingUpdateStart = staffSync.indexOf('.update(teamMembers)')
  const existingUpdateEnd = staffSync.indexOf('.where(eq(teamMembers.id, matchByName.id))')
  const existingUpdate = staffSync.slice(existingUpdateStart, existingUpdateEnd)

  assert.match(staffSync, /showOnWebsite: false/)
  assert.equal(existingUpdate.includes('showOnWebsite'), false)
})

test('hidden team members are excluded from public structured data', () => {
  assert.match(localBusinessSchemaSource, /eq\(teamMembers\.showOnWebsite, true\)/)
})

test('the Vagaro employee webhook path creates people hidden and never republishes them', () => {
  // The webhook calls syncTeamMember() instead of the canonical worker. Both
  // ingestion paths must share one publication policy, or a webhook can put a
  // stranger on the public site (the D1 column default is 1).
  const fnStart = legacySyncSource.indexOf('export async function syncTeamMember')
  assert.ok(fnStart >= 0)
  const fn = legacySyncSource.slice(fnStart)
  const insertStart = fn.indexOf('.insert(teamMembers)')
  const insertEnd = fn.indexOf('.returning(', insertStart)
  const insert = fn.slice(insertStart, insertEnd)
  const updateSetStart = fn.indexOf('.set({', fn.indexOf('.update(teamMembers)'))
  const updateSet = fn.slice(updateSetStart, fn.indexOf('})', updateSetStart))

  assert.match(insert, /showOnWebsite: false/)
  assert.equal(updateSet.includes('showOnWebsite'), false)
})
