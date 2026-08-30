import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isSessionReplayAllowedPath,
  parseSessionReplayConsent,
  redactSessionReplayUrl,
  resolveSessionReplayConfig,
  serializeSessionReplayConsent,
} from './session-replay'

describe('session replay privacy contract', () => {
  it('stays disabled until every explicit configuration value is valid', () => {
    assert.equal(resolveSessionReplayConfig({
      enabled: undefined,
      projectToken: 'phc_abcdefghijklmnop',
      apiHost: 'https://us.i.posthog.com',
    }).enabled, false)
    assert.equal(resolveSessionReplayConfig({
      enabled: 'true',
      projectToken: 'not-a-project-token',
      apiHost: 'https://us.i.posthog.com',
    }).enabled, false)
    assert.equal(resolveSessionReplayConfig({
      enabled: 'true',
      projectToken: 'phc_abcdefghijklmnop',
      apiHost: 'https://unapproved.example.com',
    }).enabled, false)
    assert.equal(resolveSessionReplayConfig({
      enabled: 'TRUE',
      projectToken: 'phc_abcdefghijklmnop',
      apiHost: 'https://us.i.posthog.com/',
    }).enabled, true)
  })

  it('allowlists only public discovery and service routes', () => {
    for (const path of ['/', '/services', '/services/classic-fill', '/services/classic-fill/']) {
      assert.equal(isSessionReplayAllowedPath(path), true, path)
    }

    for (const path of [
      '/admin',
      '/admin/login',
      '/confirm/secret-token',
      '/work-with-us',
      '/privacy',
      '/terms',
      '/punchlist',
      '/staffphoto',
    ]) {
      assert.equal(isSessionReplayAllowedPath(path), false, path)
    }
  })

  it('accepts only the versioned consent statuses', () => {
    assert.equal(parseSessionReplayConsent(null), 'unset')
    assert.equal(parseSessionReplayConsent('not-json'), 'unset')
    assert.equal(parseSessionReplayConsent('{"status":"maybe"}'), 'unset')
    assert.equal(parseSessionReplayConsent('{"status":"granted"}'), 'granted')
    assert.equal(parseSessionReplayConsent(serializeSessionReplayConsent('denied')), 'denied')
  })

  it('removes query strings and fragments from captured URLs', () => {
    assert.equal(
      redactSessionReplayUrl('https://lashpopstudios.com/services/classic-fill?email=hidden#booking'),
      'https://lashpopstudios.com/services/classic-fill'
    )
    assert.equal(
      redactSessionReplayUrl('/services?campaign=launch'),
      'https://lashpopstudios.com/services'
    )
  })
})
