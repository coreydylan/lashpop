import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const route = readFileSync(new URL('../app/api/admin/website/team/sync/route.ts', import.meta.url), 'utf8')
const syncButton = readFileSync(new URL('../app/admin/(panel)/system/syncs/SyncNowButton.tsx', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../components/admin/VagaroFirstWorkflow.tsx', import.meta.url), 'utf8')
const team = readFileSync(new URL('../app/admin/(panel)/website/team/page.tsx', import.meta.url), 'utf8')
const worker = readFileSync(new URL('../../workers/vagaro-sync/src/index.ts', import.meta.url), 'utf8')

describe('manual Vagaro sync result boundary', () => {
  it('keeps the worker allOk result when the response is summarized', () => {
    assert.match(worker, /\{ success: allOk, runId, result/)
    assert.match(route, /typeof payload\?\.allOk === 'boolean'/)
  })

  it('returns a distinct partial result instead of recording success', () => {
    assert.match(route, /action: partial \? 'vagaro\.sync\.partial' : 'vagaro\.sync\.failed'/)
    assert.match(route, /status: partial \? 207 : 502/)
    assert.match(route, /error: partial \? 'Sync completed with issues' : 'Sync failed'/)
  })

  it('makes every Admin caller reject or warn on non-success data', () => {
    for (const source of [syncButton, workflow, team]) {
      assert.match(source, /data\?\.partial/)
      assert.match(source, /data\?\.success (?:===|!==) false/)
    }
  })

  it('refreshes service workflow data after a partial update', () => {
    assert.match(
      workflow,
      /if \(data\?\.partial\) \{[\s\S]*?await onSyncComplete\?\.\(\)[\s\S]*?router\.refresh\(\)[\s\S]*?return/,
    )
  })
})
