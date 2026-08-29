import sharp from 'sharp'

import {
  HOSTED_UPLOAD_LIMIT,
  buildRuntimeInventory,
  hostedImageDetails,
  loadEnvironment,
  localSourceFile,
  sourceUrl,
} from './lib.mjs'

loadEnvironment()

const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(8, concurrencyArg ? Number(concurrencyArg.split('=', 2)[1]) : 4))
const siteOrigin = process.env.LASHPOP_SITE_ORIGIN || 'https://lashpop.vercel.app'
const supportedContentTypes = new Set([
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
])

function normalizedContentType(value) {
  return String(value || '').split(';', 1)[0].trim().toLowerCase()
}

async function inspectSource(item) {
  if (item.descriptor.kind === 'site') {
    const local = await localSourceFile(item)
    const metadata = await sharp(local.absolute).metadata()
    const format = metadata.format === 'heif' ? 'heic' : metadata.format
    return {
      available: true,
      bitsPerSample: metadata.bitsPerSample || null,
      contentType: `image/${format}`,
      height: metadata.height,
      size: local.size,
      url: local.absolute,
      width: metadata.width,
    }
  }

  const url = sourceUrl(item.descriptor, item.originalUrl, siteOrigin)
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return {
      available: response.ok,
      contentType: normalizedContentType(response.headers.get('content-type')),
      size: Number(response.headers.get('content-length') || 0),
      status: response.status,
      url,
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
      status: 'network-error',
      url,
    }
  }
}

async function runPool(items, worker) {
  let index = 0
  const results = []
  async function runner() {
    while (index < items.length) {
      const item = items[index]
      index += 1
      results.push(await worker(item))
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner))
  return results
}

const inventory = await buildRuntimeInventory()
const rows = await runPool(inventory, async (item) => {
  const source = await inspectSource(item)
  const firstParty = item.descriptor.kind !== 'ext'
  let hosted = null
  let hostedError = null
  if (firstParty) {
    try {
      hosted = await hostedImageDetails(item.imageId)
    } catch (error) {
      hostedError = error instanceof Error ? error.message : String(error)
    }
  }
  const contentType = normalizedContentType(source.contentType)
  return {
    contentType,
    eligible: source.available && supportedContentTypes.has(contentType),
    firstParty,
    hosted: Boolean(hosted && !hosted.draft),
    hostedDraft: Boolean(hosted?.draft),
    hostedError,
    hostedMetadata: hosted?.meta || null,
    imageId: item.imageId,
    item,
    overHostedUploadLimit: source.size > HOSTED_UPLOAD_LIMIT,
    source,
  }
})

const countBy = (values, keyFor) => values.reduce((counts, value) => {
  const key = keyFor(value) || 'unknown'
  counts[key] = (counts[key] || 0) + 1
  return counts
}, {})
const exceptions = rows
  .filter((row) => !row.eligible || (row.firstParty && (!row.hosted || row.overHostedUploadLimit || row.hostedError)))
  .map((row) => ({
    canonical: row.item.canonical,
    contentType: row.contentType,
    eligible: row.eligible,
    firstParty: row.firstParty,
    hosted: row.hosted,
    hostedDraft: row.hostedDraft,
    hostedError: row.hostedError,
    hostedPreprocessing: row.hostedMetadata?.preprocessing || null,
    imageId: row.imageId,
    kind: row.item.descriptor.kind,
    overHostedUploadLimit: row.overHostedUploadLimit,
    references: row.item.references,
    sourceAvailable: row.source.available,
    sourceSize: row.source.size || 0,
    sourceStatus: row.source.status || 200,
    sourceUrl: row.source.url,
  }))
const firstPartyRows = rows.filter((row) => row.firstParty)
const externalRows = rows.filter((row) => !row.firstParty)
const summary = {
  inventory: rows.length,
  firstPartyInventory: firstPartyRows.length,
  externalOwnedInventory: externalRows.length,
  firstPartyEligible: firstPartyRows.filter((row) => row.eligible).length,
  firstPartyHostedReady: firstPartyRows.filter((row) => row.eligible && row.hosted).length,
  externalAvailable: externalRows.filter((row) => row.eligible).length,
  byKind: countBy(rows, (row) => row.item.descriptor.kind),
  byContentType: countBy(rows, (row) => row.contentType),
  firstPartyOverHostedUploadLimit: firstPartyRows.filter((row) => row.overHostedUploadLimit).length,
  managedHostedOriginals: firstPartyRows.filter((row) => row.hostedMetadata?.preprocessed).length,
  firstPartySourceUnavailable: firstPartyRows.filter((row) => !row.source.available).length,
  externalSourceUnavailable: externalRows.filter((row) => !row.source.available).length,
  eligibleFirstPartyHostedMissing: firstPartyRows.filter((row) => row.eligible && !row.hosted).length,
  hostedDrafts: firstPartyRows.filter((row) => row.hostedDraft).length,
  hostedLookupErrors: firstPartyRows.filter((row) => row.hostedError).length,
  exceptions,
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
if (
  summary.eligibleFirstPartyHostedMissing > 0
  || summary.hostedDrafts > 0
  || summary.hostedLookupErrors > 0
) {
  process.exitCode = 1
}
