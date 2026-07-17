#!/usr/bin/env node

const baseUrl = new URL(process.argv[2] || 'http://localhost:3000')
const canonicalOrigin = 'https://lashpopstudios.com'

const legacyRedirects = [
  ['/home', '/'],
  ['/about-us-1', '/#team'],
  ['/about-us-lashpop-studios', '/#team'],
  ['/about-us-home', '/#team'],
  ['/our-story', '/#team'],
  ['/meet-the-team', '/#team'],
  ['/join-us', '/work-with-us'],
  ['/book-contact-1', '/#find-us'],
  ['/faq', '/#faq'],
  ['/home-hero-image', '/'],
  ['/services-offered', '/services'],
  ['/location-homepage', '/#find-us'],
  ['/refer-a-friend', '/'],
  ['/referrals', '/'],
  ['/email-list', '/'],
  ['/cart', '/'],
  ['/search', '/'],
  ['/services/nails', '/services'],
  ['/services/lashpop-pro-training', '/work-with-us'],
  ['/services/lashes/hybrid', '/services/hybrid'],
]

function fail(message) {
  throw new Error(message)
}

function requestUrl(pathname) {
  return new URL(pathname, baseUrl).toString()
}

function normalizedPathAndHash(value) {
  const url = new URL(value, baseUrl)
  return `${url.pathname}${url.search}${url.hash}`
}

async function fetchChecked(pathname, init) {
  const response = await fetch(requestUrl(pathname), init)
  if (!response) fail(`No response for ${pathname}`)
  return response
}

async function mapInBatches(items, size, mapper) {
  const results = []
  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(mapper)))
  }
  return results
}

async function validateSitemap() {
  const response = await fetchChecked('/sitemap.xml', { redirect: 'manual' })
  if (response.status !== 200) fail(`sitemap.xml returned ${response.status}`)

  const xml = await response.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

  if (urls.length < 5) fail(`Expected at least 5 sitemap URLs; found ${urls.length}`)
  if (new Set(urls).size !== urls.length) fail('Sitemap contains duplicate URLs')

  for (const value of urls) {
    const url = new URL(value)
    if (url.origin !== canonicalOrigin) fail(`Non-canonical sitemap origin: ${value}`)
    if (url.pathname === '/llms.txt') fail('llms.txt must not be listed in the XML sitemap')
  }

  const checks = await mapInBatches(urls, 8, async (canonicalUrl) => {
    const canonical = new URL(canonicalUrl)
    const response = await fetchChecked(canonical.pathname, { redirect: 'manual' })
    const body = await response.text()
    const match = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    const pageCanonical = match?.[1]

    return {
      canonicalUrl,
      status: response.status,
      pageCanonical,
    }
  })

  const failures = checks.filter(
    (check) => check.status !== 200 || check.pageCanonical !== check.canonicalUrl,
  )

  if (failures.length > 0) {
    fail(`Sitemap URL validation failed:\n${JSON.stringify(failures, null, 2)}`)
  }

  return urls.length
}

async function validateLegacyRedirects() {
  const checks = await mapInBatches(legacyRedirects, 8, async ([source, expected]) => {
    const response = await fetchChecked(source, { redirect: 'manual' })
    const location = response.headers.get('location')
    return {
      source,
      expected,
      status: response.status,
      location: location ? normalizedPathAndHash(location) : null,
    }
  })

  const failures = checks.filter(
    (check) => ![301, 308].includes(check.status) || check.location !== check.expected,
  )

  if (failures.length > 0) {
    fail(`Legacy redirect validation failed:\n${JSON.stringify(failures, null, 2)}`)
  }

  return checks.length
}

async function validateRobotsAndHeaders() {
  const [home, robots] = await Promise.all([
    fetchChecked('/', { redirect: 'manual' }),
    fetchChecked('/robots.txt', { redirect: 'manual' }),
  ])

  const requiredHeaders = {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'SAMEORIGIN',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(self)',
  }

  for (const [name, expected] of Object.entries(requiredHeaders)) {
    const actual = home.headers.get(name)
    if (actual !== expected) fail(`Header ${name} was ${JSON.stringify(actual)}; expected ${JSON.stringify(expected)}`)
  }

  if (!home.headers.get('strict-transport-security')?.includes('max-age=')) {
    fail('Strict-Transport-Security is missing a max-age directive')
  }

  if (robots.status !== 200) fail(`robots.txt returned ${robots.status}`)
  const body = await robots.text()
  if (!body.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) {
    fail('robots.txt does not reference the canonical sitemap')
  }
  if (body.includes('Disallow: /_next/')) {
    fail('robots.txt blocks Next.js render assets under /_next/')
  }
}

async function main() {
  const [sitemapCount, redirectCount] = await Promise.all([
    validateSitemap(),
    validateLegacyRedirects(),
    validateRobotsAndHeaders(),
  ])

  console.log(`SEO migration validation passed against ${baseUrl.origin}`)
  console.log(`- ${sitemapCount} unique, self-canonical sitemap URLs returned 200`)
  console.log(`- ${redirectCount} legacy/bad-staging URLs redirected in one hop`)
  console.log('- robots.txt and launch security headers passed')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
