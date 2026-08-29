import {
  accountHashFromImage,
  buildRuntimeInventory,
  canonicalSourceForUrl,
  hostedImageDetails,
  loadEnvironment,
} from './lib.mjs'

loadEnvironment()

const apply = process.argv.includes('--apply')
const confirmArg = process.argv.find((arg) => arg.startsWith('--confirm='))
if (apply && confirmArg !== '--confirm=direct-cloudflare-images') {
  throw new Error('Apply requires --confirm=direct-cloudflare-images')
}

const databaseUrl = process.env.CLOUDFLARE_DB_URL?.replace(/\/$/, '')
const databaseToken = process.env.CLOUDFLARE_DB_TOKEN
if (!databaseUrl || !databaseToken) throw new Error('Production database bridge is required')

async function query(sql, params = [], method = 'all') {
  const response = await fetch(`${databaseUrl}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${databaseToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params, method }),
  })
  if (!response.ok) throw new Error(`Database query failed (${response.status})`)
  const payload = await response.json()
  return payload.rows ?? []
}

function directUrl(accountHash, imageId) {
  return `https://imagedelivery.net/${accountHash}/${imageId}/public`
}

const inventory = await buildRuntimeInventory()
const hostedByCanonical = new Map()
let accountHash = null
for (const item of inventory) {
  const image = await hostedImageDetails(item.imageId)
  if (!image || image.draft) continue
  accountHash ||= accountHashFromImage(image)
  hostedByCanonical.set(item.canonical, { item, image })
}
if (!accountHash) throw new Error('Cloudflare Images account hash was not discoverable')

const now = Date.now()
const registryRows = []
for (const { item } of hostedByCanonical.values()) {
  if (item.descriptor.kind === 'ext') continue
  registryRows.push({
    sourceKey: item.canonical,
    sourceKind: item.descriptor.kind,
    sourceUrl: item.originalUrl,
    imageId: item.imageId,
    deliveryUrl: directUrl(accountHash, item.imageId),
  })
}

const serviceRows = await query(`
  SELECT id, vagaro_service_id, vagaro_image_url
  FROM services
  WHERE vagaro_image_url IS NOT NULL AND vagaro_image_url != ''
`)
const staffRows = await query(`
  SELECT id, vagaro_public_provider_id, vagaro_photo_url
  FROM team_members
  WHERE vagaro_photo_url IS NOT NULL AND vagaro_photo_url != ''
`)

const externalUpdates = []
const missingExternalSources = []
function collectExternalUpdates(rows, table, idKind) {
  for (const [id, externalId, sourceUrl] of rows) {
    if (!externalId || typeof sourceUrl !== 'string' || sourceUrl.includes('imagedelivery.net')) continue
    const descriptor = canonicalSourceForUrl(sourceUrl)
    if (!descriptor || descriptor.kind !== 'ext') continue
    const canonical = `ext:${descriptor.locator}`
    const hosted = hostedByCanonical.get(canonical)
    if (!hosted) {
      missingExternalSources.push({ table, id, externalId, sourceUrl })
      continue
    }
    externalUpdates.push({
      table,
      id,
      sourceKey: `vagaro:${idKind}:${externalId}`,
      sourceKind: `vagaro-${idKind}`,
      sourceUrl,
      imageId: hosted.item.imageId,
      deliveryUrl: directUrl(accountHash, hosted.item.imageId),
    })
  }
}
collectExternalUpdates(serviceRows, 'services', 'service')
collectExternalUpdates(staffRows, 'team_members', 'staff')

if (apply && missingExternalSources.length > 0) {
  throw new Error(`Refusing direct migration: ${missingExternalSources.length} Vagaro image sources are not hosted`)
}

if (apply) {
  for (const row of [...registryRows, ...externalUpdates]) {
    await query(`
      INSERT INTO public_image_sources (
        source_key, source_kind, source_url, cloudflare_image_id, delivery_url,
        status, failure_count, checked_at, ingested_at, refreshed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'ready', 0, ?, ?, ?, ?, ?)
      ON CONFLICT(source_key) DO UPDATE SET
        source_kind = excluded.source_kind,
        source_url = excluded.source_url,
        cloudflare_image_id = excluded.cloudflare_image_id,
        delivery_url = excluded.delivery_url,
        status = 'ready', failure_count = 0, last_error = NULL,
        checked_at = excluded.checked_at,
        refreshed_at = excluded.refreshed_at,
        updated_at = excluded.updated_at
    `, [row.sourceKey, row.sourceKind, row.sourceUrl, row.imageId, row.deliveryUrl, now, now, now, now, now], 'run')
  }

  for (const row of externalUpdates) {
    if (row.table === 'services') {
      await query(
        'UPDATE services SET vagaro_image_source_url = ?, vagaro_image_url = ?, updated_at = ? WHERE id = ?',
        [row.sourceUrl, row.deliveryUrl, now, row.id],
        'run',
      )
    } else {
      await query(
        'UPDATE team_members SET vagaro_photo_source_url = ?, vagaro_photo_url = ?, updated_at = ? WHERE id = ?',
        [row.sourceUrl, row.deliveryUrl, now, row.id],
        'run',
      )
    }
  }
}

process.stdout.write(`${JSON.stringify({
  mode: apply ? 'apply' : 'plan',
  accountHash,
  hostedInventory: hostedByCanonical.size,
  firstPartyRegistryRows: registryRows.length,
  externalUpdates: externalUpdates.length,
  serviceUpdates: externalUpdates.filter((row) => row.table === 'services').length,
  staffUpdates: externalUpdates.filter((row) => row.table === 'team_members').length,
  missingExternalSources,
  publicDnsChanged: false,
}, null, 2)}\n`)
