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
  schemaObjects: SchemaObject[]
}

interface SchemaObject {
  type: 'index' | 'trigger' | 'view'
  name: string
  tableName: string
  sql: string
}

type BackupTrigger = 'scheduled' | 'manual'

interface BackupResult {
  manifestKey: string
  latestKey: string
  tableCount: number
  rowCount: number
  objectCount: number
  bytes: number
  deletedExpiredObjects: number
}

interface BackupAttempt extends Partial<BackupResult> {
  format: 'lashpop-d1-backup-attempt-v1'
  attemptId: string
  trigger: BackupTrigger
  status: 'running' | 'success' | 'failed'
  startedAt: string
  completedAt?: string
  error?: string
}

const PAGE_SIZE = 1_000
const encoder = new TextEncoder()

async function withRetry<T>(label: string, operation: () => Promise<T>): Promise<T> {
  const delays = [250, 1_000, 3_000]
  let lastError: unknown
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === delays.length) break
      console.warn(`${label} failed; retrying`, {
        attempt: attempt + 1,
        error: safeError(error),
      })
      await new Promise(resolve => setTimeout(resolve, delays[attempt]))
    }
  }
  throw lastError
}

function backupBase(env: Env): string {
  return env.BACKUP_PREFIX.replace(/\/$/, '')
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500)
}

async function putJson(env: Env, key: string, value: unknown): Promise<void> {
  const body = JSON.stringify(value, null, 2)
  await withRetry(`R2 put ${key}`, () => env.BACKUPS.put(key, body, {
    httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
  }).then(() => undefined))
}

function attemptKey(env: Env, attempt: BackupAttempt): string {
  const day = attempt.startedAt.slice(0, 10).replaceAll('-', '/')
  return `${backupBase(env)}/health/attempts/${day}/${attempt.attemptId}.json`
}

async function recordAttempt(env: Env, attempt: BackupAttempt): Promise<void> {
  await Promise.all([
    putJson(env, `${backupBase(env)}/health/latest-attempt.json`, attempt),
    putJson(env, attemptKey(env, attempt), attempt),
  ])
}

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

    await withRetry(`R2 put ${key}`, () => env.BACKUPS.put(key, bytes, {
      httpMetadata: { contentType: 'application/x-ndjson' },
      customMetadata: {
        table: schema.name,
        rows: String(results.length),
        sha256: checksum,
      },
    }).then(() => undefined))
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
  const { results: schemaObjects } = await env.DB.prepare(`
    SELECT type, name, tbl_name AS tableName, sql
    FROM sqlite_schema
    WHERE type IN ('index', 'trigger', 'view')
      AND sql IS NOT NULL
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
    ORDER BY CASE type WHEN 'view' THEN 1 WHEN 'index' THEN 2 ELSE 3 END, name
  `).all<SchemaObject>()

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
    schemaObjects,
  }
  const manifestBody = JSON.stringify(manifest, null, 2)
  const manifestKey = `${prefix}/manifest.json`
  const latestKey = `${env.BACKUP_PREFIX.replace(/\/$/, '')}/latest.json`
  const metadata = {
    tables: String(manifest.tableCount),
    rows: String(manifest.rowCount),
    completedAt: manifest.completedAt,
  }

  await withRetry(`R2 put ${manifestKey}`, () => env.BACKUPS.put(manifestKey, manifestBody, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: metadata,
  }).then(() => undefined))
  await withRetry(`R2 put ${latestKey}`, () => env.BACKUPS.put(latestKey, manifestBody, {
    httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' },
    customMetadata: metadata,
  }).then(() => undefined))

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

async function runTrackedBackup(env: Env, trigger: BackupTrigger): Promise<BackupResult> {
  const startedAt = new Date().toISOString()
  const attempt: BackupAttempt = {
    format: 'lashpop-d1-backup-attempt-v1',
    attemptId: `${startedAt.replaceAll(':', '-')}-${crypto.randomUUID()}`,
    trigger,
    status: 'running',
    startedAt,
  }

  try {
    await recordAttempt(env, attempt)
    const result = await runBackup(env)
    const success: BackupAttempt = {
      ...attempt,
      ...result,
      status: 'success',
      completedAt: new Date().toISOString(),
    }
    await Promise.all([
      recordAttempt(env, success),
      putJson(env, `${backupBase(env)}/health/latest-success.json`, success),
    ])
    return result
  } catch (error) {
    const failed: BackupAttempt = {
      ...attempt,
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: safeError(error),
    }
    try {
      await recordAttempt(env, failed)
    } catch (statusError) {
      console.error('Could not persist backup failure status', statusError)
    }
    throw error
  }
}

async function readJson<T>(object: R2ObjectBody | null): Promise<T | null> {
  if (!object) return null
  return object.json<T>()
}

async function backupHealth(env: Env): Promise<Response> {
  const [attempt, success, legacyManifest] = await Promise.all([
    env.BACKUPS.get(`${backupBase(env)}/health/latest-attempt.json`).then(readJson<BackupAttempt>),
    env.BACKUPS.get(`${backupBase(env)}/health/latest-success.json`).then(readJson<BackupAttempt>),
    env.BACKUPS.get(`${backupBase(env)}/latest.json`).then(readJson<BackupManifest>),
  ])
  const completedAt = success?.completedAt ?? legacyManifest?.completedAt ?? null
  const ageHours = completedAt
    ? Math.max(0, (Date.now() - Date.parse(completedAt)) / 3_600_000)
    : null
  const maxAgeHours = 30
  const failedAfterSuccess = Boolean(
    attempt?.status === 'failed' &&
      (!completedAt || Date.parse(attempt.startedAt) > Date.parse(completedAt)),
  )
  const healthy = ageHours !== null && ageHours <= maxAgeHours && !failedAfterSuccess

  return Response.json(
    {
      ok: healthy,
      service: 'lashpop-d1-backup',
      latestAttempt: attempt ?? null,
      latestSuccess: success ?? (legacyManifest
        ? {
            status: 'success',
            startedAt: legacyManifest.startedAt,
            completedAt: legacyManifest.completedAt,
            manifestKey: `${legacyManifest.prefix}/manifest.json`,
            tableCount: legacyManifest.tableCount,
            rowCount: legacyManifest.rowCount,
            legacy: true,
          }
        : null),
      ageHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
      maxAgeHours,
    },
    { status: healthy ? 200 : 503 },
  )
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      runTrackedBackup(env, 'scheduled')
        .then(result => console.log('D1 backup complete', JSON.stringify(result))),
    )
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return backupHealth(env)
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
      return Response.json(await runTrackedBackup(env, 'manual'))
    } catch (error) {
      console.error('Manual D1 backup failed', error)
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      )
    }
  },
} satisfies ExportedHandler<Env>
