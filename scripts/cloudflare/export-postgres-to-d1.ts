import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import postgres from "postgres"

interface ColumnMetadata {
  table_name: string
  column_name: string
  data_type: string
  udt_name: string
  ordinal_position: number
}

interface ForeignKeyMetadata {
  child: string
  parent: string
}

interface PrimaryKeyMetadata {
  table_name: string
  column_name: string
  ordinal_position: number
}

const sourceUrl = process.env.SOURCE_DATABASE_URL
const outputDirectory = process.env.D1_EXPORT_DIR

if (!sourceUrl) {
  throw new Error("SOURCE_DATABASE_URL is required")
}
if (!outputDirectory) {
  throw new Error("D1_EXPORT_DIR is required")
}

const sql = postgres(sourceUrl, {
  max: 1,
  prepare: false,
  idle_timeout: 5,
})

function assertIdentifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`)
  }
  return value
}

function quoteIdentifier(value: string): string {
  return `"${assertIdentifier(value)}"`
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL"
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Cannot serialize non-finite number: ${value}`)
    return String(value)
  }
  if (typeof value === "boolean") return value ? "1" : "0"
  if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`
  throw new Error(`Unsupported SQL value type: ${typeof value}`)
}

function convertValue(value: unknown, column: ColumnMetadata): unknown {
  if (value === null || value === undefined) return null

  if (column.data_type.startsWith("timestamp")) {
    const timestamp = value instanceof Date ? value : new Date(String(value))
    const epochMilliseconds = timestamp.getTime()
    if (!Number.isFinite(epochMilliseconds)) {
      throw new Error(`Invalid timestamp for ${column.table_name}.${column.column_name}`)
    }
    return epochMilliseconds
  }

  if (column.data_type === "boolean") return value ? 1 : 0
  if (column.data_type === "json" || column.data_type === "jsonb" || column.data_type === "ARRAY") {
    return JSON.stringify(value)
  }
  if (column.data_type === "numeric" || column.data_type === "real" || column.data_type === "double precision") {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) {
      throw new Error(`Invalid numeric value for ${column.table_name}.${column.column_name}`)
    }
    return numericValue
  }

  return value
}

function topologicalOrder(tables: string[], foreignKeys: ForeignKeyMetadata[]): string[] {
  const tableSet = new Set(tables)
  const incoming = new Map(tables.map((table) => [table, 0]))
  const children = new Map(tables.map((table) => [table, new Set<string>()]))

  for (const { child, parent } of foreignKeys) {
    if (!tableSet.has(child) || !tableSet.has(parent) || child === parent) continue
    const childSet = children.get(parent)
    if (!childSet || childSet.has(child)) continue
    childSet.add(child)
    incoming.set(child, (incoming.get(child) ?? 0) + 1)
  }

  const ready = tables.filter((table) => incoming.get(table) === 0).sort()
  const ordered: string[] = []

  while (ready.length > 0) {
    const table = ready.shift()
    if (!table) break
    ordered.push(table)

    for (const child of [...(children.get(table) ?? [])].sort()) {
      const remaining = (incoming.get(child) ?? 0) - 1
      incoming.set(child, remaining)
      if (remaining === 0) {
        ready.push(child)
        ready.sort()
      }
    }
  }

  if (ordered.length !== tables.length) {
    const unresolved = tables.filter((table) => !ordered.includes(table))
    throw new Error(`Foreign-key cycle detected: ${unresolved.join(", ")}`)
  }

  return ordered
}

function createInsertStatements(
  table: string,
  columns: ColumnMetadata[],
  rows: Record<string, unknown>[],
): string[] {
  if (rows.length === 0) return []

  const columnSql = columns.map((column) => quoteIdentifier(column.column_name)).join(", ")
  const prefix = `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES\n`
  const statements: string[] = []
  let values: string[] = []
  let currentBytes = Buffer.byteLength(prefix)

  for (const row of rows) {
    const tuple = `(${columns
      .map((column) => sqlLiteral(convertValue(row[column.column_name], column)))
      .join(", ")})`
    const tupleBytes = Buffer.byteLength(tuple) + 2

    if (values.length > 0 && currentBytes + tupleBytes > 64 * 1024) {
      statements.push(`${prefix}${values.join(",\n")};`)
      values = []
      currentBytes = Buffer.byteLength(prefix)
    }

    values.push(tuple)
    currentBytes += tupleBytes
  }

  if (values.length > 0) {
    statements.push(`${prefix}${values.join(",\n")};`)
  }

  return statements
}

async function main() {
  const columns = await sql<ColumnMetadata[]>`
    SELECT table_name, column_name, data_type, udt_name, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name NOT LIKE '\\_%' ESCAPE '\\'
    ORDER BY table_name, ordinal_position
  `

  const foreignKeys = await sql<ForeignKeyMetadata[]>`
    SELECT tc.table_name AS child, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = tc.constraint_schema
     AND ccu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
  `

  const primaryKeys = await sql<PrimaryKeyMetadata[]>`
    SELECT tc.table_name, kcu.column_name, kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_schema = tc.constraint_schema
     AND kcu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY tc.table_name, kcu.ordinal_position
  `

  const columnsByTable = Map.groupBy(columns, (column) => column.table_name)
  const primaryKeysByTable = Map.groupBy(primaryKeys, (column) => column.table_name)
  const orderedTables = topologicalOrder([...columnsByTable.keys()].sort(), foreignKeys)

  await mkdir(outputDirectory, { recursive: false })

  const manifest: {
    generatedAt: string
    source: string
    totalRows: number
    tables: { name: string; rows: number; file: string; sha256: string }[]
  } = {
    generatedAt: new Date().toISOString(),
    source: "verified LashPop PostgreSQL backup restored locally",
    totalRows: 0,
    tables: [],
  }

  for (const [index, table] of orderedTables.entries()) {
    const tableColumns = columnsByTable.get(table)
    if (!tableColumns) throw new Error(`Missing column metadata for ${table}`)

    const orderColumns = primaryKeysByTable.get(table)?.map((column) => column.column_name) ?? []
    const orderBy = orderColumns.length > 0
      ? ` ORDER BY ${orderColumns.map(quoteIdentifier).join(", ")}`
      : ""
    const query = `SELECT * FROM public.${quoteIdentifier(table)}${orderBy}`
    const rows = await sql.unsafe<Record<string, unknown>[]>(query)
    const statements = createInsertStatements(table, tableColumns, rows)
    const contents = [
      `-- ${table}: ${rows.length} rows`,
      ...statements,
      "",
    ].join("\n")
    const file = `${String(index + 1).padStart(3, "0")}-${table}.sql`

    await writeFile(path.join(outputDirectory, file), contents, { mode: 0o600 })
    manifest.totalRows += rows.length
    manifest.tables.push({
      name: table,
      rows: rows.length,
      file,
      sha256: createHash("sha256").update(contents).digest("hex"),
    })
  }

  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o600 },
  )

  console.log(JSON.stringify({
    outputDirectory,
    tables: manifest.tables.length,
    totalRows: manifest.totalRows,
  }))
}

void main()
  .then(async () => {
    await sql.end()
  })
  .catch(async (error: unknown) => {
    await sql.end()
    console.error(error)
    process.exitCode = 1
  })
