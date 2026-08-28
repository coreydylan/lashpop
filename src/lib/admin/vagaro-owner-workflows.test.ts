import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { VAGARO_OWNER_WORKFLOWS, VAGARO_SYNC_SCHEDULE } from './vagaro-owner-workflows'

test('owner workflow matches the deployed Vagaro cron', () => {
  const wrangler = readFileSync(resolve(process.cwd(), 'workers/vagaro-sync/wrangler.jsonc'), 'utf8')
  assert.match(wrangler, new RegExp(`0 ${VAGARO_SYNC_SCHEDULE.cronUtc.map((time) => time.slice(0, 2).replace(/^0/, '')).join(',')} \\* \\* \\*`))
})

test('team member workflow preserves hidden-until-reviewed publication', () => {
  const team = VAGARO_OWNER_WORKFLOWS['team-member']
  assert.match(team.expectedResult, /hidden/i)
  assert.match(team.expectedResult, /never publishes or unpublishes/i)
  assert.ok(team.vagaroSteps.some((step) => /Enable Online Booking/.test(step)))
  assert.ok(team.afterSyncSteps.some((step) => /Save Changes/.test(step)))
})

test('service workflow exposes the technical widget boundary', () => {
  const service = VAGARO_OWNER_WORKFLOWS.service
  assert.match(service.expectedResult, /inactive and pending/i)
  assert.ok(service.afterSyncSteps.some((step) => /website operator/.test(step)))
  assert.ok(service.afterSyncSteps.some((step) => /desktop and phone/.test(step)))
})
