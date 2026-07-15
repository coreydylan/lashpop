/**
 * SQLite/D1 column compatibility helpers.
 *
 * The application schema was originally authored with Drizzle's PostgreSQL
 * builders. These helpers preserve the existing schema's data-level TypeScript
 * contract while emitting SQLite-compatible columns for Cloudflare D1.
 */
import {
  customType,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core"

export {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable as pgTable,
  text,
  unique,
}

export const uuid = (name: string) => text(name)

export const timestamp = (
  name: string,
  _config?: { withTimezone?: boolean; mode?: "date" | "string" },
) => integer(name, { mode: "timestamp_ms" })

export const boolean = (name: string) => integer(name, { mode: "boolean" })

export const jsonb = (name: string) => text(name, { mode: "json" })
export const json = jsonb

export const varchar = (
  name: string,
  _config?: { length?: number; enum?: readonly [string, ...string[]] },
) => text(name)

export const date = (name: string) => text(name)

export const smallint = (name: string) => integer(name)

const sqliteNumeric = customType<{
  data: string
  driverData: number
  config: { precision?: number; scale?: number }
}>({
  dataType: () => "real",
  toDriver: (value) => Number(value),
  fromDriver: (value) => String(value),
})

export const numeric = sqliteNumeric
export const decimal = sqliteNumeric

export function pgEnum<const TValues extends readonly [string, ...string[]]>(
  name: string,
  values: TValues,
) {
  return (columnName?: string) => text(columnName ?? name, { enum: values })
}
