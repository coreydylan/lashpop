import sharp from 'sharp'

import {
  buildRuntimeInventory,
  hostedImageDetails,
  loadEnvironment,
} from './lib.mjs'

loadEnvironment()

const widthsArg = process.argv.find((arg) => arg.startsWith('--widths='))
const widths = (widthsArg ? widthsArg.split('=', 2)[1] : '320,600,1152,1440,1728')
  .split(',').map(Number).filter((value) => Number.isFinite(value) && value > 0)
const formatsArg = process.argv.find((arg) => arg.startsWith('--formats='))
const formats = (formatsArg ? formatsArg.split('=', 2)[1] : 'avif,webp,jpeg')
  .split(',').map((value) => value.trim()).filter(Boolean)
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(8, Number(concurrencyArg?.split('=', 2)[1] || 6)))
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=', 2)[1]) : Number.POSITIVE_INFINITY

function accepted(requested, actual) {
  if (requested === 'avif') return ['avif', 'webp', 'jpeg'].includes(actual)
  if (requested === 'webp') return ['webp', 'jpeg'].includes(actual)
  return actual === 'jpeg'
}

function acceptHeader(format) {
  if (format === 'avif') return 'image/avif,image/webp,image/*,*/*'
  if (format === 'webp') return 'image/webp,image/*,*/*'
  return 'image/jpeg,*/*'
}

function payloadFormat(metadata) {
  if (metadata.format === 'heif') return 'avif'
  if (metadata.format === 'jpg') return 'jpeg'
  return metadata.format
}

const inventory = (await buildRuntimeInventory()).slice(0, limit)
const sources = []
const unavailable = []
for (const item of inventory) {
  const image = await hostedImageDetails(item.imageId)
  if (!image || image.draft) {
    unavailable.push(item.imageId)
    continue
  }
  const publicVariant = (image.variants || []).find((variant) => variant.endsWith('/public'))
  if (!publicVariant) throw new Error(`No public Cloudflare Images delivery URL for ${item.imageId}`)
  sources.push({ item, publicVariant })
}

const tasks = sources.flatMap(({ item, publicVariant }) => widths.flatMap((width) => formats.map((format) => ({
  item,
  publicVariant,
  width,
  format,
}))))
const results = []
let index = 0

async function verify(task) {
  const quality = task.width >= 3200 ? 78 : task.width >= 1800 ? 85 : 90
  const url = task.publicVariant.replace(/\/public$/, `/w=${task.width},q=${quality},fit=scale-down,metadata=none`)
  try {
    const response = await fetch(url, { headers: { accept: acceptHeader(task.format) } })
    const bytes = Buffer.from(await response.arrayBuffer())
    const metadata = response.ok ? await sharp(bytes).metadata() : {}
    const actual = payloadFormat(metadata)
    return {
      imageId: task.item.imageId,
      canonical: task.item.canonical,
      width: task.width,
      format: task.format,
      actual,
      status: response.status,
      valid: response.ok
        && new URL(url).hostname === 'imagedelivery.net'
        && accepted(task.format, actual)
        && Number(metadata.width) > 0
        && Number(metadata.width) <= task.width
        && Number(metadata.height) > 0,
    }
  } catch (error) {
    return { imageId: task.item.imageId, canonical: task.item.canonical, width: task.width, format: task.format, valid: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function runner() {
  while (index < tasks.length) {
    const task = tasks[index++]
    results.push(await verify(task))
  }
}
await Promise.all(Array.from({ length: concurrency }, runner))

const failures = results.filter((result) => !result.valid).slice(0, 100)
const summary = {
  deliveryHost: 'imagedelivery.net',
  inventory: inventory.length,
  hostedSources: sources.length,
  unavailable,
  widths,
  formats,
  requests: results.length,
  valid: results.filter((result) => result.valid).length,
  actualFormats: results.reduce((counts, result) => {
    if (result.actual) counts[result.actual] = (counts[result.actual] || 0) + 1
    return counts
  }, {}),
  failures,
}
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
if (failures.length > 0) process.exitCode = 1
