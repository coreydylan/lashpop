#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const DOMAIN = 'lashpopstudios.com'
export const ZONE_ID = '108a0d29a7a5c179a20e8560955eae58'
export const PROJECT_ID = 'prj_yAUptNY7u0kC0u4drjAv2KNyW9cZ'
export const EXPECTED_NON_WEB_COUNT = 21
export const EXPECTED_NON_WEB_HASH = '91a1e3144445cb1af5003edaecb7cdb43bc7c997cf33d4a975b293d17aadee94'

export const LEGACY_WEB_RECORDS = [
  { type: 'A', name: DOMAIN, content: '198.49.23.145', ttl: 600, proxied: false },
  { type: 'A', name: DOMAIN, content: '198.49.23.144', ttl: 600, proxied: false },
  { type: 'A', name: DOMAIN, content: '198.185.159.145', ttl: 600, proxied: false },
  { type: 'A', name: DOMAIN, content: '198.185.159.144', ttl: 600, proxied: false },
  { type: 'CNAME', name: `www.${DOMAIN}`, content: 'ext-sq.squarespace.com', ttl: 600, proxied: false },
]

const AGENT_ENV_KEYS = [
  'CLAUDECODE',
  'CLAUDE_CODE_ENTRYPOINT',
  'CLAUDE_CODE_EXECPATH',
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
]

function sanitizeAgentEnvironment() {
  for (const key of AGENT_ENV_KEYS) delete process.env[key]
}

function canonicalRecord(record) {
  return {
    type: record.type,
    name: record.name,
    content: record.content.replace(/\.$/, ''),
    ttl: record.ttl,
    proxied: Boolean(record.proxied),
    priority: record.priority ?? null,
    data: record.data ?? null,
  }
}

function isWebRecord(record) {
  return (
    (record.name === DOMAIN && record.type === 'A')
    || (record.name === `www.${DOMAIN}` && ['A', 'CNAME'].includes(record.type))
  )
}

export function fingerprintNonWeb(records) {
  const stable = records
    .filter(record => !isWebRecord(record))
    .map(canonicalRecord)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  return {
    count: stable.length,
    hash: createHash('sha256').update(JSON.stringify(stable)).digest('hex'),
  }
}

function recordKey(record) {
  return `${record.type}|${record.name}|${record.content.replace(/\.$/, '')}`
}

function exactRecordSet(actual, expected) {
  const actualKeys = actual.map(recordKey).sort()
  const expectedKeys = expected.map(recordKey).sort()
  return JSON.stringify(actualKeys) === JSON.stringify(expectedKeys)
}

export function targetWebRecords(vercelConfig) {
  const ipv4 = vercelConfig.recommendedIPv4?.find(item => item.rank === 1)?.value
  const cname = vercelConfig.recommendedCNAME?.find(item => item.rank === 1)?.value
  if (!Array.isArray(ipv4) || ipv4.length === 0 || typeof cname !== 'string') {
    throw new Error('Vercel did not return rank-1 IPv4 and CNAME targets')
  }
  return [
    ...ipv4.map(content => ({ type: 'A', name: DOMAIN, content, ttl: 300, proxied: false })),
    { type: 'CNAME', name: `www.${DOMAIN}`, content: cname.replace(/\.$/, ''), ttl: 300, proxied: false },
  ]
}

export function classifyWebState(records, targetRecords) {
  const web = records.filter(isWebRecord)
  if (exactRecordSet(web, LEGACY_WEB_RECORDS)) return 'legacy'
  if (exactRecordSet(web, targetRecords)) return 'vercel'
  return 'mixed-or-unknown'
}

function apiToken() {
  const token = process.env.CLOUDFLARE_API_TOKEN_PERSONAL
  if (!token) {
    throw new Error('CLOUDFLARE_API_TOKEN_PERSONAL is required; do not pass tokens on the command line')
  }
  return token
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${apiToken()}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  })
  const body = await response.json()
  if (!response.ok || !body.success) {
    throw new Error(`Cloudflare request failed (${response.status}): ${JSON.stringify(body.errors || body)}`)
  }
  return body.result
}

async function currentZoneRecords() {
  const zone = await cloudflare(`/zones/${ZONE_ID}`)
  if (zone.name !== DOMAIN || zone.status !== 'active') {
    throw new Error(`Expected active ${DOMAIN} zone, got ${zone.name} (${zone.status})`)
  }
  return cloudflare(`/zones/${ZONE_ID}/dns_records?per_page=500`)
}

function vercelJson(path) {
  const result = spawnSync('vercel', ['api', path, '--scope', 'experial', '--raw'], {
    encoding: 'utf8',
    env: process.env,
  })
  if (result.status !== 0) {
    throw new Error(`Vercel preflight failed: ${(result.stderr || result.stdout).trim()}`)
  }
  return JSON.parse(result.stdout)
}

function currentVercelTargets() {
  const config = vercelJson(`/v6/domains/${DOMAIN}/config`)
  const projectDomain = vercelJson(`/v9/projects/${PROJECT_ID}/domains/www.${DOMAIN}`)
  if (!projectDomain.verified || projectDomain.redirect !== DOMAIN || projectDomain.redirectStatusCode !== 308) {
    throw new Error(`www.${DOMAIN} must be verified and redirect to ${DOMAIN} with 308 before cutover`)
  }
  return targetWebRecords(config)
}

function assertNonWebParity(records) {
  const fingerprint = fingerprintNonWeb(records)
  if (
    fingerprint.count !== EXPECTED_NON_WEB_COUNT
    || fingerprint.hash !== EXPECTED_NON_WEB_HASH
  ) {
    throw new Error(
      `Non-web DNS drift detected: expected ${EXPECTED_NON_WEB_COUNT}/${EXPECTED_NON_WEB_HASH}, `
      + `got ${fingerprint.count}/${fingerprint.hash}. Re-export and review before cutover.`,
    )
  }
  return fingerprint
}

export function buildBatch(records, desiredRecords) {
  const webRecords = records.filter(isWebRecord)
  return {
    deletes: webRecords.map(record => ({ id: record.id })),
    posts: desiredRecords,
  }
}

function parseArgs(args) {
  const mode = args.includes('--rollback') ? 'rollback' : 'cutover'
  const apply = args.includes('--apply')
  const confirmIndex = args.indexOf('--confirm')
  const confirmation = confirmIndex >= 0 ? args[confirmIndex + 1] : null
  if (apply && confirmation !== DOMAIN) {
    throw new Error(`Applying requires: --confirm ${DOMAIN}`)
  }
  return { mode, apply }
}

async function main() {
  sanitizeAgentEnvironment()
  const { mode, apply } = parseArgs(process.argv.slice(2))
  const records = await currentZoneRecords()
  const targetRecords = currentVercelTargets()
  const fingerprint = assertNonWebParity(records)
  const state = classifyWebState(records, targetRecords)
  const expectedState = mode === 'cutover' ? 'legacy' : 'vercel'
  const desiredRecords = mode === 'cutover' ? targetRecords : LEGACY_WEB_RECORDS

  if (state !== expectedState) {
    throw new Error(`Refusing ${mode}: expected ${expectedState} web records, found ${state}`)
  }

  const batch = buildBatch(records, desiredRecords)
  console.log(JSON.stringify({
    mode,
    apply,
    domain: DOMAIN,
    zoneId: ZONE_ID,
    currentState: state,
    nonWebParity: fingerprint,
    deleteRecordIds: batch.deletes.map(item => item.id),
    createRecords: batch.posts,
    publicDnsChanged: false,
  }, null, 2))

  if (!apply) {
    console.log(`PLAN ONLY. Apply with: node scripts/cloudflare/lashpop-dns-cutover.mjs${mode === 'rollback' ? ' --rollback' : ''} --apply --confirm ${DOMAIN}`)
    return
  }

  await cloudflare(`/zones/${ZONE_ID}/dns_records/batch`, {
    method: 'POST',
    body: JSON.stringify(batch),
  })

  const after = await currentZoneRecords()
  assertNonWebParity(after)
  const afterState = classifyWebState(after, targetRecords)
  const desiredState = mode === 'cutover' ? 'vercel' : 'legacy'
  if (afterState !== desiredState) {
    throw new Error(`Batch returned success but verification found ${afterState}, expected ${desiredState}`)
  }
  console.log(`${mode.toUpperCase()} APPLIED AND VERIFIED: ${DOMAIN} is now in ${desiredState} web-record state.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
