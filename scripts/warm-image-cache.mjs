#!/usr/bin/env node
// Warm the lashpop-img worker's edge cache for every image variant the site
// can request, across the three negotiated format buckets (avif/webp/jpeg).
//
// WHY: transformed variants are edge-cached immutable for a year, but the
// FIRST request per variant pays a 0.5-2s cold transform (origin fetch +
// Images-binding decode/encode). After any deploy that changes image URLs
// (new file, new quality param) everything goes cold at once — run this to
// eat those transforms before a visitor does.
//
// CAVEAT: the Workers cache is per-colo. Warming from SoCal warms the colo
// that serves Oceanside customers — which is the traffic that matters.
//
// Usage: node scripts/warm-image-cache.mjs [--base https://lashpop.vercel.app]

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'https://lashpop.vercel.app'
const WORKER = 'https://lashpop-img.experial.workers.dev'
const PAGES = ['/', '/work-with-us']

// Accept strings covering the worker's three format buckets.
const ACCEPTS = [
  'image/avif,image/webp,image/apng,*/*',
  'image/webp,*/*',
  '*/*',
]

// Width->quality mirror of cf-image-loader's curve.
const q = (w) => (w >= 3200 ? 78 : w >= 1800 ? 85 : 90)

const urls = new Set()

for (const path of PAGES) {
  const html = await (await fetch(BASE + path)).text()

  // (a) fully-formed worker URLs already in srcsets (entity-decode &amp;)
  for (const m of html.matchAll(/https:\/\/lashpop-img\.experial\.workers\.dev\/[^"'\\\s]+/g)) {
    urls.add(m[0].replace(/&amp;/g, '&'))
  }

  // (b) raw R2 refs (RSC payload) -> carousel thumb + lightbox tiers
  for (const m of html.matchAll(/https:\/\/pub-[a-f0-9]+\.r2\.dev\/([^"'\\\s)]+)/g)) {
    const key = m[1]
    for (const w of [384, 600, 900]) urls.add(`${WORKER}/${key}?w=${w}&q=${q(w)}`)
    urls.add(`${WORKER}/${key}?w=1600&q=90`) // lightbox prefetch URL shape
  }

  // (c) local /public image refs -> /site tiers
  for (const m of html.matchAll(/\/lashpop-images\/[^"'\\\s?]+\.(?:jpe?g|png|webp)/gi)) {
    for (const w of [600, 900, 1200, 1800, 2400, 3200, 3840]) {
      urls.add(`${WORKER}/site${m[0]}?w=${w}&q=${q(w)}`)
    }
  }

  // (d) Vagaro rackcdn refs -> /ext tiers
  for (const m of html.matchAll(/https:\/\/[a-z0-9-]+\.ssl\.cf2\.rackcdn\.com\/[^"'\\\s]+/gi)) {
    const u = m[0].replace(/&amp;/g, '&')
    for (const w of [256, 384, 600, 900, 1200]) {
      urls.add(`${WORKER}/ext?url=${encodeURIComponent(u)}&w=${w}&q=${q(w)}`)
    }
  }
}

const jobs = []
for (const u of urls) for (const a of ACCEPTS) jobs.push([u, a])
console.log(`${urls.size} variant URLs x ${ACCEPTS.length} formats = ${jobs.length} requests`)

const t0 = Date.now()
let done = 0, failed = 0
const CONCURRENCY = 12
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (jobs.length) {
      const [u, a] = jobs.pop()
      try {
        const r = await fetch(u, { headers: { Accept: a } })
        if (!r.ok) failed++
        await r.arrayBuffer()
      } catch {
        failed++
      }
      if (++done % 100 === 0) console.log(`  ${done} done...`)
    }
  })
)
console.log(`warmed ${done} (${failed} failed) in ${Math.round((Date.now() - t0) / 1000)}s`)
