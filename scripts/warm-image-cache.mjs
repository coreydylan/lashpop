#!/usr/bin/env node
// Warm the Cloudflare Images-native delivery URLs emitted by the public site.
// No request in this script depends on lashpop-img or a third-party source.

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'https://lashpop.vercel.app'
const PAGES = ['/', '/services', '/work-with-us']
const ACCEPTS = [
  'image/avif,image/webp,image/apng,*/*',
  'image/webp,*/*',
  'image/jpeg,*/*',
]

const urls = new Set()
for (const path of PAGES) {
  const response = await fetch(new URL(path, BASE))
  if (!response.ok) throw new Error(`${path} returned ${response.status}`)
  const html = await response.text()
  for (const match of html.matchAll(/https:\/\/imagedelivery\.net\/[^"'\\\s<]+/g)) {
    urls.add(match[0].replaceAll('&amp;', '&'))
  }
}

const jobs = [...urls].flatMap((url) => ACCEPTS.map((accept) => ({ url, accept })))
let completed = 0
let failed = 0
await Promise.all(Array.from({ length: 12 }, async () => {
  while (jobs.length > 0) {
    const job = jobs.pop()
    if (!job) break
    try {
      const response = await fetch(job.url, { headers: { accept: job.accept } })
      await response.arrayBuffer()
      if (!response.ok) failed += 1
    } catch {
      failed += 1
    }
    completed += 1
  }
}))

process.stdout.write(`${JSON.stringify({ base: BASE, variants: urls.size, requests: completed, failed })}\n`)
if (failed > 0) process.exitCode = 1
