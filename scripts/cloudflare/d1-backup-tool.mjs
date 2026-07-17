#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync, writeSync, closeSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(import.meta.dirname, '../..')
const defaultWrangler = join(repoRoot, 'workers/d1-backup/node_modules/.bin/wrangler')
const revokedSessionTables = new Set(['session', 'punchlist_sessions'])

function usage(message) {
  if (message) console.error(`Error: ${message}\n`)
  console.error(`Usage:
  node scripts/cloudflare/d1-backup-tool.mjs download --bucket BUCKET --manifest-key KEY --dir DIR
  node scripts/cloudflare/d1-backup-tool.mjs verify --dir DIR
  node scripts/cloudflare/d1-backup-tool.mjs upload --bucket BUCKET --dir DIR [--update-latest]
  node scripts/cloudflare/d1-backup-tool.mjs drill --dir DIR --database FILE [--replace]

All Cloudflare operations use Wrangler's existing authentication. The drill command
only writes a local SQLite file and intentionally cannot target a remote D1 database.`)
  process.exit(message ? 1 : 0)
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  if (!command || command === '--help' || command === '-h') usage()
  const options = {}
  for (let index = 0; index < rest.length; index++) {
    const value = rest[index]
    if (!value.startsWith('--')) usage(`unexpected argument: ${value}`)
    const key = value.slice(2)
    if (key === 'update-latest' || key === 'replace') {
      options[key] = true
      continue
    }
    const next = rest[++index]
    if (!next || next.startsWith('--')) usage(`--${key} requires a value`)
    options[key] = next
  }
  return { command, options }
}

function required(options, name) {
  if (!options[name]) usage(`--${name} is required`)
  return options[name]
}

function run(program, args, options = {}) {
  const result = spawnSync(program, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  })
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`${program} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
  return result.stdout
}

function assertManifest(manifest) {
  if (manifest?.format !== 'lashpop-d1-ndjson-v1') {
    throw new Error(`unsupported backup format: ${manifest?.format ?? 'missing'}`)
  }
  if (!Array.isArray(manifest.tables) || typeof manifest.prefix !== 'string') {
    throw new Error('invalid manifest: tables or prefix missing')
  }
  for (const table of manifest.tables) {
    if (!table?.name || !Array.isArray(table.parts)) {
      throw new Error('invalid manifest: malformed table entry')
    }
    for (const part of table.parts) {
      if (!part?.key?.startsWith(`${manifest.prefix}/`)) {
        throw new Error(`part key is outside manifest prefix: ${part?.key ?? 'missing'}`)
      }
    }
  }
}

function readBackup(directory) {
  const manifestPath = join(resolve(directory), 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assertManifest(manifest)
  return { directory: resolve(directory), manifest, manifestPath }
}

function partPath(directory, tableName, partKey) {
  return join(directory, 'tables', encodeURIComponent(tableName), partKey.split('/').at(-1))
}

function wranglerGet(bucket, key, destination) {
  mkdirSync(dirname(destination), { recursive: true })
  run(defaultWrangler, [
    'r2', 'object', 'get', `${bucket}/${key}`, `--file=${destination}`, '--remote',
  ])
}

function wranglerPut(bucket, key, source) {
  run(defaultWrangler, [
    'r2', 'object', 'put', `${bucket}/${key}`, `--file=${source}`, '--remote',
  ])
}

function download(options) {
  const bucket = required(options, 'bucket')
  const manifestKey = required(options, 'manifest-key')
  const directory = resolve(required(options, 'dir'))
  if (existsSync(directory)) usage(`download directory already exists: ${directory}`)
  mkdirSync(directory, { recursive: true })
  const manifestPath = join(directory, 'manifest.json')
  wranglerGet(bucket, manifestKey, manifestPath)
  const { manifest } = readBackup(directory)
  let downloaded = 0
  for (const table of manifest.tables) {
    for (const part of table.parts) {
      wranglerGet(bucket, part.key, partPath(directory, table.name, part.key))
      downloaded++
    }
  }
  console.log(JSON.stringify({ ok: true, command: 'download', bucket, manifestKey, directory, parts: downloaded }))
}

function verifyBackup(directory, quiet = false) {
  const backup = readBackup(directory)
  let rowCount = 0
  let partCount = 0
  let bytes = 0
  for (const table of backup.manifest.tables) {
    let tableRows = 0
    for (const part of table.parts) {
      const localPath = partPath(backup.directory, table.name, part.key)
      const body = readFileSync(localPath)
      const digest = createHash('sha256').update(body).digest('hex')
      if (digest !== part.sha256) throw new Error(`checksum mismatch: ${part.key}`)
      if (body.byteLength !== part.bytes) throw new Error(`byte count mismatch: ${part.key}`)
      const lines = body.toString('utf8').split('\n').filter(Boolean)
      if (lines.length !== part.rows) throw new Error(`row count mismatch: ${part.key}`)
      for (const line of lines) JSON.parse(line)
      tableRows += lines.length
      partCount++
      bytes += body.byteLength
    }
    if (tableRows !== table.rowCount) throw new Error(`table row count mismatch: ${table.name}`)
    rowCount += tableRows
  }
  if (rowCount !== backup.manifest.rowCount) throw new Error('manifest total row count mismatch')
  if (backup.manifest.tables.length !== backup.manifest.tableCount) {
    throw new Error('manifest table count mismatch')
  }
  const result = {
    ok: true,
    command: 'verify',
    completedAt: backup.manifest.completedAt,
    tableCount: backup.manifest.tableCount,
    rowCount,
    partCount,
    bytes,
    schemaObjects: backup.manifest.schemaObjects?.length ?? 0,
  }
  if (!quiet) console.log(JSON.stringify(result))
  return { ...backup, result }
}

function upload(options) {
  const bucket = required(options, 'bucket')
  const backup = verifyBackup(required(options, 'dir'), true)
  let uploaded = 0
  for (const table of backup.manifest.tables) {
    for (const part of table.parts) {
      wranglerPut(bucket, part.key, partPath(backup.directory, table.name, part.key))
      uploaded++
    }
  }
  const canonicalManifestKey = `${backup.manifest.prefix}/manifest.json`
  wranglerPut(bucket, canonicalManifestKey, backup.manifestPath)
  if (options['update-latest']) {
    wranglerPut(bucket, 'backups/lashpop-d1/latest.json', backup.manifestPath)
  }
  console.log(JSON.stringify({
    ok: true,
    command: 'upload',
    bucket,
    manifestKey: canonicalManifestKey,
    updatedLatest: Boolean(options['update-latest']),
    parts: uploaded,
  }))
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function sqlValue(value) {
  if (value === null) return 'NULL'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('backup contains a non-finite number')
    return String(value)
  }
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`
  if (
    typeof value === 'object' &&
    value?.$type === 'base64' &&
    typeof value.value === 'string'
  ) {
    return `X'${Buffer.from(value.value, 'base64').toString('hex')}'`
  }
  throw new Error(`unsupported backup value: ${JSON.stringify(value).slice(0, 100)}`)
}

function writeRestoreSql(backup, sqlPath) {
  const fd = openSync(sqlPath, 'w')
  const write = value => writeSync(fd, value)
  try {
    write('PRAGMA foreign_keys=OFF;\nBEGIN IMMEDIATE;\n')
    for (const table of backup.manifest.tables) {
      if (!table.ddl) throw new Error(`table has no DDL: ${table.name}`)
      write(`${table.ddl};\n`)
    }
    for (const table of backup.manifest.tables) {
      for (const part of table.parts) {
        const body = readFileSync(partPath(backup.directory, table.name, part.key), 'utf8')
        for (const line of body.split('\n')) {
          if (!line) continue
          const row = JSON.parse(line)
          const columns = Object.keys(row)
          write(
            `INSERT INTO ${quoteIdentifier(table.name)} (` +
            `${columns.map(quoteIdentifier).join(', ')}) VALUES (` +
            `${columns.map(column => sqlValue(row[column])).join(', ')});\n`,
          )
        }
      }
    }
    for (const object of backup.manifest.schemaObjects ?? []) {
      if (object.sql) write(`${object.sql};\n`)
    }
    // Authentication sessions are intentionally excluded from a usable
    // restore. This prevents an older private archive from reactivating a
    // token that has since been revoked in production.
    for (const table of backup.manifest.tables) {
      if (revokedSessionTables.has(table.name)) {
        write(`DELETE FROM ${quoteIdentifier(table.name)};\n`)
      }
    }
    write('COMMIT;\nPRAGMA foreign_keys=ON;\n')
  } finally {
    closeSync(fd)
  }
}

function drill(options) {
  const directory = required(options, 'dir')
  const database = resolve(required(options, 'database'))
  if (existsSync(database) && !options.replace) {
    usage(`database already exists (pass --replace for a disposable drill file): ${database}`)
  }
  if (existsSync(database)) rmSync(database)
  mkdirSync(dirname(database), { recursive: true })
  const backup = verifyBackup(directory, true)
  const sqlPath = `${database}.restore.sql`
  writeRestoreSql(backup, sqlPath)
  try {
    run('sqlite3', [database], { input: readFileSync(sqlPath), encoding: null })
  } finally {
    rmSync(sqlPath, { force: true })
  }
  const integrity = run('sqlite3', [database, 'PRAGMA quick_check;']).trim()
  if (integrity !== 'ok') throw new Error(`SQLite quick_check failed: ${integrity}`)
  let restoredRows = 0
  for (const table of backup.manifest.tables) {
    const count = Number(run('sqlite3', [database, `SELECT COUNT(*) FROM ${quoteIdentifier(table.name)};`]).trim())
    const expectedRows = revokedSessionTables.has(table.name) ? 0 : table.rowCount
    if (count !== expectedRows) throw new Error(`restored row count mismatch: ${table.name}`)
    restoredRows += count
  }
  console.log(JSON.stringify({
    ok: true,
    command: 'drill',
    database,
    integrity,
    tableCount: backup.manifest.tableCount,
    rowCount: restoredRows,
    scrubbedTables: backup.manifest.tables
      .map(table => table.name)
      .filter(table => revokedSessionTables.has(table)),
    completedAt: backup.manifest.completedAt,
  }))
}

const { command, options } = parseArgs(process.argv.slice(2))
try {
  if (command === 'download') download(options)
  else if (command === 'verify') verifyBackup(required(options, 'dir'))
  else if (command === 'upload') upload(options)
  else if (command === 'drill') drill(options)
  else usage(`unknown command: ${command}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
