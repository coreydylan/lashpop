import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

export type Db = DrizzleD1Database<Record<string, never>>

export function openDb(database: D1Database): Db {
  return drizzle(database)
}
