import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  PROJECT_ROOT,
  buildRuntimeInventory,
  hostedImageDetails,
  hostedVariantId,
  imagesApi,
  legacyWorkerUrl,
  loadEnvironment,
} from './lib.mjs'

loadEnvironment()

const apply = process.argv.includes('--apply')
const workerArg = process.argv.find((arg) => arg.startsWith('--worker='))
const workerBase = workerArg
  ? workerArg.split('=', 2)[1]
  : process.env.LASHPOP_IMAGE_WORKER || 'https://lashpop-img-preview.experial.workers.dev'
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(8, concurrencyArg ? Number(concurrencyArg.split('=', 2)[1]) : 4))
const artifactsDir = path.join(PROJECT_ROOT, '.artifacts', 'cloudflare-images')

const OVERSIZED_SOURCE_IDS = new Set([
  'lp/65812e87532b1be2944eacad12bcc22df48e4a06912601e06dc880bbf0548bb3',
  'lp/23ee938fcb1970fc68363207a1ffb1c714963111f6729d499b37f7a3ee72fa6d',
])
const KNOWN_UNAVAILABLE_SOURCE_IDS = new Set([
  'lp/ccdde141564bc8cbf9c5d4f5a11d9eae5b2f23c1061f05c7da43312bbbdb07fa',
])
const WIDTHS = [64, 128, 256, 320, 384, 600, 900, 1200, 1440, 1600, 1800, 2400, 2880, 3200, 3840]
const FORMATS = ['avif', 'webp', 'jpeg']
const ACCEPTANCE_WIDTHS = [320, 600, 1600]

function transformFor(width, format) {
  return {
    width,
    height: 0,
    fit: 'scale-down',
    gravity: { x: 0.5, y: 0.5 },
    quality: width >= 3200 ? 78 : width >= 1800 ? 85 : 90,
    format,
    sharpen: 1,
  }
}

async function uploadVariant(task) {
  const variantId = hostedVariantId(task.item.imageId, task.transform)
  const existing = await hostedImageDetails(variantId)
  if (existing && !existing.draft) return { outcome: 'existing', variantId }

  const response = await fetch(legacyWorkerUrl(task.item.descriptor, {
    w: task.transform.width,
    q: task.transform.quality,
    f: task.transform.format,
    s: task.transform.sharpen,
    backend: 'legacy',
    precompute: 'exact-v1',
  }, workerBase))
  if (!response.ok) throw new Error(`Legacy variant fetch failed (${response.status})`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') || `image/${task.transform.format}`
  if (bytes.byteLength > 10 * 1024 * 1024) {
    throw new Error(`Exact variant is over the Hosted Images limit (${bytes.byteLength} bytes)`)
  }

  const form = new FormData()
  form.set('id', variantId)
  form.set('requireSignedURLs', 'false')
  form.set('metadata', JSON.stringify({
    lpVersion: 1,
    kind: 'exact-variant',
    sourceImageId: task.item.imageId,
    transform: task.transform,
  }))
  if (contentType === 'image/avif') {
    const wrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><metadata id="lp-exact" data-mime="image/avif">${bytes.toString('base64')}</metadata><rect width="1" height="1" fill="transparent"/></svg>`
    form.set('file', new Blob([wrapper], { type: 'image/svg+xml' }), `${variantId.split('/').pop()}.svg`)
  } else {
    form.set('file', new Blob([bytes], { type: contentType }), `${variantId.split('/').pop()}.${task.transform.format}`)
  }
  const result = await imagesApi('/images/v1', { method: 'POST', body: form })
  if (!result.response.ok || result.payload?.success === false) {
    const detail = result.payload?.errors?.map((error) => error.message).join('; ') || `HTTP ${result.response.status}`
    throw new Error(`Exact variant upload failed: ${detail}`)
  }
  return { outcome: 'uploaded', variantId }
}

async function runPool(tasks, worker) {
  let index = 0
  const results = []
  async function runner() {
    while (index < tasks.length) {
      const task = tasks[index]
      index += 1
      results.push(await worker(task))
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner))
  return results
}

const sources = (await buildRuntimeInventory()).filter((item) => !KNOWN_UNAVAILABLE_SOURCE_IDS.has(item.imageId))
const oversizedSources = sources.filter((item) => OVERSIZED_SOURCE_IDS.has(item.imageId))
if (oversizedSources.length !== OVERSIZED_SOURCE_IDS.size) {
  throw new Error(`Expected ${OVERSIZED_SOURCE_IDS.size} oversized sources, found ${oversizedSources.length}`)
}
const taskMap = new Map()
for (const item of sources) {
  for (const width of ACCEPTANCE_WIDTHS) {
    const transform = transformFor(width, 'avif')
    taskMap.set(hostedVariantId(item.imageId, transform), { item, transform })
  }
}
for (const item of oversizedSources) {
  for (const width of WIDTHS) {
    for (const format of FORMATS) {
      const transform = transformFor(width, format)
      taskMap.set(hostedVariantId(item.imageId, transform), { item, transform })
    }
  }
}
const tasks = [...taskMap.values()]
const summary = {
  mode: apply ? 'apply' : 'dry-run',
  sources: sources.length,
  oversizedSources: oversizedSources.length,
  acceptanceWidths: ACCEPTANCE_WIDTHS,
  widths: WIDTHS,
  formats: FORMATS,
  variants: tasks.length,
  existing: 0,
  uploaded: 0,
  failed: 0,
  failures: [],
}

if (apply) {
  await runPool(tasks, async (task) => {
    try {
      const result = await uploadVariant(task)
      summary[result.outcome] += 1
    } catch (error) {
      summary.failed += 1
      summary.failures.push({
        sourceImageId: task.item.imageId,
        width: task.transform.width,
        format: task.transform.format,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })
}

await mkdir(artifactsDir, { recursive: true })
await writeFile(path.join(artifactsDir, 'exact-variants-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
if (summary.failed > 0) process.exitCode = 1
