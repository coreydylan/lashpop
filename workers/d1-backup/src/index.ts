interface Env {
  DB: D1Database
  BACKUPS: R2Bucket
  BACKUP_PREFIX: string
  RETENTION_DAYS: string
  MANUAL_TRIGGER_SECRET?: string
}

interface SchemaRow {
  name: string
  sql: string | null
}

interface BackupPart {
  key: string
  rows: number
  bytes: number
  sha256: string
}

interface TableBackup {
  name: string
  ddl: string | null
  rowCount: number
  parts: BackupPart[]
}

interface BackupManifest {
  format: 'lashpop-d1-ndjson-v1'
  database: 'lashpop-production'
  startedAt: string
  completedAt: string
  prefix: string
  tableCount: number
  rowCount: number
  tables: TableBackup[]
}

const PAGE_SIZE = 1_000
const encoder = new TextEncoder()

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function serializeValue(value: unknown): unknown {
  if (value instanceof ArrayBuffer) {
    return { $type: 'base64', value: base64(new Uint8Array(value)) }
  }
  if (ArrayBuffer.isView(value)) {
    return {
      $type: 'base64',
      value: base64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    }
  }
  return value
}

function serializeRow(row: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, serializeValue(value)])),
  )
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function timestampPrefix(base: string, now: Date): string {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '/')
  const stamp = now.toISOString().replaceAll(':', '-').replace('.000Z', 'Z')
  return `${base.replace(/\/$/, '')}/${day}/${stamp}`
}

async function backUpTable(
  env: Env,
  backupPrefix: string,
  schema: SchemaRow,
): Promise<TableBackup> {
  const table = quoteIdentifier(schema.name)
  const count = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`)
    .first<{ count: number }>()
  const rowCount = Number(count?.count ?? 0)
  const parts: BackupPart[] = []

  for (let offset = 0, part = 0; offset < rowCount; offset += PAGE_SIZE, part++) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM ${table} LIMIT ? OFFSET ?`,
    ).bind(PAGE_SIZE, offset).all<Record<string, unknown>>()
    const ndjson = `${results.map(serializeRow).join('\n')}\n`
    const bytes = encoder.encode(ndjson)
    const key = `${backupPrefix}/tables/${encodeURIComponent(schema.name)}/part-${String(part).padStart(5, '0')}.ndjson`
    const checksum = await sha256(bytes)

    await env.BACKUPS.put(key, bytes, {
      httpMetadata: { contentType: 'application/x-ndjson' },
      customMetadata: {
        table: schema.name,
        rows: String(results.length),
        sha256: checksum,
      },
    })
    parts.push({ key, rows: results.length, bytes: bytes.byteLength, sha256: checksum })
  }

  return { name: schema.name, ddl: schema.sql, rowCount, parts }
}

async function deleteExpiredBackups(env: Env, now: Date): Promise<number> {
  const retentionDays = Math.max(1, Number.parseInt(env.RETENTION_DAYS, 10) || 35)
  const cutoff = now.getTime() - retentionDays * 86_400_000
  const prefix = `${env.BACKUP_PREFIX.replace(/\/$/, '')}/`
  let cursor: string | undefined
  let deleted = 0

  do {
    const page = await env.BACKUPS.list({ prefix, cursor, limit: 1_000 })
    const keys = page.objects
      .filter(object => object.key !== `${prefix}latest.json` && object.uploaded.getTime() < cutoff)
      .map(object => object.key)
    for (let offset = 0; offset < keys.length; offset += 500) {
      const batch = keys.slice(offset, offset + 500)
      if (batch.length) {
        await env.BACKUPS.delete(batch)
        deleted += batch.length
      }
    }
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor)

  return deleted
}

async function runBackup(env: Env): Promise<{
  manifestKey: string
  latestKey: string
  tableCount: number
  rowCount: number
  objectCount: number
  bytes: number
  deletedExpiredObjects: number
}> {
  const started = new Date()
  const prefix = timestampPrefix(env.BACKUP_PREFIX, started)
  const { results: schema } = await env.DB.prepare(`
    SELECT name, sql
    FROM sqlite_schema
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
    ORDER BY name
  `).all<SchemaRow>()

  const tables: TableBackup[] = []
  for (const table of schema) {
    tables.push(await backUpTable(env, prefix, table))
  }

  const manifest: BackupManifest = {
    format: 'lashpop-d1-ndjson-v1',
    database: 'lashpop-production',
    startedAt: started.toISOString(),
    completedAt: new Date().toISOString(),
    prefix,
    tableCount: tables.length,
    rowCount: tables.reduce((sum, table) => sum + table.rowCount, 0),
    tables,
  }
  const manifestBody = JSON.stringify(manifest, null, 2)
  const manifestKey = `${prefix}/manifest.json`
  const latestKey = `${env.BACKUP_PREFIX.replace(/\/$/, '')}/latest.json`
  const metadata = {
    tables: String(manifest.tableCount),
    rows: String(manifest.rowCount),
    completedAt: manifest.completedAt,
  }

  await env.BACKUPS.put(manifestKey, manifestBody, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: metadata,
  })
  await env.BACKUPS.put(latestKey, manifestBody, {
    httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
    customMetadata: metadata,
  })

  const deletedExpiredObjects = await deleteExpiredBackups(env, started)
  const objectCount = tables.reduce((sum, table) => sum + table.parts.length, 0) + 1
  const bytes = tables.reduce(
    (sum, table) => sum + table.parts.reduce((partSum, part) => partSum + part.bytes, 0),
    encoder.encode(manifestBody).byteLength,
  )

  return {
    manifestKey,
    latestKey,
    tableCount: manifest.tableCount,
    rowCount: manifest.rowCount,
    objectCount,
    bytes,
    deletedExpiredObjects,
  }
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      runBackup(env)
        .then(result => console.log('D1 backup complete', JSON.stringify(result)))
        .catch(error => console.error('D1 backup failed', error)),
    )
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true, service: 'lashpop-d1-backup' })
    }
    if (request.method !== 'POST' || url.pathname !== '/run') {
      return new Response('Not found', { status: 404 })
    }
    if (!env.MANUAL_TRIGGER_SECRET) {
      return new Response('Manual trigger not configured', { status: 503 })
    }
    if (request.headers.get('authorization') !== `Bearer ${env.MANUAL_TRIGGER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      return Response.json(await runBackup(env))
    } catch (error) {
      console.error('Manual D1 backup failed', error)
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      )
    }
  },
} satisfies ExportedHandler<Env>
