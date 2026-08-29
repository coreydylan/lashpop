import sharp from 'sharp'

import {
  DEFAULT_LEGACY_WORKER,
  buildRuntimeInventory,
  legacyWorkerUrl,
  loadEnvironment,
  localSourceFile,
  sourceUrl,
} from './lib.mjs'

loadEnvironment()

const workerArg = process.argv.find((arg) => arg.startsWith('--worker='))
const workerBase = workerArg ? workerArg.split('=', 2)[1] : DEFAULT_LEGACY_WORKER
const widthsArg = process.argv.find((arg) => arg.startsWith('--widths='))
const widths = (widthsArg ? widthsArg.split('=', 2)[1] : '320,600,1152,1440,1600,1728')
  .split(',')
  .map(Number)
  .filter((value) => Number.isFinite(value) && value > 0)
const formatsArg = process.argv.find((arg) => arg.startsWith('--formats='))
const formats = (formatsArg ? formatsArg.split('=', 2)[1] : 'avif,webp,jpeg')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter((value) => ['avif', 'webp', 'jpeg'].includes(value))
const idsArg = process.argv.find((arg) => arg.startsWith('--ids='))
const ids = idsArg ? new Set(idsArg.split('=', 2)[1].split(',').filter(Boolean)) : null
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=', 2)[1]) : Number.POSITIVE_INFINITY
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(8, concurrencyArg ? Number(concurrencyArg.split('=', 2)[1]) : 4))
const siteOrigin = process.env.LASHPOP_SITE_ORIGIN || 'https://lashpop.vercel.app'

if (widths.length === 0 || formats.length === 0) {
  throw new Error('At least one valid width and format are required')
}

async function sourceAvailable(item) {
  if (item.descriptor.kind === 'site') {
    try {
      await localSourceFile(item)
      return true
    } catch {
      return false
    }
  }
  try {
    const response = await fetch(sourceUrl(item.descriptor, item.originalUrl, siteOrigin), {
      method: 'HEAD',
      redirect: 'follow',
    })
    return response.ok
  } catch {
    return false
  }
}

function payloadFormat(metadata) {
  if (metadata.format === 'heif') return 'avif'
  if (metadata.format === 'jpg') return 'jpeg'
  return metadata.format
}

function contentTypeFormat(value) {
  const contentType = String(value || '').split(';', 1)[0].toLowerCase()
  if (contentType === 'image/avif') return 'avif'
  if (contentType === 'image/webp') return 'webp'
  if (contentType === 'image/jpeg') return 'jpeg'
  return null
}

function acceptedOutput(requested, actual) {
  if (requested === 'avif') return ['avif', 'webp', 'jpeg'].includes(actual)
  if (requested === 'webp') return ['webp', 'jpeg'].includes(actual)
  return actual === 'jpeg'
}

async function verify(task) {
  const quality = task.width >= 3200 ? 78 : task.width >= 1800 ? 85 : 90
  const url = legacyWorkerUrl(task.item.descriptor, {
    f: task.format,
    q: quality,
    s: 1,
    w: task.width,
  }, workerBase)
  try {
    const response = await fetch(url, { headers: { accept: `image/${task.format}` } })
    const headers = Object.fromEntries([
      'content-type',
      'x-lp-img-backend',
      'x-lp-img-error',
      'x-lp-img-fallback',
      'x-lp-img-format',
      'x-lp-img-id',
      'x-lp-img-requested-format',
      'x-lp-img-source',
    ].map((name) => [name, response.headers.get(name)]))
    if (!response.ok) return { ...task, headers, status: response.status, url, valid: false }
    const bytes = Buffer.from(await response.arrayBuffer())
    const metadata = await sharp(bytes).metadata()
    const actual = payloadFormat(metadata)
    const headerFormat = contentTypeFormat(headers['content-type'])
    const valid = headers['x-lp-img-backend'] === 'hosted'
      && headers['x-lp-img-source'] === 'cloudflare-images'
      && /^lp\/[a-f0-9]{64}$/.test(headers['x-lp-img-id'] || '')
      && !headers['x-lp-img-fallback']
      && !headers['x-lp-img-error']
      && headers['x-lp-img-format'] === actual
      && headerFormat === actual
      && acceptedOutput(task.format, actual)
      && (task.format === actual
        ? !headers['x-lp-img-requested-format']
        : headers['x-lp-img-requested-format'] === task.format)
      && Number(metadata.width) > 0
      && Number(metadata.width) <= task.width
      && Number(metadata.height) > 0
    return {
      ...task,
      actualFormat: actual,
      bytes: bytes.length,
      headers,
      height: metadata.height,
      status: response.status,
      url,
      valid,
      outputWidth: metadata.width,
    }
  } catch (error) {
    return { ...task, error: error instanceof Error ? error.message : String(error), url, valid: false }
  }
}

async function runPool(tasks) {
  let index = 0
  const results = []
  async function runner() {
    while (index < tasks.length) {
      const task = tasks[index]
      index += 1
      results.push(await verify(task))
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner))
  return results
}

const inventory = (await buildRuntimeInventory()).filter((item) => item.descriptor.kind !== 'ext')
const filtered = (ids ? inventory.filter((item) => ids.has(item.imageId)) : inventory).slice(0, limit)
const availability = await Promise.all(filtered.map(async (item) => ({ item, available: await sourceAvailable(item) })))
const eligible = availability.filter(({ available }) => available).map(({ item }) => item)
const unavailable = availability.filter(({ available }) => !available).map(({ item }) => item.imageId)
const tasks = eligible.flatMap((item) => widths.flatMap((width) => formats.map((format) => ({
  format,
  imageId: item.imageId,
  item,
  width,
}))))
const results = await runPool(tasks)
const failures = results.filter((result) => !result.valid).map(({ item, ...failure }) => ({
  canonical: item.canonical,
  ...failure,
})).slice(0, 100)
const summary = {
  workerBase,
  firstPartyInventory: filtered.length,
  eligibleSources: eligible.length,
  unavailableSources: unavailable,
  widths,
  formats,
  requests: results.length,
  hosted: results.filter((result) => result.headers?.['x-lp-img-backend'] === 'hosted').length,
  valid: results.filter((result) => result.valid).length,
  actualFormats: results.reduce((counts, result) => {
    if (result.actualFormat) counts[result.actualFormat] = (counts[result.actualFormat] || 0) + 1
    return counts
  }, {}),
  failures,
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
if (failures.length > 0 || summary.valid !== summary.requests) process.exitCode = 1
