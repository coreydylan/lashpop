import assert from 'node:assert/strict'
import { before, beforeEach, after, test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { makeSignature } from 'better-auth/crypto'
import { bridgePhoneSessionHeaders } from './auth-session'

// Exercise the real app config, Better Auth handler and SQLite proxy against
// the production migration chain. No provider, SMS or remote D1 is contacted.
process.env.CLOUDFLARE_DB_URL = 'http://127.0.0.1:65534'
process.env.CLOUDFLARE_DB_TOKEN = 'local-auth-test'
process.env.BETTER_AUTH_SECRET = 'local-auth-integration-secret-for-tests-2026'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

const TOKEN = 'valid-fixture-token-'.padEnd(32, '0')
assert.equal(TOKEN.length, 32)
const originalFetch = globalThis.fetch
let db: DatabaseSync
let authModule: typeof import('./auth')

function applyMigrations() {
  const folder = path.join(process.cwd(), 'workers/lashpop-db/migrations')
  for (const file of readdirSync(folder).filter(file => file.endsWith('.sql')).sort()) {
    for (const statement of readFileSync(path.join(folder, file), 'utf8').split('--> statement-breakpoint')) {
      if (statement.trim()) db.exec(statement)
    }
  }
}

before(async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'http://127.0.0.1:65534/query', 'auth tests must never contact remote services')
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer local-auth-test')
    const query = JSON.parse(String(init?.body)) as { sql: string; params: (string | number | null)[]; method: string }
    const statement = db.prepare(query.sql)
    if (query.method === 'run') {
      statement.run(...query.params)
      return Response.json({ rows: [] })
    }
    const rows = statement.all(...query.params).map(row => Object.values(row))
    return Response.json({ rows: query.method === 'get' ? rows[0] ?? [] : rows })
  }
  authModule = await import('./auth')
})

beforeEach(() => {
  db?.close()
  db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  applyMigrations()
  const now = Date.now()
  db.prepare(`INSERT INTO user (id, phone_number, phone_number_verified, name, email, admin_role, dam_access)
    VALUES (?, ?, 1, ?, NULL, ?, 1)`).run('auth-user', '+15555550123', 'Fixture Owner', 'owner')
  // This is the same shape written by the existing phone OTP route; a legacy
  // insert can omit the newly added timestamp and its raw cookie stays valid.
  db.prepare('INSERT INTO session (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run('auth-session', 'auth-user', TOKEN, now + 30 * 86_400_000, now)
})

after(() => {
  db?.close()
  globalThis.fetch = originalFetch
})

function request(endpoint: string, cookie?: string, body?: unknown, origin = 'http://localhost:3000') {
  return new Request(`http://localhost:3000/api/auth/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { origin, 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

test('the real auth schema initializes and anonymous HTTP/API session reads return null', async () => {
  const response = await authModule.handleAuthRequest(request('get-session'))
  assert.equal(response.status, 200)
  assert.equal(await response.json(), null)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(await authModule.getSessionFromHeaders(new Headers()), null)
  const context = await authModule.getAuth().$context
  await context.explicitSchemaCheck?.()
})

test('existing phone cookies work in HTTP client hooks and server session reads without exposing admin fields', async () => {
  const response = await authModule.handleAuthRequest(request('get-session', `auth_token=${TOKEN}`))
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.user.id, 'auth-user')
  assert.equal(result.user.phoneNumber, '+15555550123')
  assert.equal(result.user.email, null, 'phone-only users do not need a fabricated email')
  assert.equal(result.session.id, 'auth-session')
  assert.equal('adminRole' in result.user, false)
  assert.equal('damAccess' in result.user, false)
  assert.equal((await authModule.getSessionFromHeaders(new Headers({cookie: `auth_token=${TOKEN}`})))?.user.id, 'auth-user')
})

test('native signed cookies remain valid and invalid signatures never fall back to a legacy credential', async () => {
  const context = await authModule.getAuth().$context
  const name = context.authCookies.sessionToken.name
  const signed = encodeURIComponent(`${TOKEN}.${await makeSignature(TOKEN, context.secret)}`)
  const response = await authModule.handleAuthRequest(request('get-session', `${name}=${signed}`))
  assert.equal((await response.json()).user.id, 'auth-user')
  const rejected = await authModule.handleAuthRequest(request('get-session', `${name}=invalid.signature; auth_token=${TOKEN}`))
  assert.equal(await rejected.json(), null)
})

test('unknown, malformed, expired and revoked phone credentials cannot authenticate', async () => {
  for (const token of ['x'.repeat(32), 'short', `${TOKEN}.forged`]) {
    const response = await authModule.handleAuthRequest(request('get-session', `auth_token=${token}`))
    assert.equal(await response.json(), null)
  }
  db.prepare('UPDATE session SET expires_at = ? WHERE id = ?').run(Date.now() - 1_000, 'auth-session')
  assert.equal(await authModule.getSessionFromHeaders(new Headers({cookie: `auth_token=${TOKEN}`})), null)
  assert.equal(db.prepare('SELECT count(*) AS n FROM session').get()?.n, 0)
})

test('revocation is immediately effective even when a caller resends session cache cookies', async () => {
  const context = await authModule.getAuth().$context
  const cookie = `auth_token=${TOKEN}; ${context.authCookies.sessionData.name}=stale-cache`
  assert.ok(await authModule.getSessionFromHeaders(new Headers({cookie})))
  db.prepare('DELETE FROM session WHERE token = ?').run(TOKEN)
  assert.equal(await authModule.getSessionFromHeaders(new Headers({cookie})), null)
})

test('sign-out revokes the D1 session and expires both native and phone cookies', async () => {
  const response = await authModule.handleAuthRequest(request('sign-out', `auth_token=${TOKEN}`, {}))
  assert.equal(response.status, 200)
  assert.equal(db.prepare('SELECT count(*) AS n FROM session').get()?.n, 0)
  const cookies = response.headers.getSetCookie()
  assert.ok(cookies.some(cookie => cookie.startsWith('auth_token=;') && cookie.includes('Max-Age=0')))
  assert.ok(cookies.some(cookie => cookie.includes('better-auth.session_token=;')))
  assert.equal(await authModule.getSessionFromHeaders(new Headers({cookie: `auth_token=${TOKEN}`})), null)
})

test('cross-origin sign-out is rejected without revoking or clearing the session', async () => {
  const response = await authModule.handleAuthRequest(request('sign-out', `auth_token=${TOKEN}`, {}, 'https://untrusted.example'))
  assert.equal(response.status, 403)
  assert.equal(db.prepare('SELECT count(*) AS n FROM session').get()?.n, 1)
  assert.equal(response.headers.getSetCookie().some(cookie => cookie.startsWith('auth_token=')), false)
})

test('a due session refresh writes the new timestamp without changing its token or user', async () => {
  db.prepare('UPDATE session SET expires_at = ?, created_at = ? WHERE token = ?')
    .run(Date.now() + 2 * 86_400_000, Date.now() - 28 * 86_400_000, TOKEN)
  const result = await authModule.getSessionFromHeaders(new Headers({cookie: `auth_token=${TOKEN}`}))
  assert.equal(result?.user.id, 'auth-user')
  const row = db.prepare('SELECT token, user_id, expires_at, updated_at FROM session').get()
  assert.equal(row?.token, TOKEN)
  assert.equal(row?.user_id, 'auth-user')
  assert.ok(Number(row?.updated_at) > Date.now() - 10_000)
  assert.ok(Number(row?.expires_at) > Date.now() + 29 * 86_400_000)
})

test('phone identity and admin permissions cannot be changed through the generic user endpoint', async () => {
  const response = await authModule.handleAuthRequest(request('update-user', `auth_token=${TOKEN}`, {
    name: 'Updated Name', phoneNumber: '+15555550999', phoneNumberVerified: false, adminRole: 'publisher', damAccess: false,
  }))
  assert.equal(response.status, 400)
  const rejected = await response.json()
  assert.match(rejected.message, /not allowed|not permitted/i)
  assert.equal(db.prepare('SELECT name FROM user').get()?.name, 'Fixture Owner')
  const benign = await authModule.handleAuthRequest(request('update-user', `auth_token=${TOKEN}`, {
    name: 'Updated Name', adminRole: 'publisher', damAccess: false,
  }))
  assert.equal(benign.status, 200)
  const row = db.prepare('SELECT name, phone_number, phone_number_verified, admin_role, dam_access FROM user').get()
  assert.equal(row?.name, 'Updated Name')
  assert.equal(row?.phone_number, '+15555550123')
  assert.equal(row?.phone_number_verified, 1)
  assert.equal(row?.admin_role, 'owner')
  assert.equal(row?.dam_access, 1)
})

test('password and social signup stay disabled', async () => {
  const password = await authModule.handleAuthRequest(request('sign-up/email', undefined, {
    email: 'fixture@example.test', password: 'not-a-real-password-1234', name: 'Fixture',
  }))
  assert.ok(password.status >= 400)
  const social = await authModule.handleAuthRequest(request('sign-in/social', undefined, { provider: 'google' }))
  assert.ok(social.status >= 400)
  assert.equal(db.prepare('SELECT count(*) AS n FROM user').get()?.n, 1)
  assert.equal(db.prepare('SELECT count(*) AS n FROM account').get()?.n, 0)
})

test('the cookie bridge preserves caller headers and uses the configured secure cookie name', async () => {
  const headers = new Headers({cookie: `other=kept; auth_token=${TOKEN}`, origin: 'https://lashpopstudios.com'})
  const bridged = await bridgePhoneSessionHeaders(headers, '__Secure-better-auth.session_token', process.env.BETTER_AUTH_SECRET!)
  assert.equal(headers.get('cookie'), `other=kept; auth_token=${TOKEN}`)
  assert.equal(bridged.get('origin'), 'https://lashpopstudios.com')
  assert.match(bridged.get('cookie')!, /__Secure-better-auth\.session_token=/)
})
