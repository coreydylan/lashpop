#!/usr/bin/env node

import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const contract = JSON.parse(await readFile(new URL('docs/admin/capabilities.json', root), 'utf8'))
const baseUrl = process.env.ADMIN_ACCEPTANCE_BASE_URL?.replace(/\/$/, '')
const authToken = process.env.ADMIN_ACCEPTANCE_AUTH_TOKEN
const bypassToken = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

if (!baseUrl || !authToken) {
  console.error('ADMIN_ACCEPTANCE_BASE_URL and ADMIN_ACCEPTANCE_AUTH_TOKEN are required.')
  process.exit(2)
}

const target = new URL(baseUrl)
if (target.protocol !== 'https:' && target.hostname !== 'localhost') {
  console.error('Live admin acceptance requires HTTPS, except for localhost.')
  process.exit(2)
}

const productionHosts = new Set(['lashpop.vercel.app', 'lashpopstudios.com', 'www.lashpopstudios.com'])
if (productionHosts.has(target.hostname) && process.env.ADMIN_ACCEPTANCE_ALLOW_PRODUCTION_READS !== '1') {
  console.error('Refusing production. Use an isolated future-branch preview for admin acceptance.')
  process.exit(2)
}

const headers = {
  cookie: `auth_token=${authToken}`,
  ...(bypassToken ? { 'x-vercel-protection-bypass': bypassToken } : {}),
}

const routeExpectations = new Map(
  contract.capabilities.map((capability) => [
    capability.route,
    capability.id === 'founder-letter-redirect' ? new Set([307, 308]) : new Set([200]),
  ]),
)

const readApis = [
  '/api/admin/analytics?range=30d',
  '/api/admin/dam-users',
  '/api/admin/history',
  '/api/admin/website/faqs',
  '/api/admin/website/founder-letter',
  '/api/admin/website/hero-content',
  '/api/admin/website/hero-slideshow-assignments',
  '/api/admin/website/homepage-services',
  '/api/admin/website/instagram',
  '/api/admin/website/review-settings',
  '/api/admin/website/reviews',
  '/api/admin/website/seo',
  '/api/admin/website/studio',
  '/api/admin/website/team',
  '/api/admin/website/work-with-us-content',
  '/api/dam/assets?limit=1',
  '/api/dam/initial-data',
  '/api/dam/settings',
  '/api/dam/tags',
  '/api/dam/team-members',
]

const failures = []

for (const [route, expected] of [...routeExpectations.entries()].sort()) {
  const response = await fetch(`${baseUrl}${route}`, { headers, redirect: 'manual' })
  const ok = expected.has(response.status)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${route}`)
  if (!ok) failures.push(`${route} returned ${response.status}`)
}

for (const route of readApis) {
  const response = await fetch(`${baseUrl}${route}`, { headers, redirect: 'manual' })
  const ok = response.status === 200
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${route}`)
  if (!ok) failures.push(`${route} returned ${response.status}`)
}

if (failures.length) {
  console.error(`\nAdmin live read acceptance failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`\nAdmin live read acceptance passed: ${routeExpectations.size} routes and ${readApis.length} APIs.`)
