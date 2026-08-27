import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import {
  DEFAULT_LEGACY_WORKER,
  PROJECT_ROOT,
  buildRuntimeInventory,
  legacyWorkerUrl,
  loadEnvironment,
} from './lib.mjs'

loadEnvironment()

const workerArg = process.argv.find((arg) => arg.startsWith('--worker='))
const workerBase = workerArg ? workerArg.split('=', 2)[1] : process.env.LASHPOP_IMAGE_WORKER || DEFAULT_LEGACY_WORKER
const widthsArg = process.argv.find((arg) => arg.startsWith('--widths='))
const widths = (widthsArg ? widthsArg.split('=', 2)[1] : '320,600,1600')
  .split(',')
  .map(Number)
  .filter((value) => Number.isFinite(value) && value > 0)
const formatsArg = process.argv.find((arg) => arg.startsWith('--formats='))
const formats = (formatsArg ? formatsArg.split('=', 2)[1] : 'avif,webp,jpeg')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter((value) => ['avif', 'webp', 'jpeg'].includes(value))
if (widths.length === 0 || formats.length === 0) {
  throw new Error('At least one valid width and format are required')
}
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=', 2)[1]) : Number.POSITIVE_INFINITY
const requireExactPixels = process.argv.includes('--require-exact-pixels')
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(8, concurrencyArg ? Number(concurrencyArg.split('=', 2)[1]) : 4))
const artifactsDir = path.join(PROJECT_ROOT, '.artifacts', 'cloudflare-images')

async function decoded(response) {
  const bytes = Buffer.from(await response.arrayBuffer())
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, info, bytes: bytes.length }
}

async function compare(item, width, format) {
  const options = { w: width, q: width >= 3200 ? 78 : width >= 1800 ? 85 : 90, f: format, s: 1 }
  const legacyUrl = legacyWorkerUrl(item.descriptor, { ...options, backend: 'legacy' }, workerBase)
  const hostedUrl = legacyWorkerUrl(item.descriptor, { ...options, backend: 'hosted' }, workerBase)
  const accept = `image/${format}`
  const [legacyResponse, hostedResponse] = await Promise.all([
    fetch(legacyUrl, { headers: { accept } }),
    fetch(hostedUrl, { headers: { accept } }),
  ])

  if (!legacyResponse.ok || !hostedResponse.ok) {
    const statusParity = legacyResponse.status === hostedResponse.status
    return {
      imageId: item.imageId,
      width,
      format,
      legacyStatus: legacyResponse.status,
      hostedStatus: hostedResponse.status,
      hostedBackend: hostedResponse.headers.get('x-lp-img-backend'),
      statusParity,
      dimensionParity: statusParity,
      exactPixels: statusParity,
      expectedUnavailable: statusParity,
    }
  }

  const [legacy, hosted] = await Promise.all([decoded(legacyResponse), decoded(hostedResponse)])
  const dimensionParity = legacy.info.width === hosted.info.width && legacy.info.height === hosted.info.height
  let differentBytes = Number.POSITIVE_INFINITY
  let meanAbsoluteError = Number.POSITIVE_INFINITY
  if (dimensionParity && legacy.data.length === hosted.data.length) {
    differentBytes = 0
    let totalDelta = 0
    for (let index = 0; index < legacy.data.length; index += 1) {
      const delta = Math.abs(legacy.data[index] - hosted.data[index])
      if (delta > 0) differentBytes += 1
      totalDelta += delta
    }
    meanAbsoluteError = totalDelta / legacy.data.length
  }

  return {
    imageId: item.imageId,
    width,
    format,
    legacyStatus: legacyResponse.status,
    hostedStatus: hostedResponse.status,
    hostedBackend: hostedResponse.headers.get('x-lp-img-backend'),
    statusParity: true,
    dimensionParity,
    exactPixels: dimensionParity && differentBytes === 0,
    differentBytes,
    meanAbsoluteError,
    legacyBytes: legacy.bytes,
    hostedBytes: hosted.bytes,
  }
}

async function runPool(tasks) {
  let index = 0
  const results = []
  async function runner() {
    while (index < tasks.length) {
      const task = tasks[index]
      index += 1
      try {
        results.push(await compare(task.item, task.width, task.format))
      } catch (error) {
        results.push({
          imageId: task.item.imageId,
          width: task.width,
          format: task.format,
          statusParity: false,
          dimensionParity: false,
          exactPixels: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner))
  return results
}

const inventory = (await buildRuntimeInventory()).slice(0, limit)
const tasks = inventory.flatMap((item) => widths.flatMap((width) => formats.map((format) => ({
  item,
  width,
  format,
}))))
const results = await runPool(tasks)
const availableResults = results.filter((result) => result.legacyStatus === 200)
const summary = {
  workerBase,
  images: inventory.length,
  widths,
  formats,
  comparisons: results.length,
  availableComparisons: availableResults.length,
  expectedUnavailableComparisons: results.filter((result) => result.expectedUnavailable).length,
  statusParity: results.filter((result) => result.statusParity).length,
  hostedCoverage: availableResults.filter((result) => result.hostedBackend === 'hosted').length,
  dimensionParity: results.filter((result) => result.dimensionParity).length,
  exactPixels: results.filter((result) => result.exactPixels).length,
  maxMeanAbsoluteError: Math.max(0, ...results.map((result) => Number.isFinite(result.meanAbsoluteError) ? result.meanAbsoluteError : 0)),
  nonExactPixels: results
    .filter((result) => result.dimensionParity && !result.exactPixels)
    .map(({ imageId, width, format, differentBytes, meanAbsoluteError }) => ({
      imageId,
      width,
      format,
      differentBytes,
      meanAbsoluteError,
    }))
    .slice(0, 50),
  failures: results.filter((result) =>
    !result.statusParity ||
    !result.dimensionParity ||
    (result.legacyStatus === 200 && result.hostedBackend !== 'hosted')
  ).slice(0, 50),
}

await mkdir(artifactsDir, { recursive: true })
await writeFile(path.join(artifactsDir, 'parity-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

const contractComplete = summary.statusParity === summary.comparisons &&
  summary.hostedCoverage === summary.availableComparisons &&
  summary.dimensionParity === summary.comparisons
const pixelComplete = !requireExactPixels || summary.exactPixels === summary.comparisons
if (!contractComplete || !pixelComplete) process.exitCode = 1
