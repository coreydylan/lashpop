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
