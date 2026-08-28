import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import {
  DEFAULT_LEGACY_WORKER,
  HOSTED_UPLOAD_LIMIT,
  PROJECT_ROOT,
  accountHashFromImage,
  buildRuntimeInventory,
  hostedImageDetails,
  imagesApi,
  legacyWorkerUrl,
  loadEnvironment,
  localSourceFile,
  sha256,
  sourceUrl,
} from './lib.mjs'

loadEnvironment()

const apply = process.argv.includes('--apply')
const replacePreprocessed = process.argv.includes('--replace-preprocessed')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=', 2)[1]) : Number.POSITIVE_INFINITY
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(10, concurrencyArg ? Number(concurrencyArg.split('=', 2)[1]) : 4))
const siteOrigin = process.env.LASHPOP_SITE_ORIGIN || 'https://lashpop.vercel.app'
const legacyWorker = process.env.LASHPOP_IMAGE_WORKER || DEFAULT_LEGACY_WORKER
const artifactsDir = path.join(PROJECT_ROOT, '.artifacts', 'cloudflare-images')

async function inspectSource(item) {
  if (item.descriptor.kind === 'site') {
    const local = await localSourceFile(item)
    return { available: true, size: local.size, local }
  }

  const url = sourceUrl(item.descriptor, item.originalUrl, siteOrigin)
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return {
      available: response.ok,
      status: response.status,
      size: Number(response.headers.get('content-length') || 0),
      contentType: response.headers.get('content-type'),
      url,
    }
  } catch (error) {
    return { available: false, status: 'network-error', error: error instanceof Error ? error.message : String(error), url }
  }
}

async function uploadItem(item, source) {
  const existing = await hostedImageDetails(item.imageId)
  const replaceWithLosslessPng = replacePreprocessed &&
    source.size > HOSTED_UPLOAD_LIMIT &&
    /^image\/png/i.test(source.contentType || '')
  if (existing && !existing.draft && !replaceWithLosslessPng) {
    return { outcome: 'existing', image: existing }
  }

  const transformedUrl = () => legacyWorkerUrl(item.descriptor, {
        w: 3840,
        q: 95,
        f: 'jpeg',
        s: 0,
        backend: 'legacy',
      }, legacyWorker)

  async function formForUpload(forceTransform = false) {
    const form = new FormData()
    form.set('id', item.imageId)
    form.set('requireSignedURLs', 'false')
    form.set('metadata', JSON.stringify({
      lpVersion: 1,
      kind: item.descriptor.kind,
      sourceHash: sha256(item.canonical),
      references: item.references.slice(0, 6),
      preprocessed: forceTransform || source.size > HOSTED_UPLOAD_LIMIT,
    }))

    if (source.size > HOSTED_UPLOAD_LIMIT && /^image\/png/i.test(source.contentType || '')) {
      return formForLosslessPng()
    } else if (source.local && !forceTransform) {
      const bytes = await readFile(source.local.absolute)
      form.set('file', new Blob([bytes]), path.basename(source.local.absolute))
    } else {
      form.set('url', forceTransform || source.size > HOSTED_UPLOAD_LIMIT ? transformedUrl() : source.url)
    }
    return form
  }

  async function formForLosslessPng() {
    const response = await fetch(source.url)
    if (!response.ok) throw new Error(`Oversized PNG download failed (${response.status})`)
    const original = Buffer.from(await response.arrayBuffer())
    const metadata = await sharp(original).metadata()
    let losslessPipeline = sharp(original).keepMetadata()
    if (metadata.bitsPerSample === 16 || metadata.depth === 'ushort' || metadata.space === 'rgb16') {
      losslessPipeline = losslessPipeline.toColourspace('rgb16')
    }
    const [originalPixels, converted] = await Promise.all([
      sharp(original).ensureAlpha().raw().toBuffer(),
      losslessPipeline.png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer(),
    ])
    let normalized = converted
    if (normalized.byteLength > HOSTED_UPLOAD_LIMIT) {
      const normalizedResponse = await fetch(legacyWorkerUrl(item.descriptor, {
        w: 3840,
        f: 'png',
        s: 0,
        backend: 'legacy',
        normalize: 'lossless-png-v1',
      }, legacyWorker))
      if (!normalizedResponse.ok) {
        throw new Error(`Cloudflare PNG normalization failed (${normalizedResponse.status})`)
      }
      normalized = Buffer.from(await normalizedResponse.arrayBuffer())
    }
    if (normalized.byteLength > HOSTED_UPLOAD_LIMIT) {
      throw new Error(`Lossless PNG remains over the Hosted Images limit (${normalized.byteLength} bytes)`)
    }
    const convertedPixels = await sharp(normalized).ensureAlpha().raw().toBuffer()
    if (Buffer.compare(originalPixels, convertedPixels) !== 0) {
      throw new Error('Lossless PNG normalization changed decoded pixels')
    }
    const form = new FormData()
    form.set('id', item.imageId)
    form.set('requireSignedURLs', 'false')
    form.set('metadata', JSON.stringify({
      lpVersion: 1,
      kind: item.descriptor.kind,
      sourceHash: sha256(item.canonical),
      references: item.references.slice(0, 6),
      preprocessed: true,
      preprocessing: 'lossless-png',
    }))
    form.set('file', new Blob([normalized], { type: 'image/png' }), `${item.imageId.slice(3)}.png`)
    return form
  }

  if (replaceWithLosslessPng && existing && !existing.draft) {
    const replacement = await formForLosslessPng()
    const deleted = await imagesApi(`/images/v1/${encodeURIComponent(item.imageId)}`, { method: 'DELETE' })
    if (!deleted.response.ok) throw new Error(`Could not replace preprocessed image (${deleted.response.status})`)
    const result = await imagesApi('/images/v1', { method: 'POST', body: replacement })
    if (!result.response.ok || result.payload?.success === false) {
      const detail = result.payload?.errors?.map((error) => error.message).join('; ') || `HTTP ${result.response.status}`
      throw new Error(`Lossless Hosted Images replacement failed: ${detail}`)
    }
    return { outcome: 'uploaded', image: result.payload.result }
  }

  async function formForLocalTranscode() {
    const response = await fetch(source.url)
    if (!response.ok) throw new Error(`Source download for local transcode failed (${response.status})`)
    const original = Buffer.from(await response.arrayBuffer())
    let quality = 95
    let converted = await sharp(original)
      .rotate()
      .resize({ width: 3840, height: 4096, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer()
    while (converted.byteLength > HOSTED_UPLOAD_LIMIT && quality > 60) {
      quality -= 5
      converted = await sharp(original)
        .rotate()
        .resize({ width: 3840, height: 4096, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer()
    }
    const form = new FormData()
    form.set('id', item.imageId)
    form.set('requireSignedURLs', 'false')
    form.set('metadata', JSON.stringify({
      lpVersion: 1,
      kind: item.descriptor.kind,
      sourceHash: sha256(item.canonical),
      references: item.references.slice(0, 6),
      preprocessed: true,
      preprocessing: 'sharp-jpeg',
    }))
    form.set('file', new Blob([converted], { type: 'image/jpeg' }), `${item.imageId.slice(3)}.jpg`)
    return form
  }

  let result = await imagesApi('/images/v1', { method: 'POST', body: await formForUpload() })
  if ((!result.response.ok || result.payload?.success === false) && !source.local && source.size <= HOSTED_UPLOAD_LIMIT) {
    const detail = result.payload?.errors?.map((error) => error.message).join('; ') || ''
    // Some recovered objects have stale MIME metadata or an extension that no
    // longer matches their bytes. The proven legacy decoder normalizes those
    // edge cases to JPEG without changing the deterministic Hosted Images ID.
    if (/content-type|format|decode|image\//i.test(detail)) {
      result = await imagesApi('/images/v1', { method: 'POST', body: await formForUpload(true) })
    }
  }
  if ((!result.response.ok || result.payload?.success === false) && !source.local) {
    const detail = result.payload?.errors?.map((error) => error.message).join('; ') || ''
    if (/content-type|format|decode|image\/|fetch|transform/i.test(detail)) {
      result = await imagesApi('/images/v1', { method: 'POST', body: await formForLocalTranscode() })
    }
  }
  if (!result.response.ok || result.payload?.success === false) {
    const detail = result.payload?.errors?.map((error) => error.message).join('; ') || `HTTP ${result.response.status}`
    throw new Error(`Cloudflare image upload failed: ${detail}`)
  }
  return { outcome: 'uploaded', image: result.payload.result }
}

async function runPool(items, worker) {
  let index = 0
  const results = []
  async function runner() {
    while (index < items.length) {
      const current = items[index]
      index += 1
      results.push(await worker(current))
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner))
  return results
}

const inventory = (await buildRuntimeInventory()).slice(0, limit)
const summary = {
  mode: apply ? 'apply' : 'dry-run',
  inventory: inventory.length,
  byKind: inventory.reduce((counts, item) => {
    counts[item.descriptor.kind] = (counts[item.descriptor.kind] || 0) + 1
    return counts
  }, {}),
  available: 0,
  unavailable: 0,
  oversized: 0,
  existing: 0,
  uploaded: 0,
  failed: 0,
  accountHash: null,
  failures: [],
}

const inspected = await runPool(inventory, async (item) => {
  const source = await inspectSource(item)
  if (source.available) summary.available += 1
  else summary.unavailable += 1
  if (source.size > HOSTED_UPLOAD_LIMIT) summary.oversized += 1
  return { item, source }
})

if (apply) {
  await runPool(inspected.filter(({ source }) => source.available), async ({ item, source }) => {
    try {
      const result = await uploadItem(item, source)
      summary[result.outcome] += 1
      summary.accountHash ||= accountHashFromImage(result.image)
    } catch (error) {
      summary.failed += 1
      summary.failures.push({
        imageId: item.imageId,
        kind: item.descriptor.kind,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })
}

await mkdir(artifactsDir, { recursive: true })
await writeFile(path.join(artifactsDir, 'backfill-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
if (summary.failed > 0) process.exitCode = 1
